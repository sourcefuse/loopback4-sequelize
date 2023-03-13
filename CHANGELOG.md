## Release [v2.2.1](https://github.com/sourcefuse/loopback4-sequelize/compare/v2.2.0..v2.2.1) March 13, 2023
Welcome to the March 13, 2023 release of loopback4-sequelize. There are many updates in this version that we hope you will like, the key highlights include:

  - [loopback version update](https://github.com/sourcefuse/loopback4-sequelize/issues/23) :- [](https://github.com/sourcefuse/loopback4-sequelize/commit/4db7a68879d87a6b21ef8a4154c9e15f96737856) was commited on March 10, 2023 by [gautam23-sf](mailto:gautam.agarwal@sourcefuse.com)
    
      - loopback version update
      
      - GH-23
      
  
Clink on the above links to understand the changes in detail.
  ___

## [2.2.1](https://github.com/sourcefuse/loopback4-sequelize/compare/v2.2.0...v2.2.1) (2023-03-13)

## Release [v2.2.0](https://github.com/sourcefuse/loopback4-sequelize/compare/v2.1.0..v2.2.0) March 3, 2023
Welcome to the March 3, 2023 release of loopback4-sequelize. There are many updates in this version that we hope you will like, the key highlights include:

  - [Loopback4-sequelize should support transactions](https://github.com/sourcefuse/loopback4-sequelize/issues/21) :- [feat(transaction): add transaction support ](https://github.com/sourcefuse/loopback4-sequelize/commit/331238df107ea0c0929037a3a8faa2ff77739c1c) was commited on March 3, 2023 by [Shubham P](mailto:shubham.prajapat@sourcefuse.com)
    
      - provide beginTransaction method to SequelizeCrudRepository with somewhat
      
      - similar usage as loopback
      
      -  GH-21
      
  
Clink on the above links to understand the changes in detail.
  ___

# [2.2.0](https://github.com/sourcefuse/loopback4-sequelize/compare/v2.1.0...v2.2.0) (2023-03-03)


### Features

* **transaction:** add transaction support ([#22](https://github.com/sourcefuse/loopback4-sequelize/issues/22)) ([331238d](https://github.com/sourcefuse/loopback4-sequelize/commit/331238df107ea0c0929037a3a8faa2ff77739c1c)), closes [#21](https://github.com/sourcefuse/loopback4-sequelize/issues/21)

## Release [v2.1.0](https://github.com/sourcefuse/loopback4-sequelize/compare/v2.0.1..v2.1.0) February 20, 2023
Welcome to the February 20, 2023 release of loopback4-sequelize. There are many updates in this version that we hope you will like, the key highlights include:

  - [Generate a detailed changelog](https://github.com/sourcefuse/loopback4-sequelize/issues/19) :- [](https://github.com/sourcefuse/loopback4-sequelize/commit/a32826122f937905d5853ee5636bdd5ea00866d7) was commited on February 20, 2023 by [Yesha  Mavani](mailto:yesha.mavani@sourcefuse.com)
    
      - changelog with issue and commit details will be generated
      
      - GH-19
      
  
  - [](https://github.com/sourcefuse/loopback4-sequelize/issues/) :- [](https://github.com/sourcefuse/loopback4-sequelize/commit/e279bec63d77ffed1f34094fa15d1ad0f308f78e) was commited on February 16, 2023 by [Sunny](mailto:sunny.tyagi@sourcefuse.com)
    
  
Clink on the above links to understand the changes in detail.
  ___

# [2.1.0](https://github.com/sourcefuse/loopback4-sequelize/compare/v2.0.1...v2.1.0) (2023-02-20)


### Features

* **chore:** generating detailed changelog ([a328261](https://github.com/sourcefuse/loopback4-sequelize/commit/a32826122f937905d5853ee5636bdd5ea00866d7)), closes [#19](https://github.com/sourcefuse/loopback4-sequelize/issues/19)

## [2.0.1](https://github.com/sourcefuse/loopback4-sequelize/compare/v2.0.0...v2.0.1) (2023-01-23)


### Bug Fixes

* **repository:** make `deleteById` independent ([#13](https://github.com/sourcefuse/loopback4-sequelize/issues/13)) ([0ef9dfe](https://github.com/sourcefuse/loopback4-sequelize/commit/0ef9dfe4eb310073ef51e663196ccedacf43d2fa)), closes [#12](https://github.com/sourcefuse/loopback4-sequelize/issues/12)

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