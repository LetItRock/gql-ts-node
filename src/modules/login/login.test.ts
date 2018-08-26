import { User } from './../../entity/User';
import { Connection } from 'typeorm';
import { createTypeormConn } from './../../utils/createTypeormConn';
import { request } from 'graphql-request';
import { invalidLogin, confirmMessage } from './errorMessages';

const email = 'bob@bob.com';
const password = 'asadsdasda';
const getHost = () => process.env.TEST_HOST as string;

const registerMutation = (e: string, p: string) => `
mutation {
  register(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;
const loginMutation = (e: string, p: string) => `
mutation {
  login(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;

let connection: Connection;
beforeAll(async () => {
  connection = await createTypeormConn();
});

afterAll(async () => {
  await connection.close();
});

describe('test login', () => {
  it('email not found send back error', async () => {
    const response = await request(
      getHost(),
      loginMutation('bob@bob.com', 'whatever')
    );

    expect(response).toEqual({
      login: [
        {
          path: 'email',
          message: invalidLogin
        }
      ]
    });
  });

  it('email not confirmed', async () => {
    await request(getHost(), registerMutation(email, password));

    const response2 = await request(getHost(), loginMutation(email, password));
    expect(response2).toEqual({
      login: [
        {
          path: 'email',
          message: confirmMessage
        }
      ]
    });

    // update user confirmed state
    await User.update({ email }, { confirmed: true });

    // invlid password
    const response3 = await request(
      getHost(),
      loginMutation(email, 'asdasdasdas')
    );
    expect(response3).toEqual({
      login: [
        {
          path: 'email',
          message: invalidLogin
        }
      ]
    });

    const response4 = await request(getHost(), loginMutation(email, password));
    expect(response4).toEqual({
      login: null
    });
  });
});
