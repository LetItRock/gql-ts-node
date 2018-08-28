import axios from 'axios';
import { Connection } from 'typeorm';
import { createTypeormConn } from '../../utils/createTypeormConn';
import { User } from '../../entity/User';

let connection: Connection;
const email = 'bob5@bob.com';
const password = 'asdasdasd';
let userId: string;

const loginMutation = (e: string, p: string) => `
mutation {
  login(email: "${e}", password: "${p}") {
    path
    message
  }
}
`;

const meQuery = `
  {
    me {
      id
      email
    }
  }
`;

const logoutMutation = `
  mutation {
    logout
  }
`;

beforeAll(async () => {
  connection = await createTypeormConn();
  const user = await User.create({
    email,
    password,
    confirmed: true,
  }).save();
  userId = user.id;
});

afterAll(async () => {
  await connection.close();
})

describe('test logout', () => {
  it('test logging out a user', async () => {
    await axios.post(process.env.TEST_HOST as string, {
      query: loginMutation(email, password),
    }, {
      withCredentials: true,
    });

    const response = await axios.post(process.env.TEST_HOST as string, {
      query: meQuery,
    }, {
      withCredentials: true,
    });

    expect(response.data.data.me).toEqual({
      email,
      id: userId,
    });

    const response2 = await axios.post(process.env.TEST_HOST as string, {
      query: logoutMutation,
    }, {
      withCredentials: true,
    });

    expect(response2.data.data.logout).toBeTruthy();

    const response3 = await axios.post(process.env.TEST_HOST as string, {
      query: meQuery,
    }, {
      withCredentials: true,
    });

    expect(response3.data.data.me).toBeNull();
  });
});