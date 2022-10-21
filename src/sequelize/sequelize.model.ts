import {AnyObject, Entity} from '@loopback/repository';
import {Model} from 'sequelize';

export class SequelizeModel extends Model implements Entity {
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
