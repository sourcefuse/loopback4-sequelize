import {LifeCycleObserver} from '@loopback/core';
import {AnyObject, juggler} from '@loopback/repository';
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

    if (
      this.config.connector &&
      !(this.config.connector in supportedConnectorMapping)
    ) {
      throw new Error(
        `Specified connector ${
          this.config.connector ?? this.config.dialect
        } is not supported.`,
      );
    }
  }

  sequelize?: Sequelize;
  async init(): Promise<void> {
    const connector = this.config.connector;
    const storage = this.config.file;
    this.sequelize = new Sequelize({
      database: this.config.database,
      ...(connector ? {dialect: supportedConnectorMapping[connector]} : {}),
      ...(storage ? {storage: storage} : {}),
      host: this.config.host,
      port: this.config.port,
      username: this.config.user ?? this.config.username,
      password: this.config.password,
      logging: false,
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
  name?: string;
  user?: string;
  connector?: SupportedLoopbackConnectors;
  url?: string;
} & AnyObject;
