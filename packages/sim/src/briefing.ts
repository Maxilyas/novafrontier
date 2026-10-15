import {
  type ActiveWeaponId,
  type BriefingDerived,
  type Combatant,
  damageMatrix,
  demoState,
  type Planet,
  type RouteDerived,
  rarityById,
  type Squad,
  type SquadDerived,
  unitById,
} from '@nova/data';
import { roundDiv } from './fixed';
import { difficulty, fuelOf, lootOf, planetDistance, travel } from './planet';

/**
 * Valeurs de briefing (research R9, FR-033) : les formules de la maquette en arithmetique entiere
 * exacte. Les decimales de la maquette (0,6 ; 0,86 ; 0,08...) deviennent des fractions entieres ;
 * chaque `Math.round` porte sur le rationnel exact (`roundDiv`). Les ecrans lisent ces valeurs ici,
 * au lieu de l'instantane `derivedValues` de @nova/data, qui ne sert plus qu'aux tests.
 */

/** Ultime de palier tous les 10 niveaux (`ULT_EVERY`, ligne 2163). */
const PALIER_ULTIME = 10;

/** Contrainte de la mission de demonstration : au moins 2 unites de blindage moyen ou lourd. */
const BLINDES_REQUIS = 2;

const combattants = (squad: Squad): readonly Combatant[] =>
  [...squad.ships, ...squad.mechs]
    .map((id) => (id === null ? undefined : unitById(id)))
    .filter((u): u is Combatant => u !== undefined && u.family !== 'cmd');

/**
 * `power` (lignes 1079-1081) : somme de (PV x 0,6 + ATQ x 6 + DEF x 4) x effectif / 10, multipliee par
 * 1 + 0,06 par point d'action du commandant, arrondie. En centiemes : (6 PV + 60 ATQ + 40 DEF) x
 * effectif / 100, puis x (100 + 6 x points) / 100.
 */
function puissance(squad: Squad): number {
  const centiemes = combattants(squad).reduce(
    (p, u) => p + (6 * u.stats.hp + 60 * u.stats.attack + 40 * u.stats.defense) * u.count,
    0,
  );
  const commandant = squad.commander === null ? undefined : unitById(squad.commander);
  if (commandant?.family !== 'cmd') return roundDiv(centiemes, 100);
  const points = rarityById(commandant.rarity)?.actionPoints ?? 0;
  return roundDiv(centiemes * (100 + 6 * points), 10_000);
}

/** Effectifs par armement, dans l'ordre d'apparition (`squadWeapons`, lignes 1082-1083). */
function effectifsParArme(squad: Squad): Map<ActiveWeaponId, number> {
  const m = new Map<ActiveWeaponId, number>();
  for (const u of combattants(squad)) m.set(u.weapon, (m.get(u.weapon) ?? 0) + u.count);
  return m;
}

/** `dominantWeapon` (lignes 1084-1085) : le premier armement au plus grand effectif, laser a defaut. */
function armeDominante(effectifs: Map<ActiveWeaponId, number>): ActiveWeaponId {
  let arme: ActiveWeaponId = 'las';
  let max = -1;
  for (const [a, n] of effectifs) {
    if (n > max) {
      max = n;
      arme = a;
    }
  }
  return arme;
}

/** Synthese d'une escouade (Escouades, lignes 1104-1108 et 1180-1189). */
export function squadSummary(squad: Squad): SquadDerived {
  const unites = combattants(squad);
  const effectifs = effectifsParArme(squad);
  const total = [...effectifs.values()].reduce((a, n) => a + n, 0) || 1;
  const defenses = unites.reduce((a, u) => a + u.stats.defense, 0);
  return {
    filled: [squad.commander, ...squad.ships, ...squad.mechs].filter((id) => id !== null).length,
    unitCount: unites.length,
    power: puissance(squad),
    dominantWeapon: armeDominante(effectifs),
    weaponMix: [...effectifs].map(([weapon, count]) => ({
      weapon,
      count,
      percent: roundDiv(100 * count, total),
    })),
    totalHp: unites.reduce((a, u) => a + u.stats.hp * u.count, 0),
    totalAttack: unites.reduce((a, u) => a + u.stats.attack * u.count, 0),
    averageDefense: unites.length > 0 ? roundDiv(defenses, unites.length) : 0,
  };
}

/**
 * Trajet vers une planete (Carte, hologramme, lignes 1736-1741). Carburant disponible et portee du
 * moteur sont ceux de l'etat de demonstration, tant que le profil du joueur n'est pas sauvegarde
 * (phase P5 de la feuille de route).
 */
export function route(target: Planet): RouteDerived {
  const distance = planetDistance(target);
  const { speed, time } = travel(target);
  const reach = demoState.mission.reach;
  return {
    target: target.id,
    distance,
    fuelRequired: fuelOf(target),
    fuelAvailable: demoState.resources.fuel,
    travelTime: time,
    squadSpeed: speed,
    difficulty: difficulty(target),
    loot: lootOf(target),
    inRange: distance <= reach,
    reach,
  };
}

/**
 * Simulation du Briefing (`winChance`, lignes 1815-1820 ; contrainte, lignes 1849-1851) contre
 * l'adversaire de la mission. Avec p la puissance envoyee, m le multiplicateur de l'armement
 * dominant en centiemes et d la difficulte :
 * - puissance adverse = round(p x 0,86 / (m / 100) x (1 + (d - 2) x 0,08))
 *   = round(p x 86 x (100 + 8 (d - 2)) / (100 m)) ;
 * - chances = round(100 x p m / (p m + 100 x adverse)), bornees a 4..96 ; nulles sans unite, ou la
 *   maquette affiche "NaN%".
 */
export function briefing(squad: Squad, target: Planet): BriefingDerived {
  const p = puissance(squad);
  const advantage =
    damageMatrix[armeDominante(effectifsParArme(squad))][demoState.mission.enemy.weapon];
  const m = Math.round(advantage * 100);
  const enemyPower = roundDiv(p * 86 * (100 + 8 * (difficulty(target) - 2)), 100 * m);
  const armoredUnits = combattants(squad).filter(
    (u) => u.armor === 'Lourd' || u.armor === 'Moyen',
  ).length;
  return {
    sentPower: p,
    enemyPower,
    advantage,
    winChance:
      p === 0 ? null : Math.max(4, Math.min(96, roundDiv(100 * p * m, p * m + 100 * enemyPower))),
    armoredUnits,
    constraintMet: armoredUnits >= BLINDES_REQUIS,
  };
}

/**
 * Ultime de palier (lignes 2163-2164 et 2331-2332) : pret aux niveaux multiples de 10 ; sinon,
 * niveau du prochain palier et progression vers lui.
 */
export function ultimateStatus(level: number): {
  ready: boolean;
  level: number;
  progress: number;
} {
  const reste = level % PALIER_ULTIME;
  return {
    ready: reste === 0,
    level: (Math.floor(level / PALIER_ULTIME) + 1) * PALIER_ULTIME,
    progress: reste / PALIER_ULTIME,
  };
}
