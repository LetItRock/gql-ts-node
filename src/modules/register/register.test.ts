import { startServer } from '../../startServer';
import { request } from 'graphql-request';
import { User } from '../../entity/User';
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough,
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

let getHost = () => '';

beforeAll(async () => {
  const app = await startServer();
  const { port } = app.address();
  getHost = () => `http://127.0.0.1:${port}`;
});

test('Register user', async () => {
  // make sure we can register a user
  const response = await request(getHost(), mutation(email, password));
  expect(response).toEqual({ register: null });
  const users = await User.find({ where: { email } });
  expect(users).toHaveLength(1);
  expect(users[0].email).toEqual(email);
  expect(users[0].password).not.toEqual(password);

  // test for duplicate emails
  const response2: any = await request(getHost(), mutation(email, password));
  expect(response2.register).toHaveLength(1);
  expect(response2.register[0]).toEqual({
    path: 'email',
    message: duplicateEmail,
  });

  // catch bad email
  const response3: any = await request(getHost(), mutation('p', password));
  expect(response3).toEqual({
    register: [
      {
        path: 'email',
        message: emailNotLongEnough,
      },
      {
        path: 'email',
        message: invalidEmail,
      },
    ],
  });

  // catch bad password
  const response4: any = await request(getHost(), mutation(email, 'a'));
  expect(response4).toEqual({
    register: [
      {
        path: 'password',
        message: passwordNotLongEnough,
      },
    ],
  });

  // catch bad email and password
  const response5: any = await request(getHost(), mutation('e', 'p'));
  expect(response5).toEqual({
    register: [
      {
        path: 'email',
        message: emailNotLongEnough,
      },
      {
        path: 'email',
        message: invalidEmail,
      },
      {
        path: 'password',
        message: passwordNotLongEnough,
      },
    ],
  });
});
