import * as yup from 'yup';
import * as bcrypt from 'bcryptjs';
import { ResolverMap } from '../../types/graphql-utils';
import { GQL } from '../../types/schema';
import { User } from '../../entity/User';
import { forgotPasswordLockAccount } from '../../utils/forgotPasswordLockAccount';
import { createForgotPasswordLink } from '../../utils/createForgotPasswordLink';
import { userNotFoundError, expiredKey } from './errorMessages';
import { forgotPasswordPrefix } from '../../constants';
import { registerPasswordValidation } from '../../yupSchemas';
import { formatYupError } from '../../utils/formatYupError';

const schema = yup.object().shape({
  newPassword: registerPasswordValidation
});

export const resolvers: ResolverMap = {
  Query: {
    dummy: () => 'dummy!'
  },
  Mutation: {
    sendForgotPasswordEmail: async (
      _,
      { email }: GQL.ISendForgotPasswordEmailOnMutationArguments,
      { redis }
    ) => {
      // lock account
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return [
          {
            path: 'email',
            message: userNotFoundError
          }
        ];
      }

      await forgotPasswordLockAccount(user.id, redis);
      // @TODO add frontend url
      /* const url = */ await createForgotPasswordLink('', user.id, redis);
      // @TODO send email with url

      return true;
    },
    forgotPasswordChange: async (
      _,
      { newPassword, key }: GQL.IForgotPasswordChangeOnMutationArguments,
      { redis }
    ) => {
      const redisKey = `${forgotPasswordPrefix}${key}`;
      const userId = await redis.get(redisKey);
      if (!userId) {
        return [
          {
            path: 'key',
            message: expiredKey
          }
        ];
      }

      try {
        await schema.validate({ newPassword }, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePromise = User.update({ id: userId }, { password: hashedPassword, forgotPasswordLocked: false });
      const deleteKeyPromise = redis.del(redisKey);

      Promise.all([updatePromise, deleteKeyPromise]);

      return null;
    }
  }
};
