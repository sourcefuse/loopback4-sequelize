import {BindingKey, CoreBindings} from '@loopback/core';
import {LB4SequelizeComponent} from './component';

/**
 * Binding keys used by this component.
 */
export namespace LB4SequelizeComponentBindings {
  export const COMPONENT = BindingKey.create<LB4SequelizeComponent>(
    `${CoreBindings.COMPONENTS}.LB4SequelizeComponent`,
  );
}
