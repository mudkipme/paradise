import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyOauth2 from 'fastify-oauth2';
import fastifyCookie from 'fastify-cookie';
import fastifyJwt from 'fastify-jwt';
import { fastifyAwilixPlugin } from 'fastify-awilix';
import mercurius from 'mercurius';
import path from 'path';
import { URL } from 'url';
import { Context } from 'node:vm';
import config from './services/config';
import { resolvers, schema } from './services/graphql';
import authRoutes from './routes/auth';
import './services/register';

async function start() {
  const app = fastify({
    logger: true,
  });

  app.register(fastifyStatic, {
    root: path.join(__dirname, '../../paradise-client/dist'),
  });

  app.register(fastifyCookie);

  app.register(fastifyJwt, {
    secret: config.get('app.secret'),
    cookie: {
      cookieName: 'token',
    },
  });

  if (config.get('auth.github.enabled')) {
    app.register(fastifyOauth2, {
      name: 'githubOAuth2',
      credentials: {
        client: {
          id: config.get('auth.github.clientId'),
          secret: config.get('auth.github.clientSecret'),
        },
        auth: fastifyOauth2.GITHUB_CONFIGURATION,
      },
      startRedirectPath: '/auth/github',
      callbackUri: new URL('/auth/github/callback', config.get('app.url')).toString(),
      scope: [],
    });
  }

  app.register(fastifyAwilixPlugin);

  app.register(mercurius, {
    schema: await schema(),
    resolvers,
    context: async (request) => {
      const context: Context = {
        cradle: app.diContainer.cradle,
        trainerId: '',
      };
      try {
        const jwt = await request.jwtVerify<{ trainerId: string }>();
        context.trainerId = jwt.trainerId;
      } catch {
        context.trainerId = '';
      }
      return context;
    },
  });

  app.register(authRoutes);
  app.setNotFoundHandler((_, reply) => reply.sendFile('index.html'));

  app.listen(config.get('app.port'), config.get('app.host'));
}

start();
