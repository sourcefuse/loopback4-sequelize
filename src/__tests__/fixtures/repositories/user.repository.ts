import {inject} from '@loopback/core';
import {SequelizeCrudRepository} from '../../../sequelize';
import {DbDataSource} from '../datasources/db.datasource';
import {User, UserRelations} from '../models/user.model';

export class UserRepository extends SequelizeCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(User, dataSource);
  }
}
