# loopback4-sequelize

[![LoopBack](<https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png>)](http://loopback.io/)

<!-- docs-index-start -->

This is a loopback4 extension that provides Sequelize's query builder at repository level in any loopback 4 application. It has zero learning curve as it follows similar interface as `DefaultCrudRepository`. For relational databases, Sequelize is a popular ORM of choice.

For pending features, refer to the [Limitations](#limitations) section below.

## Installation

To install this extension in your Loopback 4 project, run the following command:

```sh
npm install loopback4-sequelize
```

You'll also need to install the driver for your preferred database:

```sh
# One of the following:
npm install --save pg pg-hstore # Postgres
npm install --save mysql2
npm install --save mariadb
npm install --save sqlite3
npm install --save tedious # Microsoft SQL Server
npm install --save oracledb # Oracle Database
```

## Usage

> You can watch a video overview of this extension by [clicking here](https://youtu.be/ZrUxIk63oRc).

<!-- tutorial-start -->

Both newly developed and existing projects can benefit from the extension by simply changing the parent classes in the target Data Source and Repositories.

### Step 1: Configure DataSource

Change the parent class from `juggler.DataSource` to `SequelizeDataSource` like below.

```ts title="pg.datasource.ts"
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

```ts title="your.repository.ts"
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

## Relations

### Supported Loopback Relations

With `SequelizeCrudRepository`, you can utilize following relations without any additional configuration:

1. [HasMany Relation](https://loopback.io/doc/en/lb4/HasMany-relation.html)
2. [BelongsTo Relation](https://loopback.io/doc/en/lb4/BelongsTo-relation.html)
3. [HasOne Relation](https://loopback.io/doc/en/lb4/HasOne-relation.html)
4. [HasManyThrough Relation](https://loopback.io/doc/en/lb4/HasManyThrough-relation.html)
5. [ReferencesMany Relation](https://loopback.io/doc/en/lb4/ReferencesMany-relation.html)

The default relation configuration, generated using the [lb4 relation](https://loopback.io/doc/en/lb4/Relation-generator.html) command (i.e. inclusion resolvers in the repository and property decorators in the model), remain unchanged.

### INNER JOIN

> Check the demo video of using inner joins here: https://youtu.be/ZrUxIk63oRc?t=76

When using `SequelizeCrudRepository`, the `find()`, `findOne()`, and `findById()` methods accept a new option called `required` in the include filter. Setting this option to `true` will result in an inner join query that explicitly requires the specified condition for the child model. If the row does not meet this condition, it will not be fetched and returned.

An example of the filter object might look like this to fetch the books who contains "Art" in their title, which belongs to category "Programming":

```json
{
  "where": {"title": {"like": "%Art%"}},
  "include": [
    {
      "relation": "category",
      "scope": {
        "where": {
          "name": "Programming"
        }
      },
      "required": true // 👈
    }
  ]
}
```

<!-- tutorial-end -->

## Debug strings reference

There are three built-in debug strings available in this extension to aid in debugging. To learn more about how to use them, see [this page](https://loopback.io/doc/en/lb4/Setting-debug-strings.html).

<table>
  <tbody>
    <tr>
      <th>String</th>
      <th>Description</th>
    </tr>
    <tr>
      <th colspan="2">Datasource</th>
    </tr>
    <tr>
      <td>loopback:sequelize:datasource</td>
      <td>Database Connections logs</td>
    </tr>
    <tr>
      <td>loopback:sequelize:queries</td>
      <td>Logs Executed SQL Queries and Parameters</td>
    </tr>
    <tr>
      <th colspan="2">Repository</th>
    </tr>
    <tr>
      <td>loopback:sequelize:modelbuilder</td>
      <td>Logs Translation of Loopback Models Into Sequelize Supported Definitions. Helpful When Debugging Datatype Issues</td>
    </tr>
  </tbody>
</table>

## Limitations

Please note, the current implementation does not support the following:

1. SQL Transactions.
2. Loopback Migrations (via default `migrate.ts`). Though you're good if using external packages like [`db-migrate`](https://www.npmjs.com/package/db-migrate).
3. Connection Pooling is not implemented yet.

Community contribution is welcome.

## Feedback

If you've noticed a bug or have a question or have a feature request, [search the issue tracker](https://github.com/sourcefuse/loopback4-sequelize/issues) to see if someone else in the community has already created a ticket.
If not, go ahead and [make one](https://github.com/sourcefuse/loopback4-sequelize/issues/new/choose)!
All feature requests are welcome. Implementation time may vary. Feel free to contribute the same, if you can.
If you think this extension is useful, please [star](https://help.github.com/en/articles/about-stars) it. Appreciation really helps in keeping this project alive.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/sourcefuse/loopback4-sequelize/blob/master/.github/CONTRIBUTING.md) for details on the process for submitting pull requests to us.

## Code of conduct

Code of conduct guidelines [here](https://github.com/sourcefuse/loopback4-sequelize/blob/master/.github/CODE_OF_CONDUCT.md).

## License

[MIT](https://github.com/sourcefuse/loopback4-sequelize/blob/master/LICENSE)

<!-- docs-index-end -->
