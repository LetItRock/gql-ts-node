import { Connection } from 'typeorm';
import { User } from '../../entity/User';
import { TestClient } from '../../utils/testClient';
import { createTestConn } from './../../testUtils/createTestConn';

let connection: Connection;
const email = 'bob5@bob.com';
const password = 'asdasdasd';
let userId: string;

beforeAll(async () => {
  connection = await createTestConn();
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

describe('test me', () => {
  
  it('return null if no cookie', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    const response = await client.me();
    expect(response.data.me).toBeNull();
  });
  
  it('get current user', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);
    await client.login(email, password);

    const response = await client.me();
    expect(response.data.me).toEqual({
      email,
      id: userId
    });
  });
});
