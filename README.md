# loopback4-sequelize

[![LoopBack](<https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png>)](http://loopback.io/)

This is a loopback4 extension that provides Sequelize's query builder at repository level in any loopback 4 application. It has zero learning curve as it follows similar interface as `DefaultCrudRepository`. For relational databases, Sequelize is a popular ORM of choice.

For pending features, refer to the [Limitations](#limitations) section below.

## Installation

```sh
npm install loopback4-sequelize
```

## Usage

> You can watch a video demo of this extension by [clicking here](https://youtu.be/tHg5ZAj29YQ).

Both newly developed and existing projects can benefit from the extension. By just changing the parent classes in the target Data Source and Repositories.

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

Change the parent class from `DefaultCrudRepository` to `SequelizeCrudRepository` like below.

```ts
// ...
import {SequelizeCrudRepository} from 'loopback4-sequelize';

export class YourRepository extends SequelizeCrudRepository<
  YourModel,
  typeof YourModel.prototype.id,
  YourModelRelations
> {
  // ...
}
```

## Limitations

Please note, the current implementation does not support the following:

1. SQL Transactions.
2. Sequelize Powered Migrations.

Community contribution is welcome.

## Feedback

If you've noticed a bug or have a question or have a feature request, [search the issue tracker](https://github.com/sourcefuse/loopback4-sequelize/issues) to see if someone else in the community has already created a ticket.
If not, go ahead and [make one](https://github.com/sourcefuse/loopback4-sequelize/issues/new/choose)!
All feature requests are welcome. Implementation time may vary. Feel free to contribute the same, if you can.
If you think this extension is useful, please [star](https://help.github.com/en/articles/about-stars) it. Appreciation really helps in keeping this project alive.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/sourcefuse/loopback4-sequelize/blob/main/.github/CONTRIBUTING.md) for details on the process for submitting pull requests to us.

## Code of conduct

Code of conduct guidelines [here](https://github.com/sourcefuse/loopback4-sequelize/blob/main/.github/CODE_OF_CONDUCT.md).

## License

[MIT](https://github.com/sourcefuse/loopback4-sequelize/blob/main/LICENSE)
