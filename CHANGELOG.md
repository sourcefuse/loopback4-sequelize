# [2.0.0](https://github.com/sourcefuse/loopback4-sequelize/compare/v1.0.0...v2.0.0) (2023-01-03)


### Bug Fixes

* **ci-cd:** add commitlint and husky ([#8](https://github.com/sourcefuse/loopback4-sequelize/issues/8)) ([c879812](https://github.com/sourcefuse/loopback4-sequelize/commit/c879812a387a4499d8a6244a48cac622e5b22e7a)), closes [#0](https://github.com/sourcefuse/loopback4-sequelize/issues/0) [#0](https://github.com/sourcefuse/loopback4-sequelize/issues/0) [#0](https://github.com/sourcefuse/loopback4-sequelize/issues/0) [#0](https://github.com/sourcefuse/loopback4-sequelize/issues/0)
* **ci-cd:** change default branch to master ([de4037c](https://github.com/sourcefuse/loopback4-sequelize/commit/de4037c9529e3ebe857eb3345d1f5af73796f020)), closes [#7](https://github.com/sourcefuse/loopback4-sequelize/issues/7)
* **repository:** exclude hidden properties in response body ([3e254fd](https://github.com/sourcefuse/loopback4-sequelize/commit/3e254fd48a307c18e8ede54ce01c87804d29fbe0)), closes [#3](https://github.com/sourcefuse/loopback4-sequelize/issues/3)


### Features

* **repository:** add support for relational query ([#6](https://github.com/sourcefuse/loopback4-sequelize/issues/6)) ([c99bb59](https://github.com/sourcefuse/loopback4-sequelize/commit/c99bb59b2b1ef4401363f7465a9b62cec74bf5e1))


### BREAKING CHANGES

* **repository:** `SequelizeRepository` is renamed to `SequelizeCrudRepository`

* test(repository): add test cases for relations

namely for fields, order and limit filter along with createAll,
updateAll, delete and relations such as `@hasOne`, `@hasMany`, `@belongsTo`
`@hasMany through`, `@referencesMany` and for INNER JOIN using `required: true` flag

# 1.0.0 (2022-10-19)


### Features

* **commitzen:** add commitzen ([8ef6720](https://github.com/sourcefuse/loopback4-sequelize/commit/8ef672021bf472e64c762024e7f21e8785808f8b))
* **datasource:** add sequelize datasource base class ([3fcf68f](https://github.com/sourcefuse/loopback4-sequelize/commit/3fcf68fbd0f70be809b9634232983e31b8c42705))
* **repository:** add sequelize repository base class ([a1dd46f](https://github.com/sourcefuse/loopback4-sequelize/commit/a1dd46f1142318d9b18446d0f8f71a474726ae95))
