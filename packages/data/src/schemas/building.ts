import { z } from 'zod';
import { iconIdSchema, positiveIntSchema } from './common';

export const buildingIdSchema = z.enum([
  'hq',
  'refinery',
  'reactor',
  'lab',
  'shipyard',
  'mechbay',
  'radar',
  'market',
  'turret',
]);
export type BuildingId = z.infer<typeof buildingIdSchema>;

export const durationSchema = z.string().regex(/^\d{2}:\d{2}:\d{2}$/);

export const buildingSchema = z.object({
  id: buildingIdSchema,
  name: z.string().min(1),
  level: positiveIntSchema,
  /** Coordonnees du plan de la base de la maquette. */
  position: z.object({ x: positiveIntSchema, y: positiveIntSchema, width: positiveIntSchema }),
  icon: iconIdSchema,
  status: z.string().min(1),
  description: z.string().min(1),
  upgrade: z.object({
    alloy: positiveIntSchema,
    credits: positiveIntSchema,
    duration: durationSchema,
    effect: z.string().min(1),
  }),
});
export type Building = z.infer<typeof buildingSchema>;

export const buildingSlotsSchema = z
  .object({ used: positiveIntSchema, total: positiveIntSchema })
  .refine((s) => s.used <= s.total, { message: '`used <= total`' });
export type BuildingSlots = z.infer<typeof buildingSlotsSchema>;
