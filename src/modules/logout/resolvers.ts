import { ResolverMap } from '../../types/graphql-utils';

export const resolvers: ResolverMap = {
  Query: {
    dummy: (_, __, ___) => 'dummy!'
  },
  Mutation: {
    logout: async (_, __, { session }) =>
      new Promise((resolve, reject) => {
        session.destroy(err => {
          if (err) {
            console.log('logout error: ', err);
            reject();
          }
          resolve(true);
        });
      })
  }
};
