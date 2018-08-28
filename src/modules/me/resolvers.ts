import { ResolverMap } from '../../types/graphql-utils';
import { User } from '../../entity/User';
import middleware from './middleware';
import { createMiddleware } from '../../utils/createMiddleware';

export const resolvers: ResolverMap = {
  Query: {
    me: createMiddleware(middleware, async (_, __, { session }) =>  User.findOne({ where: { id: session.userId } }))
  }
};
