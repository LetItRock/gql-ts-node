import { ResolverMap } from '../../types/graphql-utils';
import { removeAllUserSessions } from '../../utils/removeAllUserSessions';

export const resolvers: ResolverMap = {
  Query: {
    dummy: (_, __, ___) => 'dummy!'
  },
  Mutation: {
    logout: async (_, __, { session, redis }) => {
      const { userId } = session;
      if (userId) {
        await removeAllUserSessions(userId, redis);
        return true;
      }

      return false;
    }
  }
};
