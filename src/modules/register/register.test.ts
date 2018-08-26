import { request } from 'graphql-request';
import { createTypeormConn } from '../../utils/createTypeormConn';
import { User } from '../../entity/User';
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough
} from './errorMessages';

const email = 'bob@bob.com';
const password = 'asadsdasda';
const mutation = (e: string, p: string) => `
mutation {
  register(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;

const getHost = () => process.env.TEST_HOST as string;

beforeAll(async () => {
  await createTypeormConn();
});

describe('Register user', async () => {
  it('make sure we can register a user', async () => {
    const response = await request(getHost(), mutation(email, password));
    expect(response).toEqual({ register: null });
    const users = await User.find({ where: { email } });
    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual(email);
    expect(users[0].password).not.toEqual(password);
  });

  it('test for duplicate emails', async () => {
    const response2: any = await request(getHost(), mutation(email, password));
    expect(response2.register).toHaveLength(1);
    expect(response2.register[0]).toEqual({
      path: 'email',
      message: duplicateEmail
    });
  });

  it('catch bad email', async () => {
    const response3: any = await request(getHost(), mutation('p', password));
    expect(response3).toEqual({
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
    const response4: any = await request(getHost(), mutation(email, 'a'));
    expect(response4).toEqual({
      register: [
        {
          path: 'password',
          message: passwordNotLongEnough
        }
      ]
    });
  });

  it('catch bad email and password', async () => {
    const response5: any = await request(getHost(), mutation('e', 'p'));
    expect(response5).toEqual({
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
