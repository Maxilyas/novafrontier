import { z } from 'zod';
import { engineSchema } from './common';

/** Motorisation (panneau "Motorisation" de l'Atlas, lignes 1360-1366). */
export const engineSpecSchema = z.object({
  id: engineSchema,
  description: z.string().min(1),
  /** Consommation, en unites de carburant par UA. */
  fuelRate: z.number().positive(),
});
export type EngineSpec = z.infer<typeof engineSpecSchema>;
