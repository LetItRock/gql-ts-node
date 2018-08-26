import * as bcrypt from 'bcryptjs';
import { ResolverMap } from '../../types/graphql-utils';
import { GQL } from '../../types/schema';
import { User } from '../../entity/User';
import { invalidLogin, confirmMessage } from './errorMessages';

export const createInvalidCredentialsMessage = () => [
  {
    path: 'email',
    message: invalidLogin
  }
];

export const createConfirmEmailMessage = () => [{
  path: 'email',
  message: confirmMessage,
}]

export const resolvers: ResolverMap = {
  Query: {
    dummy2: () => 'dummy!'
  },
  Mutation: {
    login: async (_, { email, password }: GQL.ILoginOnMutationArguments) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return createInvalidCredentialsMessage();
      }

      if (!user.confirmed) {
        return createConfirmEmailMessage();
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return createInvalidCredentialsMessage();
      }

      return null;
    }
  }
};
