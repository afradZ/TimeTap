import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { generateSlotsForDay } from './slots.js';

export const slotsRouter: FastifyPluginAsync = async (app) => {
  app.get('/providers/:id/services/:sid/slots', async (req, reply) => {
    const params = z.object({ id: z.string(), sid: z.string() }).parse(req.params);
    const query = z.object({ date: z.string() }).parse(req.query);
    const date = new Date(query.date);

    const slots = await generateSlotsForDay(app.prisma, params.id, params.sid, date);
    return slots.map(s => ({
      start: s.start.toISOString(),
      end: s.end.toISOString()
    }));
  });
};
