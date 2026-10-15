import { planetById } from '@nova/data';
import { describe, expect, it } from 'vitest';
import { type Combat, createCombat, loadScenario } from '../src/combat';
import { difficulty } from '../src/planet';

/**
 * Scenario de charge (FR-036, research R14) et performance de la sim (SC-006) : 1 200 pas du
 * scenario de charge, combats enchaines, se calculent en moins de 50 ms. Mediane de 5 executions
 * apres 2 d'echauffement (`performance.now` est permis dans les tests, pas dans `src/`).
 */

const PAS = 1200;

const vivants = (c: Combat): number =>
  c.state.enemies.filter((e) => e.hp > 0).length + c.state.units.filter((u) => u.hp > 0).length;

/** Enchaine des combats du scenario de charge jusqu'a 1 200 pas ; `observe` voit chaque pas. */
function enchainer(observe?: (c: Combat) => void): number {
  let pas = 0;
  let combats = 0;
  while (pas < PAS) {
    const c = createCombat(loadScenario());
    combats += 1;
    while (!c.result() && pas < PAS) {
      c.step();
      pas += 1;
      observe?.(c);
    }
  }
  return combats;
}

describe('scenario de charge', () => {
  it('Alpha au sol en 360 degres, graine 1, vagues a un pas d intervalle, planete de difficulte 5', () => {
    const s = loadScenario();
    expect(s).toMatchObject({
      seed: 1,
      theatre: 'sol',
      formation: 'ring',
      waveIntervalTicks: 1,
      commands: [],
    });
    expect(s.squad.id).toBe('alpha');
    expect(s.placement).toHaveLength(5);
    const planete = planetById(s.planet);
    expect(planete?.status).toBe('HOSTILE');
    expect(planete && difficulty(planete)).toBe(5);
  });

  it('au moins 60 entites vivantes a la fois, pendant plus de 10 s', () => {
    let pic = 0;
    let pasA60 = 0;
    enchainer((c) => {
      const n = vivants(c);
      pic = Math.max(pic, n);
      if (n >= 60) pasA60 += 1;
    });
    expect(pic).toBeGreaterThanOrEqual(60);
    expect(pasA60).toBeGreaterThan(200);
  });

  it('meme scenario, meme combat', () => {
    const a = createCombat(loadScenario());
    const b = createCombat(loadScenario());
    for (let i = 0; i < 100; i++) {
      a.step();
      b.step();
    }
    expect(a.fingerprint()).toBe(b.fingerprint());
  });
});

describe('SC-006 : performance', () => {
  it('1 200 pas du scenario de charge en moins de 50 ms (mediane de 5)', () => {
    enchainer();
    enchainer();
    const durees = Array.from({ length: 5 }, () => {
      const debut = performance.now();
      enchainer();
      return performance.now() - debut;
    }).sort((x, y) => x - y);
    expect(durees[2]).toBeLessThan(50);
  });
});
