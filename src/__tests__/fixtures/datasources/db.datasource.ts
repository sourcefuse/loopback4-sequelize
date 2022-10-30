import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {
  SequelizeDataSource,
  SequelizeDataSourceConfig,
} from '../../../sequelize';

const config: SequelizeDataSourceConfig = {
  name: 'db',
  host: '0.0.0.0',
  connector: 'sqlite3',
  database: 'database',
  file: ':memory:',
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class DbDataSource
  extends SequelizeDataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'db';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.db', {optional: true})
    dsConfig: SequelizeDataSourceConfig = config,
  ) {
    super(dsConfig);
  }
}
