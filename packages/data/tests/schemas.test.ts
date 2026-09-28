import { describe, expect, it } from 'vitest';
import {
  buildingSchema,
  buildingSlots,
  buildingSlotsSchema,
  buildings,
  crateSchema,
  crates,
  damageMatrix,
  damageMatrixSchema,
  demoState,
  demoStateSchema,
  enemy,
  enemySchema,
  launchPool,
  launchPoolSchema,
  planetIncome,
  planetIncomeSchema,
  planetSchema,
  planets,
  rarities,
  raritySchema,
  researchTreeSchema,
  researchTrees,
  unitSchema,
  units,
  weaponSchema,
  weapons,
} from '../src';

describe('chaque donnee passe son schema', () => {
  it.each([
    ['raretes', raritySchema.array(), rarities],
    ['armements', weaponSchema.array(), weapons],
    ['matrice de degats', damageMatrixSchema, damageMatrix],
    ['adversaire', enemySchema, enemy],
    ['unites', unitSchema.array(), units],
    ['batiments', buildingSchema.array(), buildings],
    ['emplacements de batiments', buildingSlotsSchema, buildingSlots],
    ['arbres de recherche', researchTreeSchema.array(), researchTrees],
    ['planetes', planetSchema.array(), planets],
    ['revenus planetaires', planetIncomeSchema.array(), planetIncome],
    ['coffres', crateSchema.array(), crates],
    ['pool de lancement', launchPoolSchema, launchPool],
    ['etat de demonstration', demoStateSchema, demoState],
  ] as const)('%s', (_nom, schema, valeur) => {
    const resultat = schema.safeParse(valeur);
    expect(resultat.error?.issues ?? []).toEqual([]);
  });
});
