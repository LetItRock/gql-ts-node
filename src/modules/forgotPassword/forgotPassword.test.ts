import { Connection } from 'typeorm';
import { createTypeormConn } from '../../utils/createTypeormConn';
import { User } from '../../entity/User';
import { TestClient } from '../../utils/testClient';
import { createForgotPasswordLink } from '../../utils/createForgotPasswordLink';
import * as Redis from 'ioredis';
import { forgotPasswordLockAccount } from '../../utils/forgotPasswordLockAccount';
import { accountLockedMessage } from '../login/errorMessages';
import { passwordNotLongEnough } from '../register/errorMessages';
import { expiredKey } from './errorMessages';

let connection: Connection;
const email = 'bob5@bob.com';
const password = 'asdasdasd';
const newPassword = 'asdasdasdasdasdasdasd';
let userId: string;
const redis = new Redis();

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

describe('test forgot password', () => {
  it('make sure it works', async () => {
    const client = new TestClient(process.env.TEST_HOST as string);

    // lock account
    await forgotPasswordLockAccount(userId, redis);
    const url = await createForgotPasswordLink('', userId, redis);

    const parts = url.split('/');
    const key = parts[parts.length - 1];

    // make sure you can't login to locked account
    expect(await client.login(email, password)).toEqual({
      data: {
        login: [{
          path: 'email',
          message: accountLockedMessage,
        }]
      }
    });

    // try changing to a password that's too short
    expect(await client.forgotPasswordChange('a', key)).toEqual({
      data: {
        forgotPasswordChange: [{
          path: 'newPassword',
          message: passwordNotLongEnough,
        }]
      }
    });

    // change password
    const response = await client.forgotPasswordChange(newPassword, key);
    expect(response.data.forgotPasswordChange).toBeNull();

    // make sure redis key expires after password change
    expect(await client.forgotPasswordChange('asdasdasda', key)).toEqual({
      data: {
        forgotPasswordChange: [{
          path: 'key',
          message: expiredKey,
        }]
      }
    })

    // should be able to login
    expect(await client.login(email, newPassword)).toEqual({
      data: {
        login: null
      }
    });
  });
});
