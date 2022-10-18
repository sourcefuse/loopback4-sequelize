import {LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {Options as SequelizeOptions, Sequelize} from 'sequelize';

export class SequelizeDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  constructor(public config: SequelizeOptions & {user?: string}) {
    super(config);
  }
  sequelize?: Sequelize;
  async init(...injectedArgs: unknown[]): Promise<void> {
    console.log('injected args', injectedArgs);
    console.log('init called');
    this.sequelize = new Sequelize({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      dialect: 'postgres',
      username: this.config.user ?? this.config.username,
      password: this.config.password,
      logging: console.log,
    });
    try {
      await this.sequelize.authenticate();
      console.log('Connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  }
  stop() {
    this.sequelize?.close?.().catch(console.log);
  }
}
