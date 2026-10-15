import { basePlanet, derivedValues, planetById } from '@nova/data';
import { describe, expect, it } from 'vitest';
import { difficulty, fuelOf, lootOf, planetDistance, travel } from '../src/planet';

/** Valeurs du trajet de la maquette (derivedValues.route) recalculees par la sim. */

const cible = planetById(derivedValues.route.target);

describe('trajet vers la planete visee', () => {
  it('existe', () => {
    expect(cible).toBeDefined();
  });

  it('distance, carburant, difficulte, butin, vitesse et temps de la maquette', () => {
    if (!cible) return;
    const r = derivedValues.route;
    expect(planetDistance(cible)).toBe(r.distance);
    expect(fuelOf(cible)).toBe(r.fuelRequired);
    expect(difficulty(cible)).toBe(r.difficulty);
    expect(lootOf(cible)).toBe(r.loot);
    expect(travel(cible)).toEqual({ speed: r.squadSpeed, time: r.travelTime });
  });

  it('la base est de difficulte 0', () => {
    const base = basePlanet();
    expect(base && difficulty(base)).toBe(0);
  });
});
