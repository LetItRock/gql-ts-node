import 'reflect-metadata';
import 'dotenv/config';
import { GraphQLServer } from 'graphql-yoga';
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';
import { createTypeormConn } from './utils/createTypeormConn';
import { confirmEmail } from './routes/confirmEmail';
import { redis } from './redis';
import { genSchema } from './utils/genSchema';

const RedisStore = connectRedis(session);

export const startServer = async () => {
  const schema = genSchema();
  const server = new GraphQLServer({
    schema,
    context: ({ request }) => ({
      redis,
      url: `${request.protocol}://${request.get('host')}`,
      session: request.session
    })
  });

  server.express.use(
    session({
      store: new RedisStore({}),
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

  await createTypeormConn();
  const app = await server.start({
    port: process.env.NODE_ENV === 'test' ? 9000 : 4000,
    cors
  });
  console.log('Server is running on localhost:4000');
  return app;
};
