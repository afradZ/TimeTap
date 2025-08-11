import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { slotsRouter } from './modules/availability/routes.js';
import { providersRouter } from './modules/providers/routes.js';

const app = Fastify({ logger: true });
await app.register(helmet);
await app.register(cors, { origin: true });
await app.register(sensible);

const prisma = new PrismaClient();
app.decorate('prisma', prisma);

app.get('/health', async () => ({ ok: true }));

app.register(providersRouter, { prefix: '/providers' });
app.register(slotsRouter, { prefix: '/' });

app.addHook('onClose', async (instance) => {
  await prisma.$disconnect();
});

const start = async () => {
  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info(`API listening on :${env.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}
