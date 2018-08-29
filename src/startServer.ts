import 'reflect-metadata';
import 'dotenv/config';
import * as RateLimit from 'express-rate-limit';
import * as RateLimitRedisStore from 'rate-limit-redis';
import { GraphQLServer } from 'graphql-yoga';
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import * as passport from 'passport';
import { Strategy } from 'passport-twitter';
import { createTypeormConn } from './utils/createTypeormConn';
import { confirmEmail } from './routes/confirmEmail';
import { redis } from './redis';
import { genSchema } from './utils/genSchema';
import { redisSessionPrefix } from './constants';
import { User } from './entity/User';
import { createTestConn } from './testUtils/createTestConn';

const RedisStore = connectRedis(session);

export const startServer = async () => {
  const schema = genSchema();
  const server = new GraphQLServer({
    schema,
    context: ({ request }) => ({
      redis,
      url: `${request.protocol}://${request.get('host')}`,
      session: request.session,
      req: request
    })
  });

  server.express.use(
    new RateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      delayMs: 0, // disable delaying - full speed until the max limit is reached
      store: new RateLimitRedisStore({
        client: redis
      })
    })
  );

  server.express.use(
    session({
      store: new RedisStore({
        client: redis as any,
        prefix: redisSessionPrefix
      }),
      name: 'qid',
      secret: process.env.SESSION_SECRET || 'my_secure_session_secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      }
    })
  );

  const cors = {
    credentials: true,
    origin:
      process.env.NODE_ENV === 'test'
        ? '*'
        : (process.env.FRONTEND_HOST as string)
  };

  server.express.get('/confirm/:id', confirmEmail);

  const connection =
    process.env.NODE_ENV === 'test'
      ? await createTestConn(true)
      : await createTypeormConn();

  passport.use(
    new Strategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY as string,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET as string,
        callbackURL: 'http://127.0.0.1:3000/auth/twitter/callback',
        includeEmail: true
      },
      async (_, __, profile, cb) => {
        const { id, emails } = profile;
        const query = connection
          .getRepository(User)
          .createQueryBuilder('user')
          .where('user.twitterId = :id', { id });

        let email: string | null = null;
        if (emails) {
          email = emails[0].value;
          query.orWhere('user.email = :email', { email });
        }

        let user = await query.getOne();

        // this user needs to be registered
        if (!user) {
          user = await User.create({
            twitterId: id,
            email
          }).save();
        } else if (!user.twitterId) {
          // we found user by email
          // merge account
          user.twitterId = id;
          await user.save();
        } else {
          // we have twitterId
          // login
        }

        return cb(null, { id: user.id });
      }
    )
  );

  server.express.use(passport.initialize());

  server.express.get('/auth/twitter', passport.authenticate('twitter'));

  server.express.get(
    '/auth/twitter/callback',
    passport.authenticate('twitter', { session: false }),
    (req, res) => {
      // successfull authentication redirect home
      (req.session as any).userId = req.user.id;
      // @todo redirect to frontend
      res.redirect('http://localhost:3000/some-page');
    }
  );

  const app = await server.start({
    port: process.env.NODE_ENV === 'test' ? 9000 : 4000,
    cors
  });
  console.log('Server is running on localhost:4000');
  return app;
};
