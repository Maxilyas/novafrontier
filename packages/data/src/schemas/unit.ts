import { z } from 'zod';
import { threatSchema } from './combat';
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

/** Ce que le joueur designe pour une competence (FR-013) ; `unit-slot` : une unite, puis un emplacement. */
export const skillTargetSchema = z.enum(['none', 'point', 'unit', 'enemy', 'unit-slot']);
export type SkillTarget = z.infer<typeof skillTargetSchema>;

const share = z.number().positive().max(1);
const positive = z.number().positive();
const dureeMs = positiveIntSchema;

/**
 * Effet d'une competence (FR-014, data-model.md §2.3) : les parametres sont des donnees, la regle
 * qui les applique est dans @nova/sim.
 */
export const skillEffectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('strike-point'), damage: positiveIntSchema, radius: positive }),
  z.object({ kind: z.literal('strike-nearest-relic'), damage: positiveIntSchema }),
  z.object({ kind: z.literal('strike-enemy'), damage: positiveIntSchema }),
  z.object({ kind: z.literal('charge'), damage: positiveIntSchema, radius: positive }),
  z.object({ kind: z.literal('defense-buff'), multiplier: positive, durationMs: dureeMs }),
  z.object({ kind: z.literal('front-damage-cut'), multiplier: share, durationMs: dureeMs }),
  z.object({ kind: z.literal('heal-unit'), share }),
  z.object({ kind: z.literal('heal-all'), share }),
  z.object({ kind: z.literal('heal-point'), share, radius: positive }),
  z.object({
    kind: z.literal('freeze'),
    threats: z.array(threatSchema).min(1),
    durationMs: dureeMs,
  }),
  z.object({
    kind: z.literal('attack-buff-unit'),
    multiplier: positive,
    until: z.literal('next-wave'),
  }),
  z.object({ kind: z.literal('enemy-miss'), chance: share, durationMs: dureeMs }),
  z.object({ kind: z.literal('loot-bonus'), share }),
  z.object({ kind: z.literal('relocate') }),
]);
export type SkillEffect = z.infer<typeof skillEffectSchema>;
export type SkillEffectKind = SkillEffect['kind'];

/** Cible attendue par chaque genre d'effet (invariant de data-model.md §2.3). */
export const TARGET_OF_EFFECT: Readonly<Record<SkillEffectKind, SkillTarget>> = {
  'strike-point': 'point',
  'strike-nearest-relic': 'none',
  'strike-enemy': 'enemy',
  charge: 'none',
  'defense-buff': 'none',
  'front-damage-cut': 'none',
  'heal-unit': 'unit',
  'heal-all': 'none',
  'heal-point': 'point',
  freeze: 'none',
  'attack-buff-unit': 'unit',
  'enemy-miss': 'none',
  'loot-bonus': 'none',
  relocate: 'unit-slot',
};

export const skillSchema = z
  .object({
    name: z.string().min(1),
    icon: iconIdSchema,
    description: z.string().min(1),
    target: skillTargetSchema,
    effect: skillEffectSchema,
  })
  .refine((s) => TARGET_OF_EFFECT[s.effect.kind] === s.target, {
    message: '`target` doit etre la cible attendue par `effect.kind`',
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
