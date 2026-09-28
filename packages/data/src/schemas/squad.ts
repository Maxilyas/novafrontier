import { z } from 'zod';
import { formationSchema, squadIdSchema } from './common';

const slot = z.string().min(1).nullable();

export const squadSchema = z.object({
  id: squadIdSchema,
  name: z.string().min(1),
  commander: slot,
  ships: z.tuple([slot, slot, slot]),
  mechs: z.tuple([slot, slot]),
  defaultFormation: formationSchema,
  /** Grade requis ("Grade 5") quand l'escouade est verrouillee. */
  lockedUntilRank: z.string().min(1).optional(),
});
export type Squad = z.infer<typeof squadSchema>;
