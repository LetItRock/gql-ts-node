import { Redis } from "ioredis";
import { userIdSessionPrefix, redisSessionPrefix } from "../constants";

export const removeAllUserSessions = async (userId: string, redis: Redis) => {
  const sessionIds: string[] = await redis.lrange(
    `${userIdSessionPrefix}${userId}`,
    0,
    -1
  );

  const promises = sessionIds.map((sessionId) => {
    return redis.del(`${redisSessionPrefix}${sessionId}`);
  })
  await Promise.all(promises);
};
