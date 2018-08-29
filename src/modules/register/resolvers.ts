import * as yup from 'yup';
import { User } from '../../entity/User';
import { ResolverMap } from '../../types/graphql-utils';
import { GQL } from '../../types/schema';
import { formatYupError } from '../../utils/formatYupError';
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
} from './errorMessages';
import { createConfirmEmailLink } from '../../utils/createConfirmEmailLInk';
import { registerPasswordValidation } from '../../yupSchemas';
/* import { sendEmail } from '../../utils/sendEmail'; */

const schema = yup.object().shape({
  email: yup
    .string()
    .min(3, emailNotLongEnough)
    .max(255)
    .email(invalidEmail),
  password: registerPasswordValidation,
});

export const resolvers: ResolverMap = {
  Query: {
    dummy: () => 'dummy!',
  },
  Mutation: {
    register: async (_, args: GQL.IRegisterOnMutationArguments, { redis, url }) => {
      try {
        await schema.validate(args, { abortEarly: false });
      } catch (err) {
        return formatYupError(err);
      }
      const { email, password } = args;
      const userAlreadyExist = await User.findOne({
        where: { email },
        select: ['id'],
      });
      if (userAlreadyExist) {
        return [
          {
            path: 'email',
            message: duplicateEmail,
          },
        ];
      }
      const user = User.create({
        email,
        password,
      });
      await user.save();

      /* const confirmUrl: string =  */await createConfirmEmailLink(url, user.id, redis);
      /* await sendEmail(email, confirmUrl); */

      return null;
    },
  },
};
