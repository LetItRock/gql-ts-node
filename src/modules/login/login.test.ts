import { User } from './../../entity/User';
import { Connection } from 'typeorm';
import { createTypeormConn } from './../../utils/createTypeormConn';
import { invalidLogin, confirmMessage } from './errorMessages';
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

describe('test login', () => {
  it('email not found send back error', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response = await client.login('bob@bob.com', 'whatever');
    expect(response.data).toEqual({
      login: [
        {
          path: 'email',
          message: invalidLogin
        }
      ]
    });
  });

  it('email not confirmed', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    await client.register(email, password);

    const response = await client.login(email, password);
    expect(response.data).toEqual({
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
    const response2 = await client.login(email, 'asdasdasdas');
    expect(response2.data).toEqual({
      login: [
        {
          path: 'email',
          message: invalidLogin
        }
      ]
    });

    const response3 = await client.login(email, password);
    expect(response3.data).toEqual({
      login: null
    });
  });
});
