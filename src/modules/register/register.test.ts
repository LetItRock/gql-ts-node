import { startServer } from '../../startServer';
import { request } from 'graphql-request';
import { User } from '../../entity/User';

const email = 'bob@bob.com';
const password = 'asdfasfa';
const mutation = `
mutation {
  register(email: "${email}", password: "${password}")
}
`;

let getHost = () => '';

beforeAll(async () => {
  const app = await startServer();
  const { port } = app.address();
  getHost = () => `http://127.0.0.1:${port}`;
});

test('Register user', async () => {
  const response = await request(getHost(), mutation);
  expect(response).toEqual({ register: true });
  const users = await User.find({ where: { email } });
  expect(users).toHaveLength(1);
  expect(users[0].email).toEqual(email);
  expect(users[0].password).not.toEqual(password);
});