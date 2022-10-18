import {
  Application,
  injectable,
  Component,
  config,
  ContextTags,
  CoreBindings,
  inject,
} from '@loopback/core';
import {LB4SequelizeComponentBindings} from './keys'
import {DEFAULT_LOOPBACK4_SEQUELIZE_OPTIONS, LB4SequelizeComponentOptions} from './types';

// Configure the binding for LB4SequelizeComponent
@injectable({tags: {[ContextTags.KEY]: LB4SequelizeComponentBindings.COMPONENT}})
export class LB4SequelizeComponent implements Component {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    private application: Application,
    @config()
    private options: LB4SequelizeComponentOptions = DEFAULT_LOOPBACK4_SEQUELIZE_OPTIONS,
  ) {}
}
