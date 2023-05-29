import {Entity, model, property} from '@loopback/repository';

export const eventTableName = 'tbl_event';
@model({
  name: eventTableName,
})
export class Event extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  constructor(data?: Partial<Event>) {
    super(data);
  }
}

@model()
export class Box extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  constructor(data?: Partial<Event>) {
    super(data);
  }
}
