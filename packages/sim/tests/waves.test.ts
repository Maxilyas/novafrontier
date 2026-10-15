import { derivedValues, enemyArchetypes, planetById } from '@nova/data';
import { describe, expect, it } from 'vitest';
import { wavesFor } from '../src/waves';

/** Vagues de la planete visee (FR-003, FR-004, FR-034). */

describe('vagues de Gemenon', () => {
  const cible = planetById(derivedValues.route.target);
  const vagues = cible ? wavesFor(cible) : [];
  const maquette = derivedValues.mission.waves;

  it('6 vagues, le boss a la derniere', () => {
    expect(vagues).toHaveLength(6);
    expect(vagues.map((v) => v.boss)).toEqual(maquette.map((v) => v.boss));
  });

  it('armements et menaces de la maquette', () => {
    expect(vagues.map((v) => [v.index, v.weapon, v.threat])).toEqual(
      maquette.map((v) => [v.index, v.weapon, v.threat]),
    );
  });

  it('compositions corrigees, celles des archetypes', () => {
    for (const v of vagues) expect(v.composition).toBe(enemyArchetypes[v.threat].composition);
  });
});
