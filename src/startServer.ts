import { GraphQLServer } from 'graphql-yoga';
import { createTypeormConn } from './utils/createTypeormConn';
import { confirmEmail } from './routes/confirmEmail';
import { redis } from './redis';
import { genSchema } from './utils/genSchema';

export const startServer = async () => {
  const schema = genSchema();
  const server = new GraphQLServer({
    schema,
    context: ({ request }) => ({
      redis,
      url: `${request.protocol}://${request.get('host')}`,
    })
  });

  server.express.get('/confirm/:id', confirmEmail);

  await createTypeormConn();
  const app = await server.start({
    port: process.env.NODE_ENV === 'test' ? 9000 : 4000
  });
  console.log('Server is running on localhost:4000');
  return app;
};
