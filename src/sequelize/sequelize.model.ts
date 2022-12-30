import {AnyObject, Entity} from '@loopback/repository';
import {Model} from 'sequelize';

export class SequelizeModel extends Model implements Entity {
  getId() {
    // Method implementation not required as this class is just being used as type not a constructor
    return null;
  }
  getIdObject(): Object {
    // Method implementation not required as this class is just being used as type not a constructor
    return {};
  }
  toObject(_options?: AnyObject | undefined): Object {
    // Method implementation not required as this class is just being used as type not a constructor
    return {};
  }
}
