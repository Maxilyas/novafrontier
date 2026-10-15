import { z } from 'zod';
import { hexColorSchema, positiveIntSchema } from './common';

/**
 * Reglages du combat et archetypes d'ennemis (data-model.md §2.1 et §2.2, research R8). Les
 * valeurs sont celles de la maquette, en millisecondes et en unites d'arene ; la simulation les
 * convertit en pas et en virgule fixe.
 */

/** Menace d'une vague : legere, moyenne, lourde, boss. */
export const threatSchema = z.enum(['l', 'm', 'h', 'b']);
export type Threat = z.infer<typeof threatSchema>;

/** Type d'un emplacement du plateau : vaisseau ou meca. */
export const slotKindSchema = z.enum(['ship', 'mech']);
export type SlotKind = z.infer<typeof slotKindSchema>;

/** Ligne d'un emplacement : premiere (blindes) ou seconde (unites a portee). */
export const lineSchema = z.enum(['front', 'back']);
export type Line = z.infer<typeof lineSchema>;

const positive = z.number().positive();
const point = z.object({ x: z.number(), y: z.number() });
const parFormation = <T extends z.ZodType>(schema: T) => z.object({ ring: schema, arc: schema });

/** Une ligne d'emplacements : `count` places de rayon `radius`, a l'angle `startRad + i * stepRad`. */
const slotLineSchema = z.object({
  count: positiveIntSchema,
  radius: positive,
  startRad: z.number(),
  stepRad: z.number(),
});

/** Secteur d'apparition des ennemis, centre et demi-ouverture en radians. */
const spawnSectorSchema = z.object({ centerRad: z.number(), halfWidthRad: positive });

export const combatTuningSchema = z.object({
  relicHp: positiveIntSchema,
  arena: z.object({ width: positiveIntSchema, height: positiveIntSchema }),
  relicPosition: parFormation(point),
  board: z.object({
    width: positiveIntSchema,
    height: positiveIntSchema,
    objective: parFormation(point),
  }),
  /** Transposition du plateau a l'arene : ecart a l'objectif multiplie par ces facteurs. */
  boardToArena: z.object({ x: positive, y: positive }),
  slots: parFormation(z.object({ front: slotLineSchema, back: slotLineSchema })),
  /** Alternance des types dans chaque ligne, en commencant par le premier. */
  slotTypes: z.tuple([slotKindSchema, slotKindSchema]),
  spawn: z.object({
    sector: parFormation(spawnSectorSchema),
    distance: z.object({ min: positive, range: positive, boss: positive }),
    /** Aplatissement vertical de la position d'apparition. */
    squash: positive,
  }),
  cooldownMs: z.object({ unit: positive, enemyVsUnit: positive, enemyVsRelic: positive }),
  waveIntervalMs: positive,
  relicStrike: z.object({ radius: positive, attackShare: positive }),
  defenseConstant: positive,
  minDamage: positive,
  maxDurationMs: positive,
  advantageLogMs: positive,
});
export type CombatTuning = z.infer<typeof combatTuningSchema>;

export const enemyArchetypeSchema = z.object({
  threat: threatSchema,
  /** Libelle de la composition annoncee (corrige pour dire ce qui apparait, FR-004). */
  composition: z.string().min(1),
  count: positiveIntSchema,
  hp: positiveIntSchema,
  attack: positiveIntSchema,
  defense: positiveIntSchema,
  range: positiveIntSchema,
  /** Unites d'arene par seconde. */
  speed: positive,
  color: hexColorSchema,
  size: positiveIntSchema,
});
export type EnemyArchetype = z.infer<typeof enemyArchetypeSchema>;
