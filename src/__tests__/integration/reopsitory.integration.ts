import {RestApplication} from '@loopback/rest';
import {
  Client,
  createRestAppClient,
  expect,
  givenHttpServerConfig,
  TestSandbox,
} from '@loopback/testlab';
import {resolve} from 'path';
import {SequelizeSandboxApplication} from '../fixtures/application';

describe('Sequelize Repository (integration)', () => {
  const sandbox = new TestSandbox(resolve(__dirname, '../../.sandbox'));

  let app: SequelizeSandboxApplication;
  let client: Client;

  beforeEach('reset sandbox', () => sandbox.reset());
  beforeEach(getAppAndClient);
  afterEach(async () => {
    if (app) await app.stop();
    (app as unknown) = undefined;
  });

  it('creates an entity', async () => {
    const user = {
      name: 'shubham',
      age: 10,
      email: 'test@lb4.com',
    };
    const res = await client.post('/users').send(user);

    expect(res.body).to.have.property('name', user.name);
    expect(res.body).to.have.property('age', user.age);
    expect(res.body).to.have.property('email', user.email);
  });

  it('counts created entity', async () => {
    const user = {
      name: 'shubham',
      age: 10,
      email: 'test@lb4.com',
    };
    await client.post('/users').send(user);

    const res = await client.get('/users/count').send();
    expect(res.body).to.have.property('count', 1);
  });

  it('fetches an entity', async () => {
    const user = {
      name: 'shubham',
      age: 10,
      email: 'test@lb4.com',
    };
    const create = await client.post('/users').send(user);
    const res = await client.get(`/users/${create.body.id}`);
    expect(res.body).to.have.property('name', user.name);
    expect(res.body).to.have.property('age', user.age);
    expect(res.body).to.have.property('email', user.email);
  });

  async function getAppAndClient() {
    await sandbox.copyFile(resolve(__dirname, '../fixtures/application.js'));
    await sandbox.copyFile(
      resolve(__dirname, '../fixtures/datasources/db.datasource.js'),
      'datasources/db.datasource.js',
    );
    await sandbox.copyFile(
      resolve(__dirname, '../fixtures/models/user.model.js'),
      'models/user.model.js',
    );
    await sandbox.copyFile(
      resolve(__dirname, '../fixtures/controllers/user.controller.js'),
      'controllers/user.controller.js',
    );
    await sandbox.copyFile(
      resolve(__dirname, '../fixtures/repositories/user.repository.js'),
      'repositories/user.repository.js',
    );

    const MyApp = require(resolve(
      sandbox.path,
      'application.js',
    )).SequelizeSandboxApplication;
    app = new MyApp({
      rest: givenHttpServerConfig(),
    });

    await app.boot();
    await app.start();

    client = createRestAppClient(app as RestApplication);
  }
});
