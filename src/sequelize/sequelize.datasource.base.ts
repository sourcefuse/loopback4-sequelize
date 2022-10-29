import {LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {Options as SequelizeOptions, Sequelize} from 'sequelize';
import {
  SupportedConnectorMapping as supportedConnectorMapping,
  SupportedLoopbackConnectors,
} from './connector-mapping';

export class SequelizeDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  constructor(public config: SequelizeDataSourceConfig) {
    super(config);

    if (!(this.config.connector in supportedConnectorMapping)) {
      throw new Error(
        `Specified connector ${
          this.config.connector ?? this.config.dialect
        } is not supported.`,
      );
    }
  }

  sequelize?: Sequelize;
  async init(): Promise<void> {
    this.sequelize = new Sequelize({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      dialect:
        supportedConnectorMapping[this.config.connector ?? this.config.dialect],
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

export type SequelizeDataSourceConfig = SequelizeOptions & {
  user?: string;
  connector: SupportedLoopbackConnectors;
};
