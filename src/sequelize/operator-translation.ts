import {Operators} from '@loopback/repository';
import {Op} from 'sequelize';

/**
 * @key Operator used in loopback
 * @value Equivalent operator in Sequelize
 */
export const operatorTranslations: {
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
