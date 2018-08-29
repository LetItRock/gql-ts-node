import { ResolverMap } from '../../types/graphql-utils';
import { userIdSessionPrefix, redisSessionPrefix } from '../../constants';

export const resolvers: ResolverMap = {
  Query: {
    dummy: (_, __, ___) => 'dummy!'
  },
  Mutation: {
    logout: async (_, __, { session, redis }) => {
      const { userId } = session;
      if (userId) {
        const sessionIds: string[] = await redis.lrange(
          `${userIdSessionPrefix}${userId}`,
          0,
          -1
        );

        const promises = sessionIds.map((sessionId) => {
          return redis.del(`${redisSessionPrefix}${sessionId}`);
        })
        await Promise.all(promises);

        return true;
      }

      return false;
    }
  }
};
