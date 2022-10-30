import {
  AnyObject,
  Count,
  DataObject,
  DefaultCrudRepository,
  Entity,
  EntityNotFoundError,
  Fields,
  Filter,
  FilterExcludingWhere,
  PropertyDefinition,
  Where,
} from '@loopback/repository';
import {
  Attributes,
  DataType,
  DataTypes,
  FindAttributeOptions,
  Identifier,
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

/**
 * Default `order` filter style if only column name is specified
 */
const DEFAULT_ORDER_STYLE = 'ASC';

/**
 * Implementation of Sequelize repository based on the interface of `DefaultCrudRepository`
 */
export class SequelizeRepository<
  T extends Entity,
  ID,
  Relations extends object = {},
> extends DefaultCrudRepository<T, ID, Relations> {
  /**
   * Sequelize Model Instance created from the model definition received from the `entityClass`
   */
  sequelizeModel: ModelStatic<Model<T>>;

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

  async create(
    entity: MakeNullishOptional<T>,
    options?: AnyObject,
  ): Promise<T> {
    let err = null;
    const data = await this.sequelizeModel
      .create(entity, options)
      .catch(error => {
        console.error(error);
        err = error;
      });
    if (data) {
      return this.excludeHiddenProps(data.toJSON());
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
    const data = await this.sequelizeModel.findAll({
      where: this.buildSequelizeWhere(filter?.where),
      ...(filter?.fields
        ? {attributes: this.buildSequelizeAttributeFilter(filter.fields)}
        : {}),
      ...(filter?.order ? {order: this.buildSequelizeOrder(filter.order)} : {}),
      ...(filter?.limit ? {limit: filter.limit} : {}),
      ...(filter?.offset || filter?.skip
        ? {offset: filter.offset ?? filter.skip}
        : {}),
      ...options,
    });
    return data.map(entity => {
      return this.excludeHiddenProps(entity.toJSON());
    });
  }

  async findById(
    id: ID,
    filter?: FilterExcludingWhere<T>,
    options?: AnyObject,
  ): Promise<T & Relations> {
    const data = await this.sequelizeModel.findByPk(
      id as unknown as Identifier,
      {
        ...(filter?.fields
          ? {attributes: this.buildSequelizeAttributeFilter(filter.fields)}
          : {}),
        ...(filter?.order
          ? {order: this.buildSequelizeOrder(filter.order)}
          : {}),
        ...(filter?.limit ? {limit: filter.limit} : {}),
        ...(filter?.offset || filter?.skip
          ? {offset: filter.offset ?? filter.skip}
          : {}),
        ...options,
      },
    );
    if (!data) {
      throw new EntityNotFoundError(this.entityClass, id);
    }
    // TODO: include relations in object
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
  private getSequelizeOperator(key: keyof typeof operatorTranslations) {
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
  private buildSequelizeAttributeFilter(fields: Fields): FindAttributeOptions {
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
  private buildSequelizeOrder(order: string[] | string): Order {
    if (typeof order === 'string') {
      const [columnName, orderType] = order.trim().split(' ');
      return [[columnName, orderType ?? DEFAULT_ORDER_STYLE]];
    }

    return order.map(orderStr => {
      const [columnName, orderType] = orderStr.trim().split(' ');
      return [columnName, orderType ?? DEFAULT_ORDER_STYLE];
    });
  }

  /**
   * Build Sequelize compatible where condition object
   * @param where loopback style `where` condition
   * @returns Sequelize compatible where options to be used in queries
   */
  private buildSequelizeWhere<MT extends T>(
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
  private getSequelizeModel() {
    if (!this.dataSource.sequelize) {
      throw Error(
        `The datasource "${this.dataSource.name}" doesn't have sequelize instance bound to it.`,
      );
    }

    if (this.dataSource.sequelize.models[this.entityClass.modelName]) {
      // Model Already Defined by Sequelize before
      return this.dataSource.sequelize.models[this.entityClass.modelName];
    }

    // TODO: Make it more flexible, check support of all possible definition props
    this.dataSource.sequelize.define(
      this.entityClass.modelName,
      this.getSequelizeModelAttributes(this.entityClass.definition.properties),
      {
        createdAt: false,
        updatedAt: false,
        tableName: this.entityClass.modelName.toLowerCase(),
      },
    );

    return this.dataSource.sequelize.models[this.entityClass.modelName];
  }

  /**
   * Run CREATE TABLE query for the target sequelize model, Useful for quick testing
   * @param options Sequelize Sync Options
   */
  async syncSequelizeModel(options: SyncOptions = {}) {
    await this.dataSource.sequelize?.models[this.entityClass.modelName]
      .sync(options)
      .catch(console.log);
  }

  /**
   * Get Sequelize Model Attributes
   * @param definition property definition received from loopback entityClass eg. `{ id: { type: "Number", id: true } }`
   * @returns model attributes supported in sequelize model definiotion
   *
   * TODO: Verify all possible loopback types https://loopback.io/doc/en/lb4/LoopBack-types.html
   */
  private getSequelizeModelAttributes(definition: {
    [name: string]: PropertyDefinition;
  }): ModelAttributes<SequelizeModel, Attributes<SequelizeModel>> {
    const sequelizeDefinition: ModelAttributes = {};

    for (const propName in definition) {
      // Set data type
      let dataType: DataType = DataTypes.STRING;
      if (['Number', 'number'].includes(definition[propName].type.toString())) {
        dataType = DataTypes.NUMBER;
      }
      if (definition[propName].type === Boolean) {
        dataType = DataTypes.BOOLEAN;
      }

      const columnOptions: ModelAttributeColumnOptions = {
        type: dataType,
      };

      // set column as `primaryKey` when id is set to true (which is loopback way to define primary key)
      if (definition[propName].id === true) {
        if (columnOptions.type === DataTypes.NUMBER) {
          columnOptions.type = DataTypes.INTEGER;
        }
        Object.assign(columnOptions, {
          primaryKey: true,
          autoIncrement: columnOptions.type === DataTypes.INTEGER,
        } as typeof columnOptions);
      }

      sequelizeDefinition[propName] = columnOptions;
    }
    return sequelizeDefinition;
  }

  /**
   * Remove hidden properties specified in model from response body. (See:  https://github.com/sourcefuse/loopback4-sequelize/issues/3)
   * @param entity normalized entity. You can use `entity.toJSON()`'s value
   * @returns normalized entity excluding the hiddenProperties
   */
  private excludeHiddenProps(entity: T & Relations): T & Relations {
    const hiddenProps = this.entityClass.definition.settings.hiddenProperties;
    if (!hiddenProps) {
      return entity;
    }

    for (const propertyName of hiddenProps as Array<keyof typeof entity>) {
      delete entity[propertyName];
    }

    return entity;
  }
}
