import { planets } from './game/planets';
import { rarities } from './game/rarities';
import { researchTrees } from './game/research';
import { units } from './game/units';
import { weapons } from './game/weapons';
import type { Planet, Rarity, RarityId, ResearchNode, Unit, Weapon, WeaponId } from './schemas';

/** Acces par identifiant : lectures pures, aucune regle de jeu (contracts/data-package.md). */

const byId = <T extends { id: string }>(liste: readonly T[]) =>
  new Map<string, T>(liste.map((x) => [x.id, x]));

const unitsById = byId(units);
const raritiesById = byId(rarities);
const weaponsById = byId(weapons);
const planetsById = byId(planets);
const nodesById = byId(researchTrees.flatMap((t) => t.nodes));

export const unitById = (id: string): Unit | undefined => unitsById.get(id);
export const rarityById = (id: RarityId): Rarity | undefined => raritiesById.get(id);
export const weaponById = (id: WeaponId): Weapon | undefined => weaponsById.get(id);
export const planetById = (id: string): Planet | undefined => planetsById.get(id);
export const nodeById = (id: string): ResearchNode | undefined => nodesById.get(id);
