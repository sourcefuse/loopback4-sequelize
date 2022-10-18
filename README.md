# loopback4-sequelize

[![LoopBack](<https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png>)](http://loopback.io/)

This is a loopback 4 extension that provides Sequelize powered repository methods which is more performant than juggler (the default ORM in Loopback) for relational databases.

## Installation

```sh
npm install loopback4-sequelize
```

## Usage

The extension can be used in new as well as existing projects. By just changing the parent classes in target Data Source and Repositories.

### Step 1: Configure DataSource

Change the parent class from `juggler.DataSource` to `SequelizeDataSource` like below.

```ts
// ...
import {SequelizeDataSource} from 'loopback4-sequelize';

// ...
export class PgDataSource
  extends SequelizeDataSource
  implements LifeCycleObserver {
  // ...
}
```

### Step 2: Configure Repository

Change the parent class from `DefaultCrudRepository` to `SequelizeRepository` like below.

```ts
// ...
import {SequelizeRepository} from 'loopback4-sequelize';

export class YourRepository extends SequelizeRepository<
  YourModel,
  typeof YourModel.prototype.id,
  YourModelRelations
> {
  // ...
}
```
