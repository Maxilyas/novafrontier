import { z } from 'zod';

/** Enumerations de data-model.md §1 : valeurs exactes de la maquette. */

export const rarityIdSchema = z.enum(['com', 'rare', 'epic', 'leg', 'div']);
export type RarityId = z.infer<typeof rarityIdSchema>;

export const weaponIdSchema = z.enum(['las', 'art', 'nuc', 'ion', 'cin']);
export type WeaponId = z.infer<typeof weaponIdSchema>;

export const activeWeaponIdSchema = z.enum(['las', 'art', 'nuc']);
export type ActiveWeaponId = z.infer<typeof activeWeaponIdSchema>;

export const unitFamilySchema = z.enum(['cmd', 'ship', 'mech']);
export type UnitFamily = z.infer<typeof unitFamilySchema>;

export const armorSchema = z.enum(['Léger', 'Moyen', 'Lourd']);
export type Armor = z.infer<typeof armorSchema>;

export const engineSchema = z.enum(['Standard', 'Léger', 'Subspatial']);
export type Engine = z.infer<typeof engineSchema>;

export const formationSchema = z.enum(['ring', 'arc']);
export type Formation = z.infer<typeof formationSchema>;

export const theatreSchema = z.enum(['orbital', 'sol']);
export type Theatre = z.infer<typeof theatreSchema>;

export const actionPointsModeSchema = z.enum(['fixe', 'achat']);
export type ActionPointsMode = z.infer<typeof actionPointsModeSchema>;

export const researchTreeIdSchema = z.enum(['arm', 'flotte', 'cmdt']);
export type ResearchTreeId = z.infer<typeof researchTreeIdSchema>;

export const researchStateSchema = z.enum(['done', 'active', 'lock']);
export type ResearchState = z.infer<typeof researchStateSchema>;

export const planetStatusSchema = z.enum([
  'BASE',
  'CONTRÔLE',
  'HOSTILE',
  'NEUTRE',
  'MARCHAND',
  'INEXPLORÉ',
]);
export type PlanetStatus = z.infer<typeof planetStatusSchema>;

export const squadIdSchema = z.enum(['alpha', 'bravo', 'charlie', 'delta', 'echo']);
export type SquadId = z.infer<typeof squadIdSchema>;

/** Escouades jouables en phase P0 de la feuille de route : Delta et Echo restent verrouillees. */
export const unlockedSquadIdSchema = z.enum(['alpha', 'bravo', 'charlie']);
export type UnlockedSquadId = z.infer<typeof unlockedSquadIdSchema>;

/** Les 37 symboles du sprite d'icones de la maquette (lignes 632-668). */
export const iconIdSchema = z.enum([
  'ic-cmd',
  'ic-ship',
  'ic-mech',
  'ic-squad',
  'ic-credits',
  'ic-alloy',
  'ic-fuel',
  'ic-artefact',
  'ic-hq',
  'ic-refinery',
  'ic-lab',
  'ic-shipyard',
  'ic-mechbay',
  'ic-reactor',
  'ic-radar',
  'ic-market',
  'ic-turret',
  'ic-silo',
  'ic-tech',
  'ic-map',
  'ic-crate',
  'ic-weapon',
  'ic-engine',
  'ic-cargo',
  'ic-shield',
  'ic-strike',
  'ic-emp',
  'ic-heal',
  'ic-overload',
  'ic-spy',
  'ic-relic',
  'ic-ult',
  'ic-def',
  'ic-atk',
  'ic-mine',
  'ic-nego',
  'ic-academy',
]);
export type IconId = z.infer<typeof iconIdSchema>;

export const screenIdSchema = z.enum([
  'escouades',
  'atlas',
  'base',
  'recherche',
  'carte',
  'briefing',
  'deploiement',
  'combat',
  'butin',
]);
export type ScreenId = z.infer<typeof screenIdSchema>;

export const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

export const positiveIntSchema = z.number().int().positive();
export const nonNegativeIntSchema = z.number().int().nonnegative();
