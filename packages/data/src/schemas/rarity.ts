import { z } from 'zod';
import { hexColorSchema, rarityIdSchema } from './common';

export const raritySchema = z.object({
  id: rarityIdSchema,
  label: z.string().min(1),
  color: hexColorSchema,
  /** Nombre maximal d'etoiles affichables : entier 2 a 6. */
  maxStars: z.number().int().min(2).max(6),
  /** Points d'action accordes au commandant de cette rarete : entier 2 a 5. */
  actionPoints: z.number().int().min(2).max(5),
  legendarySlot: z.boolean(),
});
export type Rarity = z.infer<typeof raritySchema>;
