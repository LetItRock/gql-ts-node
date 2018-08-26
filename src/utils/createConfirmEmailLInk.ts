import { v4 } from 'uuid';
import { Redis } from 'ioredis';

// http://localhost:4000
// http://mysite.com
// => http://mysite.com/confirm/<id>
export const createConfirmEmailLink = async (url: string, userId: string, redis: Redis) => {
  const id = v4();
  await redis.set(id, userId, 'ex', 60 * 60 * 24); // 24h
  return `${url}/confirm/${id}`;
};