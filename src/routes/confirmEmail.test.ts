import * as Redis from 'ioredis';
import { Connection } from 'typeorm';
import fetch from 'node-fetch';
import { User } from '../entity/User';
import { createConfirmEmailLink } from '../utils/createConfirmEmailLInk';
import { createTypeormConn } from '../utils/createTypeormConn';

let userId: string;
let connection: Connection;
const redis = new Redis();

beforeAll(async () => {
  connection = await createTypeormConn();
  const user = await User.create({
    email: 'bob5@bob.com',
    password: 'asdasdasd'
  }).save();
  userId = user.id;
});

afterAll(async () => {
  await connection.close();
})

describe('test createConfirmEmailLink', () => {
  it('Make sure it confirms user and clears key in redis', async () => {
    const url = await createConfirmEmailLink(
      process.env.TEST_HOST as string,
      userId,
      redis
    );
    const response = await fetch(url);
    const text = await response.text();
    expect(text).toEqual('ok');

    const user = (await User.findOne({ where: { id: userId } })) as User;
    expect(user.confirmed).toBeTruthy();
    const chunks = url.split('/');
    const value = await redis.get(chunks[chunks.length - 1]);
    expect(value).toBeNull();
  });

  it('Sends invalid back if bad id sent', async () => {
    const response = await fetch(`${process.env.TEST_HOST}/confirm/123123`);
    const text = await response.text();
    expect(text).toEqual('invalid');
  });
});
