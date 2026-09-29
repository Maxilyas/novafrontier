import { z } from 'zod';
import {
  activeWeaponIdSchema,
  nonNegativeIntSchema,
  positiveIntSchema,
  theatreSchema,
  unlockedSquadIdSchema,
  weaponIdSchema,
} from './common';
import { planetIdSchema } from './planet';

/**
 * Valeurs derivees de la maquette (data-model.md §4, research R9) : ce que la maquette calcule
 * par ses regles, fige par `pnpm --filter @nova/web mockup:extract` et verifie par le test oracle.
 * Nombres bruts ; le formatage a la francaise se fait a l'affichage.
 */

const unitIdSchema = z.string().min(1);
const percentSchema = z.number().int().min(0).max(100);
const lineSchema = z.enum(['front', 'back']);

/** Synthese d'une escouade (Escouades, lignes 1079-1085 et 1180-1235). */
export const squadDerivedSchema = z.object({
  /** Emplacements occupes, commandant compris (0 a 6). */
  filled: z.number().int().min(0).max(6),
  /** Vaisseaux et mecas assignes. */
  unitCount: nonNegativeIntSchema,
  power: nonNegativeIntSchema,
  dominantWeapon: activeWeaponIdSchema,
  /** Effectifs par armement, dans l'ordre de la maquette, avec la part arrondie affichee. */
  weaponMix: z.array(
    z.object({ weapon: weaponIdSchema, count: positiveIntSchema, percent: percentSchema }),
  ),
  totalHp: nonNegativeIntSchema,
  totalAttack: nonNegativeIntSchema,
  averageDefense: nonNegativeIntSchema,
});

/** Trajet vers la planete visee (Carte, hologramme, lignes 1736-1788). */
export const routeDerivedSchema = z.object({
  target: planetIdSchema,
  distance: positiveIntSchema,
  fuelRequired: positiveIntSchema,
  fuelAvailable: nonNegativeIntSchema,
  /** Temps de trajet affiche, par exemple "7h 06". */
  travelTime: z.string().regex(/^\d+h \d{2}$/),
  squadSpeed: positiveIntSchema,
  difficulty: z.number().int().min(1).max(5),
  loot: positiveIntSchema,
  inRange: z.boolean(),
  reach: positiveIntSchema,
});

/** Simulation du Briefing pour une escouade (winChance, lignes 1813-1820 ; contrainte 1847-1849). */
export const briefingDerivedSchema = z.object({
  sentPower: nonNegativeIntSchema,
  enemyPower: nonNegativeIntSchema,
  /** Multiplicateur de l'armement dominant contre l'armement adverse. */
  advantage: z.number().positive(),
  /** Chances de victoire ; null pour une escouade sans unite, que la maquette affiche "NaN%". */
  winChance: percentSchema.nullable(),
  /** Unites de blindage moyen ou lourd. */
  armoredUnits: nonNegativeIntSchema,
  constraintMet: z.boolean(),
});

/** Vague annoncee (wavesFor, lignes 1806-1812). */
export const waveSchema = z.object({
  index: positiveIntSchema,
  boss: z.boolean(),
  composition: z.string().min(1),
  weapon: weaponIdSchema,
  /** Menace : l (legere), m (moyenne), h (lourde), b (boss). */
  threat: z.enum(['l', 'm', 'h', 'b']),
});

export const missionDerivedSchema = z.object({
  waves: z.array(waveSchema).min(1),
  /** Revenu quotidien gagne avec le territoire, en credits. */
  territoryGain: positiveIntSchema,
});

/** Unites engagees, placees automatiquement (autoPlace, lignes 1981-1991). */
export const deploymentDerivedSchema = z.object({
  /** Dans l'ordre de la liste "Unites a placer", avec la ligne de leur emplacement. */
  units: z.array(z.object({ unit: unitIdSchema, line: lineSchema })),
});

/** Etat initial du combat (startCombat, lignes 2166-2183). */
export const combatStartDerivedSchema = z.object({
  /** Dans l'ordre du panneau "Force engagee", a pleine sante. */
  units: z.array(z.object({ unit: unitIdSchema, maxHp: positiveIntSchema })),
});

/** Valeurs du Combat communes a toutes les escouades. */
export const combatDerivedSchema = z.object({
  /** Intitule (#combatname) par theatre. */
  titles: z.record(theatreSchema, z.string().min(1)),
  /** Delai affiche avant la vague suivante, au premier instant du combat. */
  nextWaveIn: z.string().regex(/^\d+:\d{2}$/),
  ultimate: z.object({
    ready: z.boolean(),
    level: positiveIntSchema,
    /** Progression vers le prochain ultime (0 a 1). */
    progress: z.number().min(0).max(1),
  }),
});

const parEscouade = <T extends z.ZodType>(schema: T) => z.record(unlockedSquadIdSchema, schema);
const parTheatre = <T extends z.ZodType>(schema: T) => z.record(theatreSchema, schema);

export const derivedValuesSchema = z.object({
  squads: parEscouade(squadDerivedSchema),
  route: routeDerivedSchema,
  briefing: parEscouade(briefingDerivedSchema),
  mission: missionDerivedSchema,
  deployment: parEscouade(parTheatre(deploymentDerivedSchema)),
  combatStart: parEscouade(parTheatre(combatStartDerivedSchema)),
  combat: combatDerivedSchema,
});

export type SquadDerived = z.infer<typeof squadDerivedSchema>;
export type RouteDerived = z.infer<typeof routeDerivedSchema>;
export type BriefingDerived = z.infer<typeof briefingDerivedSchema>;
export type Wave = z.infer<typeof waveSchema>;
export type DeploymentDerived = z.infer<typeof deploymentDerivedSchema>;
export type CombatStartDerived = z.infer<typeof combatStartDerivedSchema>;
export type DerivedValues = z.infer<typeof derivedValuesSchema>;
