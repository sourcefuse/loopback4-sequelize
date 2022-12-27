import {
  AnyObject,
  BelongsToDefinition,
  Count,
  DataObject,
  DefaultCrudRepository,
  Entity,
  EntityNotFoundError,
  KeyOf,
  Fields,
  Filter,
  FilterExcludingWhere,
  HasManyDefinition,
  HasOneDefinition,
  InclusionFilter,
  PropertyDefinition,
  RelationType as LoopbackRelationType,
  Where,
  Inclusion,
  PropertyType,
  ReferencesManyDefinition,
} from '@loopback/repository';
import debugFactory from 'debug';
import {
  Attributes,
  DataType,
  DataTypes,
  FindAttributeOptions,
  Identifier,
  Includeable,
  Model,
  ModelAttributeColumnOptions,
  ModelAttributes,
  ModelStatic,
  Op,
  Order,
  SyncOptions,
  WhereOptions,
} from 'sequelize';
import {MakeNullishOptional} from 'sequelize/types/utils';
import {operatorTranslations} from './operator-translation';
import {SequelizeDataSource} from './sequelize.datasource.base';
import {SequelizeModel} from './sequelize.model';
import {isTruelyObject} from './utils';
const debug = debugFactory('loopback:sequelize:repository');
const debugModelBuilder = debugFactory('loopback:sequelize:modelbuilder');

/**
 * Implementation of Sequelize repository based on the interface of `DefaultCrudRepository`
 */
export class SequelizeRepository<
  T extends Entity,
  ID,
  Relations extends object = {},
> extends DefaultCrudRepository<T, ID, Relations> {
  constructor(
    public entityClass: typeof Entity & {
      prototype: T;
    },
    public dataSource: SequelizeDataSource,
  ) {
    super(entityClass, dataSource);

    if (this.dataSource.sequelize) {
      this.sequelizeModel = this.getSequelizeModel();
    }
  }
  /**
   * Default `order` filter style if only column name is specified
   */
  readonly DEFAULT_ORDER_STYLE = 'ASC';

  /**
   * Object keys used in models for set database specific settings.
   * Example: In model property definition one can use postgresql dataType as float
   * {
   *   type: 'number',
   *   postgresql: {
   *     dataType: 'float',
   *     precision: 20,
   *     scale: 4,
   *   },
   * }
   *
   * This array of keys is used while building model definition for sequelize.
   */
  readonly DB_SPECIFIC_SETTINGS_KEYS = [
    'postgresql',
    'mysql',
    'sqlite3',
  ] as const;

  /**
   * Sequelize Model Instance created from the model definition received from the `entityClass`
   */
  sequelizeModel: ModelStatic<Model<T>>;

  async create(entity: DataObject<T>, options?: AnyObject): Promise<T> {
    let err = null;
    const data = await this.sequelizeModel
      .create(entity as MakeNullishOptional<T>, options)
      .catch(error => {
        console.error(error);
        err = error;
      });
    if (data) {
      return new this.entityClass(this.excludeHiddenProps(data.toJSON())) as T;
    } else {
      throw new Error(err ?? 'Something went wrong');
    }
  }

  // `updateById` is not implemented separately because the existing one in
  // `DefaultCrudRepository` internally calls `updateAll` method that is handled below

  async updateAll(
    data: DataObject<T>,
    where?: Where<T>,
    options?: AnyObject,
  ): Promise<Count> {
    const [affectedCount] = await this.sequelizeModel.update(
      Object.assign({} as AnyObject, data),
      {
        where: this.buildSequelizeWhere(where),
        ...options,
      },
    );
    return {count: affectedCount};
  }

  async find(
    filter?: Filter<T>,
    options?: AnyObject,
  ): Promise<(T & Relations)[]> {
    let data = await this.sequelizeModel
      .findAll({
        include: this.buildSequelizeIncludeFilter(filter?.include),
        where: this.buildSequelizeWhere(filter?.where),
        attributes: this.buildSequelizeAttributeFilter(filter?.fields),
        order: this.buildSequelizeOrder(filter?.order),
        limit: filter?.limit,
        offset: filter?.offset ?? filter?.skip,
        ...options,
      })
      .catch(err => {
        debug('findAll() error:', err);
        throw new Error(err);
      });

    return this.includeReferencesIfRequested(
      data,
      this.entityClass,
      filter?.include,
    );
  }

  async findById(
    id: ID,
    filter?: FilterExcludingWhere<T>,
    options?: AnyObject,
  ): Promise<T & Relations> {
    const data = await this.sequelizeModel.findByPk(
      id as unknown as Identifier,
      {
        order: this.buildSequelizeOrder(filter?.order),
        attributes: this.buildSequelizeAttributeFilter(filter?.fields),
        include: this.buildSequelizeIncludeFilter(filter?.include),
        limit: filter?.limit,
        offset: filter?.offset ?? filter?.skip,
        ...options,
      },
    );
    if (!data) {
      throw new EntityNotFoundError(this.entityClass, id);
    }
    return this.excludeHiddenProps(data.toJSON());
  }

  replaceById(
    id: ID,
    data: DataObject<T>,
    options?: AnyObject | undefined,
  ): Promise<void> {
    const idProp = this.modelClass.definition.idName();
    if (idProp in data) {
      delete data[idProp as keyof typeof data];
    }
    return this.updateById(id, data, options);
  }

  async deleteAll(
    where?: Where<T> | undefined,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    const count = await this.sequelizeModel.destroy({
      where: this.buildSequelizeWhere(where),
      ...options,
    });
    return {count};
  }

  async deleteById(id: ID, options?: AnyObject | undefined): Promise<void> {
    const idProp = this.modelClass.definition.idName();

    if (id === undefined) {
      throw new Error(`Invalid Argument: ${idProp} cannot be undefined`);
    }

    const where = {} as Where<T>;
    (where as AnyObject)[idProp] = id;
    const result = await this.deleteAll(where, options);

    if (result.count === 0) {
      throw new EntityNotFoundError(this.entityClass, id);
    }
  }

  async count(where?: Where<T>, options?: AnyObject): Promise<Count> {
    const count = await this.sequelizeModel.count({
      where: this.buildSequelizeWhere<T>(where),
      ...options,
    });

    return {count};
  }

  /**
   * Get Sequelize Operator
   * @param key Name of the operator used in loopback eg. lt
   * @returns Equivalent operator symbol if available in Sequelize eg `Op.lt`
   */
  protected getSequelizeOperator(key: keyof typeof operatorTranslations) {
    const sequelizeOperator = operatorTranslations[key];
    if (!sequelizeOperator) {
      throw Error(`There is no equivalent operator for "${key}" in sequelize.`);
    }
    return sequelizeOperator;
  }

  /**
   * Get Sequelize `attributes` filter value from `fields` of loopback.
   * @param fields Loopback styles `fields` options. eg. `["name", "age"]`, `{ id: false }`
   * @returns Sequelize Compatible Object/Array based on the fields provided. eg. `{ "exclude": ["id"] }`
   */
  protected buildSequelizeAttributeFilter(
    fields?: Fields,
  ): FindAttributeOptions | undefined {
    if (fields === undefined) {
      return undefined;
    }

    if (Array.isArray(fields)) {
      // Both (sequelize and loopback filters) consider array as "only columns to include"
      return fields;
    }

    const sequelizeFields: FindAttributeOptions = {
      include: [],
      exclude: [],
    };

    // Push column having `false` values in `exclude` key and columns
    // having `true` in `include` key
    if (isTruelyObject(fields)) {
      for (const key in fields) {
        if (fields[key] === true) {
          sequelizeFields.include?.push(key);
        } else if (fields[key] === false) {
          sequelizeFields.exclude?.push(key);
        }
      }
    }

    if (
      Array.isArray(sequelizeFields.include) &&
      sequelizeFields.include.length > 0
    ) {
      delete sequelizeFields.exclude;
      return sequelizeFields.include;
    }

    if (
      Array.isArray(sequelizeFields.exclude) &&
      sequelizeFields.exclude.length > 0
    ) {
      delete sequelizeFields.include;
    }
    return sequelizeFields;
  }

  /**
   * Get Sequelize Order filter value from loopback style order value
   * @param order Sorting order in loopback style filter. eg. `title ASC`, `["id DESC", "age ASC"]`
   * @returns Sequelize compatible order filter value
   */
  protected buildSequelizeOrder(order?: string[] | string): Order | undefined {
    if (order === undefined) {
      return undefined;
    }

    if (typeof order === 'string') {
      const [columnName, orderType] = order.trim().split(' ');
      return [[columnName, orderType ?? this.DEFAULT_ORDER_STYLE]];
    }

    return order.map(orderStr => {
      const [columnName, orderType] = orderStr.trim().split(' ');
      return [columnName, orderType ?? this.DEFAULT_ORDER_STYLE];
    });
  }

  /**
   * Build Sequelize compatible `include` filter
   * @param inclusionFilters - loopback style `where` condition
   * @param sourceModel - sequelize model instance
   * @returns Sequelize compatible `Includeable` array
   */
  protected buildSequelizeIncludeFilter(
    inclusionFilters?: Array<InclusionFilter & {required?: boolean}>,
    sourceModel?: ModelStatic<Model<T>>,
  ): Includeable[] {
    if (!inclusionFilters || inclusionFilters.length === 0) {
      return [];
    }

    if (!sourceModel) {
      sourceModel = this.sequelizeModel;
    }

    const includable: Includeable[] = [];

    for (const filter of inclusionFilters) {
      if (typeof filter === 'string') {
        if (filter in sourceModel.associations) {
          includable.push(filter);
        } else {
          debug(
            `Relation '${filter}' is not available in sequelize model associations. If it's referencesMany relation it will fallback to loopback inclusion resolver.`,
          );
        }
      } else if (typeof filter === 'object') {
        if (!(filter.relation in sourceModel.associations)) {
          debug(
            `Relation '${filter.relation}' is not available in sequelize model associations. If it's referencesMany relation it will fallback to loopback inclusion resolver.`,
          );
          continue;
        }

        includable.push({
          model: sourceModel.associations[filter.relation].target,
          where: this.buildSequelizeWhere(filter.scope?.where),
          limit: filter.scope?.totalLimit ?? filter.scope?.limit,
          attributes: this.buildSequelizeAttributeFilter(filter.scope?.fields),
          include: this.buildSequelizeIncludeFilter(
            filter.scope?.include,
            sourceModel.associations[filter.relation].target,
          ),
          order: this.buildSequelizeOrder(filter.scope?.order),
          as: filter.relation,

          /**
           * If true, uses an inner join, which means that the parent model will only be loaded if it has any matching children.
           */
          required: !!filter.required,

          /**
           * saperate: true is required for `order` and `limit` filter to work, it runs include in saperate queries
           */
          separate:
            !!filter.scope?.order ||
            !!(filter.scope?.totalLimit ?? filter.scope?.limit),
        });
      }
    }

    return includable;
  }

  /**
   * Build Sequelize compatible where condition object
   * @param where loopback style `where` condition
   * @returns Sequelize compatible where options to be used in queries
   */
  protected buildSequelizeWhere<MT extends T>(
    where?: Where<MT>,
  ): WhereOptions<MT> {
    if (!where) {
      return {};
    }

    const sequelizeWhere: WhereOptions = {};

    /**
     * Handle model attribute conditions like `{ age: { gt: 18 } }`, `{ email: "a@b.c" }`
     * Transform Operators - eg. `{ gt: 0, lt: 10 }` to `{ [Op.gt]: 0, [Op.lt]: 10 }`
     */
    for (const columnName in where) {
      const conditionValue = <Object | Array<Object> | number | string | null>(
        where[columnName as keyof typeof where]
      );

      if (isTruelyObject(conditionValue)) {
        sequelizeWhere[columnName] = {};

        for (const lb4Operator of Object.keys(<Object>conditionValue)) {
          const sequelizeOperator = this.getSequelizeOperator(
            lb4Operator as keyof typeof operatorTranslations,
          );
          sequelizeWhere[columnName][sequelizeOperator] =
            conditionValue![lb4Operator as keyof typeof conditionValue];
        }
      } else if (
        ['and', 'or'].includes(columnName) &&
        Array.isArray(conditionValue)
      ) {
        /**
         * Eg. {and: [{title: 'My Post'}, {content: 'Hello'}]}
         */
        const sequelizeOperator = this.getSequelizeOperator(
          columnName as 'and' | 'or',
        );
        const conditions = conditionValue.map((condition: unknown) => {
          return this.buildSequelizeWhere<MT>(condition as Where<MT>);
        });
        Object.assign(sequelizeWhere, {
          [sequelizeOperator]: conditions,
        });
      } else {
        // Equals
        sequelizeWhere[columnName] = {
          [Op.eq]: conditionValue,
        };
      }
    }

    return sequelizeWhere;
  }

  /**
   * Get Sequelize Model
   * @returns Sequelize Model Instance based on the definitions from `entityClass`
   */
  protected getSequelizeModel(entityClass = this.entityClass) {
    if (!this.dataSource.sequelize) {
      throw Error(
        `The datasource "${this.dataSource.name}" doesn't have sequelize instance bound to it.`,
      );
    }

    if (this.dataSource.sequelize.models[entityClass.modelName]) {
      // Model Already Defined by Sequelize before
      return this.dataSource.sequelize.models[entityClass.modelName];
    }

    // TODO: Make it more flexible, check support of all possible definition props
    const sourceModel = this.dataSource.sequelize.define(
      entityClass.modelName,
      this.getSequelizeModelAttributes(entityClass.definition.properties),
      {
        timestamps: false,
        tableName: entityClass.modelName.toLowerCase(),
        freezeTableName: true,
      },
    );

    // Setup associations
    for (const key in entityClass.definition.relations) {
      const targetModel = this.getSequelizeModel(
        entityClass.definition.relations[key].target(),
      );

      debugModelBuilder(
        `Setting up relation`,
        entityClass.definition.relations[key],
      );

      if (
        entityClass.definition.relations[key].type ===
        LoopbackRelationType.belongsTo
      ) {
        const foreignKey = (
          entityClass.definition.relations[key] as BelongsToDefinition
        ).keyTo;
        sourceModel.belongsTo(targetModel, {
          foreignKey: {name: foreignKey},

          // Which client will pass on in loopback style include filter, eg. `include: ["thisName"]`
          as: entityClass.definition.relations[key].name,
        });
      } else if (
        entityClass.definition.relations[key].type ===
        LoopbackRelationType.hasOne
      ) {
        const foreignKey = (
          entityClass.definition.relations[key] as HasOneDefinition
        ).keyTo;

        sourceModel.hasOne(targetModel, {
          foreignKey: foreignKey,
          as: entityClass.definition.relations[key].name,
        });
      } else if (
        entityClass.definition.relations[key].type ===
        LoopbackRelationType.hasMany
      ) {
        const relationDefinition = entityClass.definition.relations[
          key
        ] as HasManyDefinition;
        const through = relationDefinition.through;
        const foreignKey = relationDefinition.keyTo;
        if (through) {
          const keyTo = through.keyTo;
          const keyFrom = through.keyFrom;
          // Setup hasMany through
          const throughModel = this.getSequelizeModel(through.model());

          sourceModel.belongsToMany(targetModel, {
            through: {model: throughModel},
            otherKey: keyTo,
            foreignKey: keyFrom,
            as: entityClass.definition.relations[key].name,
          });
        } else {
          sourceModel.hasMany(targetModel, {
            foreignKey: foreignKey,
            as: entityClass.definition.relations[key].name,
          });
        }
      }
    }

    debugModelBuilder(
      'Table name supplied to sequelize'.concat(
        `"${entityClass.modelName.toLowerCase()}"`,
      ),
    );

    return sourceModel;
  }

  /**
   * Run CREATE TABLE query for the target sequelize model, Useful for quick testing
   * @param options Sequelize Sync Options
   */
  async syncSequelizeModel(options: SyncOptions = {}) {
    await this.dataSource.sequelize?.models[this.entityClass.modelName]
      .sync(options)
      .catch(console.error);
  }

  /**
   * Get Sequelize Model Attributes
   * @param definition property definition received from loopback entityClass eg. `{ id: { type: "Number", id: true } }`
   * @returns model attributes supported in sequelize model definiotion
   *
   * TODO: Verify all possible loopback types https://loopback.io/doc/en/lb4/LoopBack-types.html
   */
  protected getSequelizeModelAttributes(definition: {
    [name: string]: PropertyDefinition;
  }): ModelAttributes<SequelizeModel, Attributes<SequelizeModel>> {
    debugModelBuilder('loopback model definition', definition);

    const sequelizeDefinition: ModelAttributes = {};

    for (const propName in definition) {
      // Set data type, defaults to `DataTypes.STRING`
      let dataType: DataType = DataTypes.STRING;

      const isString =
        definition[propName].type === String ||
        ['String', 'string'].includes(definition[propName].type.toString());

      if (
        definition[propName].type === Number ||
        ['Number', 'number'].includes(definition[propName].type.toString())
      ) {
        dataType = DataTypes.NUMBER;

        // handle float
        for (let dbKey of this.DB_SPECIFIC_SETTINGS_KEYS) {
          if (!definition[propName].hasOwnProperty(dbKey)) {
            continue;
          }

          let dbSpecificSetting = definition[propName][dbKey] as {
            dataType: string;
          };

          if (
            ['double precision', 'float', 'real'].includes(
              dbSpecificSetting.dataType,
            )
          ) {
            // TODO: Handle precision
            dataType = DataTypes.FLOAT;
          }
        }
      }

      if (
        definition[propName].type === Boolean ||
        ['Boolean', 'boolean'].includes(definition[propName].type.toString())
      ) {
        dataType = DataTypes.BOOLEAN;
      }

      if (
        definition[propName].type === Array ||
        ['Array', 'array'].includes(definition[propName].type.toString())
      ) {
        // Postgres only
        dataType = DataTypes.ARRAY(DataTypes.INTEGER);
      }

      if (
        definition[propName].type === Object ||
        ['object', 'Object'].includes(definition[propName].type.toString())
      ) {
        // Postgres only, JSON dataType
        dataType = DataTypes.JSON;
      }

      if (
        definition[propName].type === Date ||
        ['date', 'Date'].includes(definition[propName].type.toString())
      ) {
        dataType = DataTypes.DATE;
      }

      if (dataType === DataTypes.STRING && !isString) {
        throw Error(
          `Unhandled DataType "${definition[
            propName
          ].type.toString()}" for column "${propName}" in sequelize extension`,
        );
      }

      const columnOptions: ModelAttributeColumnOptions = {
        type: dataType,
      };

      // Set column as `primaryKey` when id is set to true (which is loopback way to define primary key)
      if (definition[propName].id === true) {
        if (columnOptions.type === DataTypes.NUMBER) {
          columnOptions.type = DataTypes.INTEGER;
        }
        Object.assign(columnOptions, {
          primaryKey: true,
          autoIncrement: columnOptions.type === DataTypes.INTEGER,
        } as typeof columnOptions);
      }

      // 🛑 TEMPORARILY lowercasing the column names for postgres
      // TODO: get the column name casing using actual methods / conventions used in different sql connectors for loopback
      columnOptions.field =
        definition[propName]['name'] ?? propName.toLowerCase();

      sequelizeDefinition[propName] = columnOptions;
    }

    debugModelBuilder('Sequelize model definition', sequelizeDefinition);
    return sequelizeDefinition;
  }

  /**
   * Remove hidden properties specified in model from response body. (See:  https://github.com/sourcefuse/loopback4-sequelize/issues/3)
   * @param entity normalized entity. You can use `entity.toJSON()`'s value
   * @returns normalized entity excluding the hiddenProperties
   */
  protected excludeHiddenProps(entity: T & Relations): T & Relations {
    const hiddenProps = this.entityClass.definition.settings.hiddenProperties;
    if (!hiddenProps) {
      return entity;
    }

    for (const propertyName of hiddenProps as Array<keyof typeof entity>) {
      delete entity[propertyName];
    }

    return entity;
  }

  /**
   * Include related entities of `@referencesMany` relation
   *
   * referencesMany relation is NOT handled by `sequelizeModel.findAll` as it doesn't have any direct alternative to it,
   * so to include relation data of referencesMany, we're manually fetching related data requested
   *
   * @param parentEntities source table data
   * @param filter actual payload passed in request
   * @param parentEntityClass loopback entity class for the parent entity
   * @returns entities with related models in them
   */
  protected async includeReferencesIfRequested(
    parentEntities: Model<T, T>[],
    parentEntityClass: typeof Entity,
    inclusionFilters?: InclusionFilter[],
  ): Promise<(T & Relations)[]> {
    if (!parentEntityClass) {
      parentEntityClass = this.entityClass;
    }
    /**
     * All columns names defined in model with `@referencesMany`
     */
    const allReferencesColumns: string[] = [];
    for (const key in parentEntityClass.definition.relations) {
      if (
        parentEntityClass.definition.relations[key].type ===
        LoopbackRelationType.referencesMany
      ) {
        let loopbackRelationObject = parentEntityClass.definition.relations[
          key
        ] as ReferencesManyDefinition;
        if (loopbackRelationObject.keyFrom) {
          allReferencesColumns.push(loopbackRelationObject.keyFrom);
        }
      }
    }

    // Validate data type of items in any column having references
    // For eg. convert ["1", "2"] into [1, 2] if `itemType` specified is `number[]`
    let normalizedParentEntities = parentEntities.map(entity => {
      let data = entity.toJSON();
      for (let columnName in data) {
        if (!allReferencesColumns.includes(columnName)) {
          // Column is not the one used for referencesMany relation. Eg. "programmingLanguageIds"
          continue;
        }

        let columnDefinition =
          parentEntityClass.definition.properties[columnName];
        if (
          columnDefinition.type !== Array ||
          !Array.isArray(data[columnName])
        ) {
          // Column type or data received is not array, wrong configuration/data
          continue;
        }

        // Loop over all references in array received
        let items = data[columnName] as unknown as Array<String | Number>;

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
          if (
            columnDefinition.itemType === Number &&
            typeof items[itemIndex] === 'string'
          ) {
            items[itemIndex] = parseInt(items[itemIndex] as string);
          }
        }

        data[columnName] = items as unknown as T[Extract<keyof T, string>];
      }

      return data;
    });

    // Requested inclusions of referencesMany relation
    let referencesManyInclusions: Array<{
      /**
       * Target Include filter entry
       */
      filter: Inclusion;
      /**
       * Loopback relation definition
       */
      definition: ReferencesManyDefinition;
      /**
       * Distinct foreignKey values of child model
       * example: [1, 2, 4, 8]
       */
      keys: Array<T[any]>;
    }> = [];

    for (let includeFilter of inclusionFilters ?? []) {
      if (typeof includeFilter === 'string') {
        includeFilter = {relation: includeFilter} as Inclusion;
      }
      let relationName = includeFilter.relation;
      let relation = parentEntityClass.definition.relations[relationName];
      if (relation.type === LoopbackRelationType.referencesMany) {
        referencesManyInclusions.push({
          filter: includeFilter,
          definition: relation as ReferencesManyDefinition,
          keys: [],
        });
      }
    }

    if (referencesManyInclusions.length === 0) {
      return normalizedParentEntities as (T & Relations)[];
    }

    for (let relation of referencesManyInclusions) {
      normalizedParentEntities.forEach(entity => {
        if (!relation.definition.keyFrom) {
          return;
        }

        let columnValue = entity[relation.definition.keyFrom as keyof T];

        if (Array.isArray(columnValue)) {
          relation.keys.push(...columnValue);
        } else {
          // column value holding references keys isn't an array
          debug(
            `Column "${
              relation.definition.keyFrom
            }"'s value holding references keys isn't an array for ${JSON.stringify(
              entity,
            )}, Can't fetch related models.`,
          );
        }
      });
      relation.keys = [...new Set(relation.keys)];

      let foreignKey =
        relation.definition.keyTo ??
        relation.definition.target().definition.idProperties()[0];

      // Strictly include primary key in attributes
      let attributesToFetch = this.buildSequelizeAttributeFilter(
        relation.filter.scope?.fields,
      );
      let includeForeignKeyInResponse = false;
      if (attributesToFetch !== undefined) {
        if (Array.isArray(attributesToFetch)) {
          if (attributesToFetch.includes(foreignKey)) {
            includeForeignKeyInResponse = true;
          } else {
            attributesToFetch.push(foreignKey);
          }
        } else if (Array.isArray(attributesToFetch.include)) {
          if (attributesToFetch.include.includes(foreignKey)) {
            includeForeignKeyInResponse = true;
          } else {
            attributesToFetch.include.push(foreignKey);
          }
        }
      } else {
        includeForeignKeyInResponse = true;
      }

      const targetLoopbackModel = relation.definition.target();
      const targetSequelizeModel = this.getSequelizeModel(targetLoopbackModel);
      const sequelizeData = await targetSequelizeModel.findAll({
        where: {
          // eg. id: { [Op.in]: [1,2,4,8] }
          [foreignKey]: {
            [Op.in]: relation.keys,
          },
          ...this.buildSequelizeWhere(relation.filter.scope?.where),
        },
        attributes: attributesToFetch,
        include: this.buildSequelizeIncludeFilter(
          relation.filter.scope?.include,
          targetSequelizeModel,
        ),
        order: this.buildSequelizeOrder(relation.filter.scope?.order),
        limit:
          relation.filter.scope?.totalLimit ?? relation.filter.scope?.limit,
        offset: relation.filter.scope?.offset ?? relation.filter.scope?.skip,
      });

      const childModelData = await this.includeReferencesIfRequested(
        sequelizeData,
        targetLoopbackModel,
        relation.filter.scope?.include,
      );

      normalizedParentEntities.map(entity => {
        // let columnValue = entity[relation.definition.keyFrom as keyof T];
        let foreignKeys = entity[relation.definition.keyFrom as keyof T];
        let filteredChildModels = childModelData.filter(childModel => {
          if (Array.isArray(foreignKeys)) {
            return foreignKeys?.includes(
              childModel[foreignKey as keyof typeof childModel],
            );
          } else {
            return true;
          }
        });
        Object.assign(entity, {
          [relation.definition.name]: filteredChildModels.map(
            filteredChildModel => {
              let safeCopy = {...filteredChildModel};
              if (includeForeignKeyInResponse === false) {
                delete safeCopy[foreignKey as keyof typeof safeCopy];
              }
              return safeCopy;
            },
          ),
        });
        return entity as T & Relations;
      });
    }

    return normalizedParentEntities as (T & Relations)[];
  }
}
