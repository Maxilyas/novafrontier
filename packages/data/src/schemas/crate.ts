import { z } from 'zod';
import { iconIdSchema, rarityIdSchema } from './common';

export const crateSchema = z.object({
  id: z.enum(['free', 'week', 'prem']),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  icon: iconIdSchema,
  /** Somme = 100, a 0,01 pres. */
  odds: z
    .array(z.object({ rarity: rarityIdSchema, percent: z.number().positive() }))
    .min(1)
    .refine((o) => Math.abs(o.reduce((s, x) => s + x.percent, 0) - 100) <= 0.01, {
      message: 'les taux doivent sommer a 100',
    }),
  availability: z.string().min(1),
  cta: z.string().min(1),
});
export type Crate = z.infer<typeof crateSchema>;

export const launchPoolSchema = z.object({
  groups: z
    .array(
      z.object({
        rarity: rarityIdSchema,
        label: z.string().min(1),
        units: z.array(z.string().min(1)),
      }),
    )
    .min(1),
  /** Cases verrouillees : paliers pas encore ouverts. */
  locked: z.array(rarityIdSchema),
});
export type LaunchPool = z.infer<typeof launchPoolSchema>;
