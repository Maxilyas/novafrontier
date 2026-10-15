import { basePlanet, type Planet, planets } from '@nova/data';
import { roundDiv as arrondi, isqrt } from './fixed';

/**
 * Trajet vers une planete (maquette, lignes 1641 et 1676-1679, 1737-1741), en arithmetique entiere
 * exacte : les arrondis de la maquette (`|0`, `Math.round`) sont reproduits sur des rationnels.
 */

/** Taux de carburant de la motorisation standard (`fuelRate`, ligne 1674). */
const TAUX_CARBURANT = 1;

/** Vitesses d'escouade de la maquette, choisies par le rang de la planete (particularite conservee). */
const VITESSES = [96, 60, 88] as const;

/** `Math.hypot(dx, dy) * 1.1 | 0` : floor(sqrt(1,21 x S)) = isqrt(floor(121 x S / 100)). */
export function planetDistance(planet: Planet): number {
  const base = basePlanet();
  if (!base) throw new Error('Aucune planete au statut BASE');
  const dx = planet.position.x - base.position.x;
  const dy = planet.position.y - base.position.y;
  return isqrt(Math.floor((121 * (dx * dx + dy * dy)) / 100));
}

/** Difficulte de 1 a 5 (0 pour la base), ligne 1677. */
export function difficulty(planet: Planet): number {
  if (planet.status === 'BASE') return 0;
  return Math.max(1, Math.min(5, arrondi(planetDistance(planet), 220)));
}

/** Butin estime, `round(dist x 3,1 + 400)`, ligne 1678. */
export const lootOf = (planet: Planet): number => arrondi(31 * planetDistance(planet) + 4000, 10);

/** Revenu quotidien du territoire gagne, `round(lootOf / 12)` (renderBrief, ligne 1886). */
export const territoryGain = (planet: Planet): number => arrondi(lootOf(planet), 12);

/** Carburant requis, ligne 1679. */
export const fuelOf = (planet: Planet): number => planetDistance(planet) * TAUX_CARBURANT;

/** Vitesse d'escouade et temps de trajet "Hh MM" (lignes 1739-1741). */
export function travel(planet: Planet): { speed: number; time: string } {
  const rang = planets.findIndex((p) => p.id === planet.id);
  const speed = VITESSES[rang % VITESSES.length] ?? VITESSES[0];
  const d = planetDistance(planet);
  const heures = Math.floor(d / speed);
  const minutes = arrondi((d - heures * speed) * 60, speed);
  return { speed, time: `${heures}h ${String(minutes).padStart(2, '0')}` };
}
