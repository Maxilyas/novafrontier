import { z } from 'zod';
import {
  activeWeaponIdSchema,
  armorSchema,
  hexColorSchema,
  positiveIntSchema,
  weaponIdSchema,
} from './common';

export const weaponSchema = z.object({
  id: weaponIdSchema,
  label: z.string().min(1),
  symbol: z.string().length(1),
  color: hexColorSchema,
  strongAgainst: z.string().min(1),
  profile: z.string().min(1),
  status: z.enum(['active', 'planned']),
});
export type Weapon = z.infer<typeof weaponSchema>;

/** Les 9 cases remplies, multiplicateurs strictement positifs. */
export const damageMatrixSchema = z.record(
  activeWeaponIdSchema,
  z.record(activeWeaponIdSchema, z.number().positive()),
);
export type DamageMatrix = z.infer<typeof damageMatrixSchema>;

export const enemySchema = z.object({
  weapon: activeWeaponIdSchema,
  armor: armorSchema,
  siteDefense: positiveIntSchema,
});
export type Enemy = z.infer<typeof enemySchema>;
