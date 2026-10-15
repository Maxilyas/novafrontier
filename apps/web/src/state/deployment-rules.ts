import type { Formation, Squad, Theatre } from '@nova/data';
import {
  autoPlacement,
  engagedUnits,
  formationSlots,
  type Placement,
  validatePlacement,
} from '@nova/sim';

/**
 * Regles du plateau de deploiement (FR-037 a FR-044, research R18) : fonctions pures sur un
 * placement. Chaque resultat est verifie par `validatePlacement` de la sim : un placement invalide
 * n'est jamais rendu (FR-044).
 */

export interface Combo {
  readonly squad: Squad;
  readonly theatre: Theatre;
  readonly formation: Formation;
}

/** Cle de memorisation d'un placement : escouade, theatre et formation (FR-041). */
export const comboKey = (c: Combo): string => `${c.squad.id}/${c.theatre}/${c.formation}`;

/** Placement a la premiere arrivee : automatique si l'interrupteur du Briefing est actif (FR-041). */
export const initialPlacement = (c: Combo, autoDeploy: boolean): Placement =>
  autoDeploy ? autoPlacement(c.squad, c.theatre, c.formation) : [];

const trie = (p: Placement): Placement => [...p].sort((a, b) => a.slot - b.slot);

function verifie(c: Combo, p: Placement): Placement | null {
  return validatePlacement(c.squad, c.theatre, c.formation, p).ok ? trie(p) : null;
}

const typeUnite = (c: Combo, unite: string) =>
  engagedUnits(c.squad, c.theatre).find((u) => u.id === unite)?.family;

const emplacement = (c: Combo, rang: number) =>
  formationSlots(c.formation, c.theatre).find((s) => s.index === rang);

export const occupant = (p: Placement, rang: number): string | undefined =>
  p.find((x) => x.slot === rang)?.unit;

export const slotOf = (p: Placement, unite: string): number | undefined =>
  p.find((x) => x.unit === unite)?.slot;

/** L'unite peut-elle aller sur cet emplacement ? Il doit exister, etre de son type et libre. */
export function canPlace(c: Combo, p: Placement, unite: string, rang: number): boolean {
  const s = emplacement(c, rang);
  return s !== undefined && s.kind === typeUnite(c, unite) && occupant(p, rang) === undefined;
}

/**
 * Pose l'unite sur l'emplacement (FR-039) ; elle quitte son ancien emplacement. Refus (`null`) :
 * emplacement inexistant, de l'autre type ou occupe.
 */
export function placeOn(c: Combo, p: Placement, unite: string, rang: number): Placement | null {
  if (!canPlace(c, p, unite, rang)) return null;
  return verifie(c, [...p.filter((x) => x.unit !== unite), { unit: unite, slot: rang }]);
}

/** Retire l'unite du plateau. */
export const removeUnit = (p: Placement, unite: string): Placement =>
  p.filter((x) => x.unit !== unite);

/** Retire l'unite qui occupe l'emplacement (clic sur un emplacement occupe, FR-039). */
export const removeAt = (p: Placement, rang: number): Placement => p.filter((x) => x.slot !== rang);

/**
 * Depot d'un glisser-deposer (FR-039 et cas limites de la spec) :
 * - sur un emplacement libre de son type, l'unite s'y pose ;
 * - sur un emplacement occupe de son type, les deux unites echangent leurs places (l'occupant
 *   retourne dans la liste si l'unite deplacee venait de la liste) ;
 * - ailleurs (hors emplacement, autre type), rien ne change : l'unite revient d'ou elle venait.
 */
export function drop(c: Combo, p: Placement, unite: string, rang: number | null): Placement {
  if (rang === null) return p;
  const s = emplacement(c, rang);
  if (!s || s.kind !== typeUnite(c, unite)) return p;
  const autre = occupant(p, rang);
  if (autre === undefined) return placeOn(c, p, unite, rang) ?? p;
  if (autre === unite) return p;
  const depart = slotOf(p, unite);
  const sans = p.filter((x) => x.unit !== unite && x.unit !== autre);
  const echange =
    depart === undefined
      ? [...sans, { unit: unite, slot: rang }]
      : [...sans, { unit: unite, slot: rang }, { unit: autre, slot: depart }];
  return verifie(c, echange) ?? p;
}
