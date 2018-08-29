import { Connection } from 'typeorm';
import { User } from '../../entity/User';
import { createTestConn } from '../../testUtils/createTestConn';
import { TestClient } from '../../utils/testClient';

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

describe('test logout', () => {
  it('multiple sessions', async () => {
    // computer 1
    const session1 = new TestClient(process.env.TEST_HOST as string);
    // computer 2
    const session2 = new TestClient(process.env.TEST_HOST as string);

    await session1.login(email, password);
    await session2.login(email, password);
    expect(await session1.me()).toEqual(await session2.me());
    
    await session1.logout();
    expect(await session1.me()).toEqual(await session2.me());
  });

  it('single session', async () => {
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
