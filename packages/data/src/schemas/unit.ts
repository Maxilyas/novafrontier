import { z } from 'zod';
import {
  activeWeaponIdSchema,
  armorSchema,
  engineSchema,
  iconIdSchema,
  positiveIntSchema,
  rarityIdSchema,
} from './common';

const baseUnit = {
  id: z.string().min(1),
  /** Index de silhouette pour le generateur d'illustration. */
  visual: z.number().int().nonnegative(),
  rarity: rarityIdSchema,
  name: z.string().min(1),
  role: z.string().min(1),
  code: z.string().min(1),
  level: positiveIntSchema,
  /** Entier >= 1, borne par `maxStars` de la rarete (invariant teste). */
  stars: positiveIntSchema,
};

export const skillSchema = z.object({
  name: z.string().min(1),
  icon: iconIdSchema,
  description: z.string().min(1),
});
export type Skill = z.infer<typeof skillSchema>;

export const commanderSchema = z.object({
  ...baseUnit,
  family: z.literal('cmd'),
  squadBonuses: z.array(z.string().min(1)).min(1),
  skills: z.array(skillSchema).min(1).max(5),
  legendarySkill: z.object({ name: z.string().min(1), description: z.string().min(1) }).optional(),
});
export type Commander = z.infer<typeof commanderSchema>;

export const statsSchema = z.object({
  hp: positiveIntSchema,
  attack: positiveIntSchema,
  defense: positiveIntSchema,
  range: positiveIntSchema,
  speed: positiveIntSchema,
});
export type Stats = z.infer<typeof statsSchema>;

export const combatantSchema = z
  .object({
    ...baseUnit,
    family: z.enum(['ship', 'mech']),
    formation: z.enum(['unite', 'escadrille']),
    count: positiveIntSchema,
    maxCount: positiveIntSchema,
    weapon: activeWeaponIdSchema,
    armor: armorSchema,
    engine: engineSchema.nullable(),
    tier: z.number().int().min(1).max(4),
    carrier: z.boolean(),
    stats: statsSchema,
  })
  .refine((u) => u.formation !== 'unite' || (u.count === 1 && u.maxCount === 1), {
    message: '`unite` implique `count = maxCount = 1`',
  })
  .refine((u) => u.count <= u.maxCount, { message: '`count <= maxCount`' })
  .refine((u) => (u.engine === null) === (u.family === 'mech'), {
    message: "`engine` nul si et seulement si `family = 'mech'`",
  });
export type Combatant = z.infer<typeof combatantSchema>;

export const unitSchema = z.discriminatedUnion('family', [commanderSchema, combatantSchema]);
export type Unit = z.infer<typeof unitSchema>;
