import { describe, expect, it } from 'vitest';
import {
  buildings,
  crates,
  demoState,
  launchPool,
  planetIncome,
  planets,
  rarities,
  researchTrees,
  units,
  weapons,
} from '../src';

/** Invariants de data-model.md §7. */

const ids = (liste: readonly { id: string }[]) => liste.map((x) => x.id);
const sansDoublon = (liste: readonly string[]) => new Set(liste).size === liste.length;

describe('1. identifiants uniques', () => {
  it.each([
    ['raretes', ids(rarities)],
    ['armements', ids(weapons)],
    ['unites', ids(units)],
    ['batiments', ids(buildings)],
    ['planetes', ids(planets)],
    ['coffres', ids(crates)],
    ['escouades', ids(demoState.squads)],
    ['arbres', ids(researchTrees)],
    ['noeuds, tous arbres confondus', researchTrees.flatMap((t) => ids(t.nodes))],
  ] as const)('%s', (_nom, liste) => {
    expect(sansDoublon(liste)).toBe(true);
  });
});

describe('2. references valides', () => {
  const unite = new Map(units.map((u) => [u.id, u]));

  it('les escouades referencent des unites de la bonne famille', () => {
    for (const s of demoState.squads) {
      if (s.commander !== null) expect(unite.get(s.commander)?.family).toBe('cmd');
      for (const id of s.ships) if (id !== null) expect(unite.get(id)?.family).toBe('ship');
      for (const id of s.mechs) if (id !== null) expect(unite.get(id)?.family).toBe('mech');
    }
  });

  it('une escouade verrouillee n a aucune unite', () => {
    for (const s of demoState.squads.filter((x) => x.lockedUntilRank !== undefined)) {
      expect([s.commander, ...s.ships, ...s.mechs].every((x) => x === null)).toBe(true);
    }
  });

  it('les unites referencent des raretes connues', () => {
    const connues = new Set(ids(rarities));
    for (const u of units) expect(connues.has(u.rarity)).toBe(true);
  });

  it('les prerequis sont dans le meme arbre, sans cycle', () => {
    for (const arbre of researchTrees) {
      const noeuds = new Map(arbre.nodes.map((n) => [n.id, n]));
      for (const n of arbre.nodes)
        for (const p of n.prerequisites) expect(noeuds.has(p)).toBe(true);
      const visite = new Set<string>();
      const enCours = new Set<string>();
      const sansCycle = (id: string): boolean => {
        if (enCours.has(id)) return false;
        if (visite.has(id)) return true;
        enCours.add(id);
        const ok = (noeuds.get(id)?.prerequisites ?? []).every(sansCycle);
        enCours.delete(id);
        visite.add(id);
        return ok;
      };
      for (const n of arbre.nodes) expect(sansCycle(n.id)).toBe(true);
    }
  });

  it('les revenus referencent des planetes', () => {
    const connues = new Set(ids(planets));
    for (const r of planetIncome) expect(connues.has(r.planet)).toBe(true);
  });

  it('exactement une planete BASE, et une cible de mission qui n est pas la base', () => {
    expect(planets.filter((p) => p.status === 'BASE')).toHaveLength(1);
    const cible = planets.find((p) => p.id === demoState.mission.target);
    expect(cible).toBeDefined();
    expect(cible?.status).not.toBe('BASE');
  });

  it('le pool de lancement ne cite que des unites de la rarete du groupe', () => {
    for (const g of launchPool.groups) {
      for (const id of g.units) expect(unite.get(id)?.rarity).toBe(g.rarity);
    }
  });

  it('les valeurs par defaut designent des elements existants', () => {
    const d = demoState.defaults;
    expect(unite.has(d.atlas.unit)).toBe(true);
    expect(ids(buildings)).toContain(d.building);
    const arbre = researchTrees.find((t) => t.id === d.tree);
    expect(arbre && ids(arbre.nodes)).toContain(d.node);
    expect(ids(demoState.squads)).toContain(d.squad);
  });
});

describe('3. contraintes des unites', () => {
  it('etoiles <= maxStars de la rarete', () => {
    const max = new Map(rarities.map((r) => [r.id, r.maxStars]));
    for (const u of units) expect(u.stars).toBeLessThanOrEqual(max.get(u.rarity) ?? 0);
  });
});
