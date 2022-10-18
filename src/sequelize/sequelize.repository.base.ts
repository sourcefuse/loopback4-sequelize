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
  Operators,
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
  WhereOptions,
} from 'sequelize';
import {MakeNullishOptional} from 'sequelize/types/utils';
import {SequelizeDataSource} from './sequelize.datasource.base';

class SequelizeModel extends Model implements Entity {
  getId() {
    return null;
  }
  getIdObject(): Object {
    return {};
  }
  toObject(options?: AnyObject | undefined): Object {
    return {};
  }
}

const isTruelyObject = (value?: unknown) => {
  return typeof value === 'object' && !Array.isArray(value) && value !== null;
};
/**
 * @key Operator used in loopback
 * @value Equivalent operator in Sequelize
 */
const operatorTranslations: {
  [key in Operators]?: symbol;
} = {
  eq: Op.eq,
  gt: Op.gt,
  gte: Op.gte,
  lt: Op.lt,
  lte: Op.lte,
  neq: Op.ne,
  between: Op.between,
  inq: Op.in,
  nin: Op.notIn,
  like: Op.like,
  nlike: Op.notLike,
  ilike: Op.iLike,
  nilike: Op.notILike,
  regexp: Op.regexp,
  and: Op.and,
  or: Op.or,
};

export class SequelizeRepository<
  T extends Entity,
  ID,
  Relations extends object = {},
> extends DefaultCrudRepository<T, ID, Relations> {
  sequelizeModel: ModelStatic<Model<T>>;
  constructor(
    public entityClass: typeof Entity & {
      prototype: T;
    },
    public dataSource: SequelizeDataSource,
  ) {
    super(entityClass, dataSource);
    console.log('Juggler entity definition', entityClass.definition.properties);

    if (this.dataSource.sequelize) {
      this.sequelizeModel = this.getSequelizeModel();
    }
    console.log('this.sequelizeModel', this.sequelizeModel);
  }

  async create(
    entity: MakeNullishOptional<T>,
    options?: AnyObject,
  ): Promise<T> {
    console.log('Create entity', entity);
    const data = await this.sequelizeModel.create(entity, options);
    return data.toJSON();
  }

  // updateById isn't implemented saperately because the existing one internally
  // calls updateAll method which is handled below

  async updateAll(
    data: DataObject<T>,
    where?: Where<T> | undefined,
    options?: AnyObject | undefined,
  ): Promise<Count> {
    const [affectedCount] = await this.sequelizeModel.update(
      Object.assign({} as AnyObject, data),
      {
        where: where ? this.buildSequelizeWhere(where) : {},
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
      ...(filter?.fields
        ? {attributes: this.buildSequelizeAttributeFilter(filter.fields)}
        : {}),
      ...(filter?.where ? {where: this.buildSequelizeWhere(filter.where)} : {}),
      ...(filter?.order ? {order: this.buildSequelizeOrder(filter.order)} : {}),
      ...(filter?.limit ? {limit: filter.limit} : {}),
      ...(filter?.offset || filter?.skip
        ? {offset: filter.offset ?? filter.skip}
        : {}),
      ...options,
    });
    return data.map(entity => {
      return entity.toJSON();
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
    return data.toJSON() as T & Relations;
  }

  replaceById(
    id: ID,
    data: DataObject<T>,
    options?: AnyObject | undefined,
  ): Promise<void> {
    const idProp = this.modelClass.definition.idName();
    console.log('idProp', idProp);
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
      where: where ? this.buildSequelizeWhere(where) : {},
      ...options,
    });
    return {count};
  }

  async deleteById(id: ID, options?: AnyObject | undefined): Promise<void> {
    if (id === undefined) {
      throw new Error('Invalid Argument: id cannot be undefined');
    }
    const idProp = this.modelClass.definition.idName();
    const where = {} as Where<T>;
    (where as AnyObject)[idProp] = id;
    const result = await this.deleteAll(where, options);
    if (result.count === 0) {
      throw new EntityNotFoundError(this.entityClass, id);
    }
  }

  async count(where?: Where<T>, options?: AnyObject): Promise<Count> {
    const count = await this.sequelizeModel.count({
      ...(where ? {where: this.buildSequelizeWhere<T>(where)} : {}),
      ...options,
    });

    return {count};
  }

  private getSequelizeOperator(key: keyof typeof operatorTranslations) {
    const sequelizeOperator = operatorTranslations[key];
    if (!sequelizeOperator) {
      throw Error(`There is no equivalent operator for "${key}" in sequelize.`);
    }
    return sequelizeOperator;
  }

  private buildSequelizeAttributeFilter(fields: Fields): FindAttributeOptions {
    if (Array.isArray(fields)) {
      return fields;
    }
    const sequelizeFields: FindAttributeOptions = {
      include: [],
      exclude: [],
    };
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

  private buildSequelizeOrder(order: string[] | string): Order {
    if (typeof order === 'string') {
      const [columnName, orderType] = order.trim().split(' ');
      return [[columnName, orderType ?? 'ASC']];
    }
    return order.map(orderStr => {
      const [columnName, orderType] = orderStr.trim().split(' ');
      return [columnName, orderType ?? 'ASC'];
    });
  }

  private buildSequelizeWhere<MT extends T>(
    where: Where<MT>,
  ): WhereOptions<MT> {
    if (!where) {
      return {};
    }

    const sequelizeWhere: WhereOptions = {};
    for (const columnName in where) {
      console.log('loop for', columnName, 'sequelizeWhere', sequelizeWhere);
      /**
       * Handle model attribute conditions like `{ age: { gt: 18 } }`, `{ email: "a@b.c" }`
       * Transform Operators - eg. `{ gt: 0, lt: 10 }` to `{ [Op.gt]: 0, [Op.lt]: 10 }`
       */
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

          console.log(
            'build ',
            columnName,
            sequelizeWhere[columnName][sequelizeOperator],
          );
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
        // equals
        console.log('equals column name', columnName);
        sequelizeWhere[columnName] = {
          [Op.eq]: conditionValue,
        };
      }
    }

    console.log('build sequelize where', where, '=>', sequelizeWhere);
    return sequelizeWhere;
  }

  private getSequelizeModel() {
    if (!this.dataSource.sequelize) {
      throw Error(
        `The datasource "${this.dataSource.name}" doesn't have sequelize instance bound to it.`,
      );
    }
    console.log('Modelname', this.entityClass.modelName);

    if (this.dataSource.sequelize.models[this.entityClass.modelName]) {
      console.log('target sequelize returned.');
      return this.dataSource.sequelize.models[this.entityClass.modelName];
    }

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

  private getSequelizeModelAttributes(definition: {
    [name: string]: PropertyDefinition;
  }): ModelAttributes<SequelizeModel, Attributes<SequelizeModel>> {
    const sequelizeDefinition: ModelAttributes = {};
    for (const propName in definition) {
      // Set data type
      let dataType: DataType = DataTypes.STRING;
      if (definition[propName].type === 'Number') {
        dataType = DataTypes.NUMBER;
      }
      const columnOptions: ModelAttributeColumnOptions = {
        type: dataType,
      };

      // set column as `primaryKey` when id is set to true (which is loopback way to define pk)
      if (definition[propName].id === true) {
        console.log(definition[propName]);
        Object.assign(columnOptions, {
          primaryKey: true,
          autoIncrement: true,
        } as typeof columnOptions);
      }
      console.log('columnOptions for', propName, columnOptions);
      sequelizeDefinition[propName] = columnOptions;
    }
    console.log('definition returned', sequelizeDefinition);
    return sequelizeDefinition;
  }
}
