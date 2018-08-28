import { Connection } from 'typeorm';
import { createTypeormConn } from './../../utils/createTypeormConn';
import { request } from 'graphql-request';
import { User } from '../../entity/User';
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough
} from './errorMessages';
import { TestClient } from '../../utils/testClient';

const email = 'bob@bob.com';
const password = 'asadsdasda';

let connection: Connection;
beforeAll(async () => {
  connection = await createTypeormConn();
});

afterAll(async () => {
  await connection.close();
});

describe('Register user', async () => {
  it('make sure we can register a user', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response = await client.register(email, password);
    expect(response.data.register).toBeNull();

    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual(email);
    expect(users[0].password).not.toEqual(password);
  });

  it('test for duplicate emails', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response = await client.register(email, password);
    expect(response.data.register).toHaveLength(1);
    expect(response.data.register[0]).toEqual({
      path: 'email',
      message: duplicateEmail
    });
  });

  it('catch bad email', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response = await client.register('p', password);
    expect(response.data).toEqual({
      register: [
        {
          path: 'email',
          message: emailNotLongEnough
        },
        {
          path: 'email',
          message: invalidEmail
        }
      ]
    });
  });

  it('catch bad password', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response = await client.register(email, 'a');
    expect(response.data).toEqual({
      register: [
        {
          path: 'password',
          message: passwordNotLongEnough
        }
      ]
    });
  });

  it('catch bad email and password', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response = await client.register('e', 'p');
    expect(response.data).toEqual({
      register: [
        {
          path: 'email',
          message: emailNotLongEnough
        },
        {
          path: 'email',
          message: invalidEmail
        },
        {
          path: 'password',
          message: passwordNotLongEnough
        }
      ]
    });
  });
});
