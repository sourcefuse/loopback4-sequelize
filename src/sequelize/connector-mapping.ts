import {Dialect as AllSequelizeDialects} from 'sequelize';

export type SupportedLoopbackConnectors =
  | 'mysql'
  | 'postgresql'
  | 'oracle'
  | 'sqlite3'
  | 'db2';
/**
 * @key Loopback connectors name supported by this extension
 * @value Equivalent Dialect in Sequelize
 */
export const SupportedConnectorMapping: {
  [key in SupportedLoopbackConnectors]?: AllSequelizeDialects;
} = {
  mysql: 'mysql',
  postgresql: 'postgres',
  oracle: 'oracle',
  sqlite3: 'sqlite',
  db2: 'db2',
};
