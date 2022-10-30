import {
  Count,
  CountSchema,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {User} from '../models/user.model';
import {UserRepository} from '../repositories/user.repository';

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

  @post('/users')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['id'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<User> {
    /**
     * This `syncSequelizeModel` call below is only for testing purposes,
     * in real project you are supposed to run migrations instead
     * to sync model definitions to the target database.
     */
    await this.userRepository.syncSequelizeModel({
      force: false,
    });
    return this.userRepository.create(user);
  }

  @get('/users/count')
  @response(200, {
    description: 'User model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(User) where?: Where<User>): Promise<Count> {
    /**
     * This `syncSequelizeModel` call below is only for testing purposes,
     * in real project you are supposed to run migrations instead
     * to sync model definitions to the target database.
     */
    await this.userRepository.syncSequelizeModel({
      force: false,
    });
    return this.userRepository.count(where);
  }

  @get('/users/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>,
  ): Promise<User> {
    /**
     * This `syncSequelizeModel` call below is only for testing purposes,
     * in real project you are supposed to run migrations instead
     * to sync model definitions to the target database.
     */
    await this.userRepository.syncSequelizeModel({
      force: false,
    });
    return this.userRepository.findById(id, filter);
  }
}
