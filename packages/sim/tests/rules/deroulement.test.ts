import { enemyArchetypes } from '@nova/data';
import { describe, expect, it } from 'vitest';
import { fromFixed, toFixed } from '../../src/fixed';
import { tuning } from '../../src/tuning';
import { avancer, combatDe, de, escouade, etat, jusquAuBout } from './helpers';

/** Deroulement du combat (FR-001 a FR-011, research R5 et R6). */

const distanceAplatie = (x: number, y: number, rx: number, ry: number) =>
  Math.hypot(fromFixed(x - rx), fromFixed(y - ry) / 0.72);

describe('vagues', () => {
  it('la premiere apparait au pas 0, avec ses evenements', () => {
    const c = combatDe();
    expect(c.state.tick).toBe(0);
    expect(c.state.spawned).toBe(1);
    expect(c.state.enemies).toHaveLength(enemyArchetypes.l.count);
    expect(c.state.nextWaveIn).toBe(240);
    expect(de(c.initialEvents, 'wave')).toHaveLength(1);
    expect(de(c.initialEvents, 'spawn')).toHaveLength(12);
  });

  it('la suivante apparait 240 pas plus tard, ennemis restants ou non', () => {
    const c = combatDe();
    avancer(c, 239);
    expect(c.state.spawned).toBe(1);
    const evenements = avancer(c, 1);
    expect(c.state.spawned).toBe(2);
    expect(de(evenements, 'wave')[0]).toMatchObject({ index: 2, boss: false });
    expect(c.state.enemies.filter((e) => e.wave === 2)).toHaveLength(enemyArchetypes.m.count);
  });

  it('la derniere est le boss, puis le minuteur reste a 0', () => {
    const c = combatDe({ seed: 3 });
    const evenements = avancer(c, 5 * 240);
    expect(de(evenements, 'wave').at(-1)).toMatchObject({ index: 6, boss: true });
    expect(c.state.nextWaveIn).toBe(0);
  });
});

describe('apparition', () => {
  it('a 520-660 de la relique en 360 degres, aplatie verticalement', () => {
    const c = combatDe({ formation: 'ring' });
    for (const e of c.state.enemies) {
      const d = distanceAplatie(e.x, e.y, c.state.relic.x, c.state.relic.y);
      expect(d).toBeGreaterThan(519);
      expect(d).toBeLessThan(661);
    }
  });

  it('du cote ouest seulement en arc', () => {
    const c = combatDe({ formation: 'arc' });
    for (const e of c.state.enemies) expect(e.x).toBeLessThan(c.state.relic.x - toFixed(370));
  });

  it('directions et distances tirees de la graine', () => {
    const positions = (seed: number) => combatDe({ seed }).state.enemies.map((e) => [e.x, e.y]);
    expect(positions(5)).toEqual(positions(5));
    expect(positions(5)).not.toEqual(positions(6));
  });
});

describe('ennemis', () => {
  it('avancent vers l unite vivante la plus proche, de leur vitesse par pas', () => {
    const c = combatDe();
    const e = c.state.enemies[0];
    if (!e) throw new Error('aucun ennemi');
    const plusProche = () =>
      Math.min(...c.state.units.map((u) => Math.hypot(fromFixed(u.x - e.x), fromFixed(u.y - e.y))));
    const avant = plusProche();
    avancer(c, 1);
    expect(avant - plusProche()).toBeCloseTo(fromFixed(tuning.archetypes.l.speed), 1);
  });

  it('tirent au plus toutes les 14 pas sur une unite', () => {
    const evenements = jusquAuBout(combatDe({ seed: 2 }));
    const parTireur = new Map<number, number[]>();
    for (const s of de(evenements, 'shot')) {
      if (s.to === 0 || s.from > 5)
        parTireur.set(s.from, [...(parTireur.get(s.from) ?? []), s.tick]);
    }
    const ecarts = [...parTireur.entries()]
      .filter(([id]) => id > 5)
      .flatMap(([, ticks]) => ticks.slice(1).map((t, i) => t - (ticks[i] ?? 0)));
    expect(ecarts.length).toBeGreaterThan(0);
    expect(Math.min(...ecarts)).toBeGreaterThanOrEqual(14);
    expect(ecarts).toContain(14);
  });

  it('frappent la relique a 70 au plus, pour la moitie de leur attaque, toutes les 16 pas', () => {
    const c = combatDe({ squad: escouade('bravo'), theatre: 'orbital' });
    const evenements = jusquAuBout(c);
    const frappes = de(evenements, 'objective');
    expect(frappes.length).toBeGreaterThan(0);
    const attendues = new Set(
      Object.values(tuning.archetypes).map((a) => Math.trunc((a.attack * 32768) / 65536)),
    );
    for (const f of frappes) expect(attendues.has(f.damage)).toBe(true);
    const parTireur = new Map<number, number[]>();
    for (const s of de(evenements, 'shot').filter((x) => x.to === 0)) {
      parTireur.set(s.from, [...(parTireur.get(s.from) ?? []), s.tick]);
    }
    for (const ticks of parTireur.values()) {
      for (let i = 1; i < ticks.length; i += 1) {
        expect((ticks[i] ?? 0) - (ticks[i - 1] ?? 0)).toBeGreaterThanOrEqual(14);
      }
    }
    expect(c.result()).toMatchObject({ outcome: 'defeat', reason: 'relic' });
  });

  it('sans unite vivante, s arretent a 70 de la relique', () => {
    const c = combatDe();
    for (const u of etat(c).units) u.hp = 0;
    avancer(c, 220);
    for (const e of c.state.enemies) {
      const d = Math.hypot(fromFixed(e.x - c.state.relic.x), fromFixed(e.y - c.state.relic.y));
      expect(d).toBeLessThanOrEqual(70.5);
    }
  });

  it('immobilises, ne bougent pas', () => {
    const c = combatDe();
    for (const e of etat(c).enemies) e.frozen = 10;
    const avant = c.state.enemies.map((e) => [e.x, e.y]);
    avancer(c, 10);
    expect(c.state.enemies.map((e) => [e.x, e.y])).toEqual(avant);
    avancer(c, 1);
    expect(c.state.enemies.map((e) => [e.x, e.y])).not.toEqual(avant);
  });
});

describe('unites du joueur', () => {
  it('ne bougent pas et tirent au plus toutes les 11 pas', () => {
    const c = combatDe({ seed: 4 });
    const positions = c.state.units.map((u) => [u.x, u.y]);
    const evenements = jusquAuBout(c);
    expect(c.state.units.map((u) => [u.x, u.y])).toEqual(positions);
    const ids = new Set(c.state.units.map((u) => u.id));
    const parTireur = new Map<number, number[]>();
    for (const s of de(evenements, 'shot').filter((x) => ids.has(x.from))) {
      parTireur.set(s.from, [...(parTireur.get(s.from) ?? []), s.tick]);
    }
    const ecarts = [...parTireur.values()].flatMap((t) =>
      t.slice(1).map((v, i) => v - (t[i] ?? 0)),
    );
    expect(Math.min(...ecarts)).toBeGreaterThanOrEqual(11);
    expect(ecarts).toContain(11);
  });
});

describe('degats', () => {
  it('suivent ATQ x matrice x (1 - DEF / (DEF + 130)), minimum 1', () => {
    const c = combatDe({ seed: 7 });
    const ennemis = new Map<number, { defense: number }>();
    const unites = new Map(c.state.units.map((u) => [u.id, u]));
    let verifies = 0;
    while (c.result() === null && verifies < 200) {
      for (const e of c.state.enemies) ennemis.set(e.id, e);
      const evenements = c.step();
      for (let i = 0; i < evenements.length; i += 1) {
        const tir = evenements[i];
        const coup = evenements[i + 1];
        if (tir?.type !== 'shot' || coup?.type !== 'hit' || !unites.has(tir.from)) continue;
        const tireur = unites.get(tir.from);
        const cible = ennemis.get(coup.target);
        if (!tireur || !cible) continue;
        const atq = fromFixed(tireur.attack);
        const def = fromFixed(cible.defense);
        const m = fromFixed(coup.multiplier);
        const attendu = Math.max(1, atq * m * (1 - def / (def + 130)));
        expect(Math.abs(fromFixed(coup.damage) - attendu)).toBeLessThan(0.001);
        verifies += 1;
      }
    }
    expect(verifies).toBeGreaterThan(20);
  });
});

describe('destructions et fin', () => {
  it('un ennemi detruit est retire ; une unite detruite reste a PV 0 et ne tire plus', () => {
    const c = combatDe({ squad: escouade('bravo'), theatre: 'orbital' });
    const evenements = jusquAuBout(c);
    const morts = de(evenements, 'death');
    expect(morts.filter((m) => m.side === 'enemy').length).toBeGreaterThan(0);
    for (const m of morts.filter((x) => x.side === 'enemy')) {
      expect(c.state.enemies.some((e) => e.id === m.id)).toBe(false);
    }
    for (const m of morts.filter((x) => x.side === 'unit')) {
      expect(c.state.units.find((u) => u.id === m.id)?.hp).toBe(0);
      const tirsApres = de(evenements, 'shot').filter((s) => s.from === m.id && s.tick > m.tick);
      expect(tirsApres).toEqual([]);
    }
  });

  it('victoire quand toutes les vagues sont apparues et detruites', () => {
    const c = combatDe({ seed: 1, theatre: 'sol', formation: 'ring' });
    jusquAuBout(c);
    expect(c.result()).toMatchObject({ outcome: 'victory', reason: 'cleared', wavesSpawned: 6 });
    expect(c.state.enemies).toEqual([]);
  });

  it('la chute de la relique l emporte sur la victoire au meme pas', () => {
    const c = combatDe();
    const s = etat(c);
    avancer(c, 5 * 240);
    s.enemies = [];
    s.relic.hp = 0;
    const evenements = c.step();
    expect(de(evenements, 'end')[0]).toMatchObject({ outcome: 'defeat', reason: 'relic' });
  });

  it('defaite a la duree maximale', () => {
    const c = combatDe();
    etat(c).tick = tuning.maxTicks - 1;
    const evenements = c.step();
    expect(c.state.tick).toBe(12000);
    expect(de(evenements, 'end')[0]).toMatchObject({ outcome: 'defeat', reason: 'timeout' });
  });

  it('apres la fin, step ne fait plus rien', () => {
    const c = combatDe({ squad: escouade('bravo'), theatre: 'orbital' });
    jusquAuBout(c);
    const empreinte = c.fingerprint();
    expect(c.step()).toEqual([]);
    expect(c.fingerprint()).toBe(empreinte);
  });
});
