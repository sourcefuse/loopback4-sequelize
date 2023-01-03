import {Component, ContextTags, injectable} from '@loopback/core';
import {LB4SequelizeComponentBindings} from './keys';

// Configure the binding for LB4SequelizeComponent
@injectable({
  tags: {[ContextTags.KEY]: LB4SequelizeComponentBindings.COMPONENT},
})
export class LB4SequelizeComponent implements Component {
  constructor() {}
}
