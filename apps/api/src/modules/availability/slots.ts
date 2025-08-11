import { addMinutes, startOfDay, endOfDay, setHours, setMinutes, isBefore } from 'date-fns';
import { PrismaClient } from '@prisma/client';

/**
 * Basic slot generator for a single day. 
 * Uses ScheduleRule and Service duration with buffers. Capacity=1 assumption for day one.
 * All times interpreted in provider's local time assumed to be Africa/Casablanca for seed data.
 */
export async function generateSlotsForDay(
  prisma: PrismaClient,
  providerId: string,
  serviceId: string,
  date: Date
) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new Error('Service not found');

  const weekday = date.getDay(); // 0-6
  const rules = await prisma.scheduleRule.findMany({ where: { providerId, weekday } });

  const existing = await prisma.booking.findMany({
    where: { providerId, serviceId, startTs: { gte: startOfDay(date), lte: endOfDay(date) } },
    select: { startTs: true, endTs: true }
  });

  const slots: { start: Date, end: Date }[] = [];
  for (const r of rules) {
    // translate startMin/endMin into actual times that day
    const start = setMinutes(setHours(date, Math.floor(r.startMin / 60)), r.startMin % 60);
    const end = setMinutes(setHours(date, Math.floor(r.endMin / 60)), r.endMin % 60);
    let cursor = start;
    while (isBefore(addMinutes(cursor, service.duration + service.bufferBefore + service.bufferAfter), end)) {
      const slotStart = addMinutes(cursor, service.bufferBefore);
      const slotEnd = addMinutes(slotStart, service.duration);

      // overlap check against existing
      const overlaps = existing.some(b => !(slotEnd <= b.startTs || slotStart >= b.endTs));
      if (!overlaps) {
        slots.push({ start: slotStart, end: slotEnd });
      }
      cursor = addMinutes(cursor, service.duration + service.bufferBefore + service.bufferAfter);
    }
  }
  return slots;
}
