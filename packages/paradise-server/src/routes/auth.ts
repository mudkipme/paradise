import { FastifyPluginCallback } from 'fastify';
import { getGitHubUser } from '../services/auth';

const authRoutes: FastifyPluginCallback = async (fastify) => {
  fastify.get('/auth/github/callback', async (request, reply) => {
    const { trainerService, config } = fastify.diContainer.cradle;
    if (!config.get('auth.github.enabled')) {
      reply.callNotFound();
      return;
    }

    const token = await fastify.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
    const user = await getGitHubUser(token.access_token);
    const trainer = await trainerService.findOrCreateTrainer({
      provider: 'github', id: user.id, name: user.name, user,
    });

    const jwtToken = fastify.jwt.sign({ trainerId: trainer.id }, { expiresIn: 86400 });
    reply.setCookie('token', jwtToken, {
      path: '/',
      httpOnly: true,
      sameSite: true,
    });

    reply.redirect('/');
  });

  fastify.post('/auth/logout', async (_, reply) => {
    reply.clearCookie('token');
    reply.send();
  });
};

export default authRoutes;
