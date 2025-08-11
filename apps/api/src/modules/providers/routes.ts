import { FastifyPluginAsync } from 'fastify';

export const providersRouter: FastifyPluginAsync = async (app) => {
  app.get('/', async (req, reply) => {
    const providers = await app.prisma.provider.findMany({
      include: { services: true }
    });
    return providers;
  });

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const provider = await app.prisma.provider.findUnique({
      where: { id },
      include: { services: true }
    });
    if (!provider) return reply.notFound('Provider not found');
    return provider;
  });
};
