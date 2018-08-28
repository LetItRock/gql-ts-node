import { Connection } from 'typeorm';
import { createTypeormConn } from '../../utils/createTypeormConn';
import { User } from '../../entity/User';
import { TestClient } from '../../utils/testClient';

let connection: Connection;
const email = 'bob5@bob.com';
const password = 'asdasdasd';
let userId: string;

beforeAll(async () => {
  connection = await createTypeormConn();
  const user = await User.create({
    email,
    password,
    confirmed: true
  }).save();
  userId = user.id;
});

afterAll(async () => {
  await connection.close();
});

describe('test logout', () => {
  it('test logging out a user', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    await client.login(email, password);

    const response = await client.me();

    expect(response.data.me).toEqual({
      email,
      id: userId
    });

    const response2 = await client.logout();

    expect(response2.data.logout).toBeTruthy();

    const response3 = await client.me();

    expect(response3.data.me).toBeNull();
  });
});
