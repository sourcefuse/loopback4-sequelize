import {AnyObject, Entity} from '@loopback/repository';
import {Model} from 'sequelize';

export class SequelizeModel extends Model implements Entity {
  getId() {
    // TODO: Implement this Method
    return null;
  }
  getIdObject(): Object {
    // TODO: Implement this Method
    return {};
  }
  toObject(options?: AnyObject | undefined): Object {
    // TODO: Implement this Method
    return {};
  }
}
