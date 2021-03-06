import * as bcrypt from 'bcryptjs';
import { ResolverMap } from '../../types/graphql-utils';
import { GQL } from '../../types/schema';
import { User } from '../../entity/User';
import { invalidLogin, confirmMessage, accountLockedMessage } from './errorMessages';
import { userIdSessionPrefix } from '../../constants';

export const createInvalidCredentialsMessage = () => [
  {
    path: 'email',
    message: invalidLogin
  }
];

export const createConfirmEmailMessage = () => [
  {
    path: 'email',
    message: confirmMessage
  }
];

export const createAccountLockedMessage = () => [
  {
    path: 'email',
    message: accountLockedMessage
  }
];

export const resolvers: ResolverMap = {
  Query: {
    dummy2: () => 'dummy!'
  },
  Mutation: {
    login: async (
      _,
      { email, password }: GQL.ILoginOnMutationArguments,
      { session, redis, req }
    ) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return createInvalidCredentialsMessage();
      }

      if (!user.confirmed) {
        return createConfirmEmailMessage();
      }

      if (user.forgotPasswordLocked) {
        return createAccountLockedMessage();
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return createInvalidCredentialsMessage();
      }

      // login successful
      session.userId = user.id;
      if (req.sessionID) {
        await redis.lpush(`${userIdSessionPrefix}${user.id}`, req.sessionID);
      }

      return null;
    }
  }
};
