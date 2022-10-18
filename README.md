# loopback4-sequelize

[![LoopBack](https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

## Installation

Install LB4SequelizeComponent using `npm`;

```sh
$ [npm install | yarn add] loopback4-sequelize
```

## Basic Use

Configure and load LB4SequelizeComponent in the application constructor
as shown below.

```ts
import {LB4SequelizeComponent, LB4SequelizeComponentOptions, DEFAULT_LOOPBACK4_SEQUELIZE_OPTIONS} from 'loopback4-sequelize';
// ...
export class MyApplication extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    const opts: LB4SequelizeComponentOptions = DEFAULT_LOOPBACK4_SEQUELIZE_OPTIONS;
    this.configure(LB4SequelizeComponentBindings.COMPONENT).to(opts);
      // Put the configuration options here
    });
    this.component(LB4SequelizeComponent);
    // ...
  }
  // ...
}
```
