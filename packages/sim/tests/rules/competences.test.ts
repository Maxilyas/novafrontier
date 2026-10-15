import { describe, expect, it } from 'vitest';
import { FIXED_ONE, fmul, fromFixed, toFixed } from '../../src/fixed';
import type { Command } from '../../src/types';
import { avancer, avecCommandant, combatDe, de, escouade, etat, type Options } from './helpers';

/**
 * Competences du commandant (FR-012 a FR-015, table FR-014, FR-014b). Vell commande Alpha, Tallow
 * Bravo ; Braak, Halven et Andar commandent ici une escouade construite pour le test.
 */

const VELL = 'c1';
const TALLOW = 'c2';
const BRAAK = 'c3';
const HALVEN = 'c4';
const ANDAR = 'c5';

const avec = (commander: string, commands: readonly Command[], o: Options = {}) =>
  combatDe({ squad: avecCommandant(commander), commands, ...o });

const competence = (evenements: ReturnType<typeof avancer>) => de(evenements, 'skill')[0];

describe('points d action et barre', () => {
  it('points de la rarete : 5 pour Vell (divin), 3 pour Tallow et Braak, 2 pour Halven et Andar', () => {
    expect(avec(VELL, []).state.actionPoints).toBe(5);
    expect(avec(TALLOW, []).state.actionPoints).toBe(3);
    expect(avec(BRAAK, []).state.actionPoints).toBe(3);
    expect(avec(HALVEN, []).state.actionPoints).toBe(2);
    expect(avec(ANDAR, []).bar).toHaveLength(2);
  });

  it('sans commandant, aucun point ni competence', () => {
    const c = combatDe({ squad: avecCommandant(null) });
    expect(c.state.actionPoints).toBe(0);
    expect(c.bar).toEqual([]);
  });

  it('une competence appliquee coute un point et devient depensee', () => {
    const c = avec(VELL, [{ tick: 1, skill: 1 }]);
    const e = competence(avancer(c, 1));
    expect(e).toMatchObject({ applied: true, skill: 1 });
    expect(c.state.actionPoints).toBe(4);
    expect(c.state.spentSkills).toBe(0b10);
  });

  it('une competence depensee ne s applique plus', () => {
    const c = avec(VELL, [
      { tick: 1, skill: 1 },
      { tick: 2, skill: 1 },
    ]);
    avancer(c, 1);
    expect(competence(avancer(c, 1))).toMatchObject({ applied: false, failure: 'spent' });
    expect(c.state.actionPoints).toBe(4);
  });

  it('sans point restant, rien ne s applique', () => {
    const c = avec(VELL, [{ tick: 1, skill: 1 }]);
    etat(c).actionPoints = 0;
    expect(competence(avancer(c, 1))).toMatchObject({ applied: false, failure: 'no-points' });
    expect(c.state.defenseBuff).toBeNull();
  });
});

describe('Korax Vell', () => {
  it('Frappe orbitale : 420 a chaque ennemi a moins de 150 du point designe', () => {
    const repere = combatDe({ squad: avecCommandant(VELL) }).state.enemies[0];
    if (!repere) throw new Error('aucun ennemi');
    const c = avec(VELL, [
      { tick: 1, skill: 0, target: { kind: 'point', x: repere.x, y: repere.y } },
    ]);
    const proches = c.state.enemies
      .filter((e) => Math.hypot(fromFixed(e.x - repere.x), fromFixed(e.y - repere.y)) < 149)
      .map((e) => e.id);
    const loin = c.state.enemies
      .filter((e) => Math.hypot(fromFixed(e.x - repere.x), fromFixed(e.y - repere.y)) > 151)
      .map((e) => e.id);
    const evenements = avancer(c, 1);
    expect(competence(evenements)).toMatchObject({ applied: true });
    const tues = de(evenements, 'death').map((m) => m.id);
    expect(tues).toEqual(expect.arrayContaining(proches));
    for (const id of loin) expect(tues).not.toContain(id);
  });

  it('Frappe orbitale hors de l arene : sans cible valide, rien n est consomme', () => {
    const c = avec(VELL, [{ tick: 1, skill: 0, target: { kind: 'point', x: -FIXED_ONE, y: 0 } }]);
    expect(competence(avancer(c, 1))).toMatchObject({ applied: false, failure: 'no-target' });
    expect(c.state.actionPoints).toBe(5);
    expect(c.state.spentSkills).toBe(0);
  });

  it('Bouclier de flotte : defense x1,7 pendant 140 pas, renouvelable', () => {
    const c = avec(VELL, [{ tick: 1, skill: 1 }]);
    avancer(c, 1);
    expect(c.state.defenseBuff).toEqual({ value: toFixed(1.7), ticks: 139 });
    avancer(c, 139);
    expect(c.state.defenseBuff).toBeNull();
  });

  it('Reparation : +25 % des PV max a l unite designee, sans depasser le maximum', () => {
    const c = avec(VELL, [{ tick: 1, skill: 2, target: { kind: 'unit', id: 1 } }]);
    const u = etat(c).units[0];
    if (!u) throw new Error('aucune unite');
    u.hp = Math.trunc(u.maxHp / 2);
    const avant = u.hp;
    avancer(c, 1);
    expect(u.hp).toBe(avant + fmul(u.maxHp, toFixed(0.25)));
    u.hp = u.maxHp - 1;
    expect(u.hp).toBeLessThanOrEqual(u.maxHp);
  });

  it('Reparation d une unite detruite : sans cible valide', () => {
    const c = avec(VELL, [{ tick: 1, skill: 2, target: { kind: 'unit', id: 1 } }]);
    const u = etat(c).units[0];
    if (u) u.hp = 0;
    expect(competence(avancer(c, 1))).toMatchObject({ applied: false, failure: 'no-target' });
  });

  it('Impulsion EM : seuls les ennemis de menace legere, 80 pas', () => {
    const c = avec(VELL, [{ tick: 240, skill: 3 }]);
    avancer(c, 240);
    const legers = c.state.enemies.filter((e) => e.threat === 'l');
    const moyens = c.state.enemies.filter((e) => e.threat === 'm');
    expect(legers.length).toBeGreaterThan(0);
    expect(moyens.length).toBeGreaterThan(0);
    for (const e of legers) expect(e.frozen).toBe(79);
    for (const e of moyens) expect(e.frozen).toBe(0);
  });

  it('Surcharge : attaque x1,5 de l unite designee jusqu a la vague suivante', () => {
    const c = avec(VELL, [{ tick: 1, skill: 4, target: { kind: 'unit', id: 2 } }]);
    avancer(c, 1);
    expect(c.state.units[1]?.attackBuff).toEqual({ value: toFixed(1.5), wave: 1 });
    expect(c.state.units[0]?.attackBuff).toBeNull();
    avancer(c, 239);
    expect(c.state.units[1]?.attackBuff).toBeNull();
  });
});

describe('Rhea Tallow', () => {
  const bravo = { squad: { ...escouade('bravo'), commander: TALLOW }, theatre: 'sol' } as const;

  it('Abordage eclair : 420 a l ennemi le plus proche de la relique', () => {
    const c = avec(TALLOW, [{ tick: 1, skill: 0 }], bravo);
    const r = c.state.relic;
    const cible = [...c.state.enemies].sort(
      (a, b) => Math.hypot(a.x - r.x, a.y - r.y) - Math.hypot(b.x - r.x, b.y - r.y) || a.id - b.id,
    )[0];
    const evenements = avancer(c, 1);
    expect(de(evenements, 'death').map((m) => m.id)).toContain(cible?.id);
  });

  it('Abordage eclair sans ennemi : sans cible valide', () => {
    const c = avec(TALLOW, [{ tick: 1, skill: 0 }], bravo);
    etat(c).enemies = [];
    expect(competence(avancer(c, 1))).toMatchObject({ applied: false, failure: 'no-target' });
  });

  it('Fumigene : des tirs ennemis manquent pendant 120 pas, plus aucun ensuite', () => {
    const c = avec(TALLOW, [{ tick: 120, skill: 1 }], bravo);
    avancer(c, 119);
    const pendant = de(avancer(c, 120), 'shot').filter((s) => s.from > 2);
    const apres = de(avancer(c, 200), 'shot').filter((s) => s.from > 2);
    expect(pendant.some((s) => s.missed)).toBe(true);
    expect(pendant.some((s) => !s.missed)).toBe(true);
    expect(apres.some((s) => s.missed)).toBe(false);
  });

  it('Pillage obtenu : la vague en cours detruite avant la suivante', () => {
    const c = avec(TALLOW, [{ tick: 1, skill: 2 }], bravo);
    avancer(c, 1);
    expect(c.state.pillage).toMatchObject({ wave: 1, status: 'pending' });
    for (const e of etat(c).enemies) e.hp = 0;
    const evenements = avancer(c, 1);
    expect(c.state.pillage?.status).toBe('won');
    expect(de(evenements, 'skill')).toEqual([expect.objectContaining({ bonus: 'loot' })]);
  });

  it('Pillage perdu : la vague suivante apparait avant', () => {
    const c = avec(TALLOW, [{ tick: 1, skill: 2 }], bravo);
    avancer(c, 240);
    expect(c.state.pillage?.status).toBe('lost');
  });
});

describe('Odin Braak', () => {
  it('Mur d acier : degats subis par la premiere ligne x0,5 pendant 140 pas', () => {
    const c = avec(BRAAK, [{ tick: 1, skill: 0 }]);
    avancer(c, 1);
    expect(c.state.frontDamageCut).toEqual({ value: toFixed(0.5), ticks: 139 });
  });

  it('Charge lourde : l unite de premiere ligne la plus solide frappe le groupe le plus proche', () => {
    const c = avec(BRAAK, [{ tick: 1, skill: 1 }]);
    const solide = [...c.state.units]
      .filter((u) => u.line === 'front')
      .sort((a, b) => b.defense - a.defense)[0];
    if (!solide) throw new Error('aucune unite');
    const proche = [...c.state.enemies].sort(
      (a, b) =>
        Math.hypot(a.x - solide.x, a.y - solide.y) - Math.hypot(b.x - solide.x, b.y - solide.y),
    )[0];
    const evenements = avancer(c, 1);
    expect(competence(evenements)).toMatchObject({
      applied: true,
      at: { x: proche?.x, y: proche?.y },
    });
    expect(de(evenements, 'death').map((m) => m.id)).toContain(proche?.id);
    expect(c.state.units.find((u) => u.id === solide.id)).toMatchObject({
      x: solide.x,
      y: solide.y,
    });
  });

  it('Ralliement : +10 % des PV max a chaque unite vivante', () => {
    const c = avec(BRAAK, [{ tick: 1, skill: 2 }]);
    for (const u of etat(c).units) u.hp = Math.trunc(u.maxHp / 2);
    const avant = c.state.units.map((u) => u.hp + fmul(u.maxHp, toFixed(0.1)));
    avancer(c, 1);
    expect(c.state.units.map((u) => u.hp)).toEqual(avant);
  });
});

describe('T. Halven', () => {
  it('Tir de soutien : 200 a l ennemi designe', () => {
    const c = avec(HALVEN, [{ tick: 1, skill: 0, target: { kind: 'enemy', id: 6 } }]);
    const e = etat(c).enemies.find((x) => x.id === 6);
    if (!e) throw new Error('ennemi 6');
    e.hp = toFixed(500);
    avancer(c, 1);
    expect(fromFixed(e.hp)).toBe(300);
  });

  it('Garde serree : defense x1,15 pendant 160 pas', () => {
    const c = avec(HALVEN, [{ tick: 1, skill: 1 }]);
    avancer(c, 1);
    expect(c.state.defenseBuff).toEqual({ value: toFixed(1.15), ticks: 159 });
  });
});

describe('P. Andar', () => {
  it('Reparation de zone : +12 % aux unites a moins de 150 du point designe', () => {
    const premiere = combatDe({ squad: avecCommandant(ANDAR) }).state.units[0];
    if (!premiere) throw new Error('aucune unite');
    const c = avec(ANDAR, [
      { tick: 1, skill: 0, target: { kind: 'point', x: premiere.x, y: premiere.y } },
    ]);
    for (const u of etat(c).units) u.hp = Math.trunc(u.maxHp / 2);
    const attendus = c.state.units.map((u) =>
      Math.hypot(fromFixed(u.x - premiere.x), fromFixed(u.y - premiere.y)) <= 150
        ? u.hp + fmul(u.maxHp, toFixed(0.12))
        : u.hp,
    );
    avancer(c, 1);
    expect(c.state.units.map((u) => u.hp)).toEqual(attendus);
  });

  it('Repli tactique : vers un emplacement libre de son type, qui donne sa ligne', () => {
    const c0 = avec(ANDAR, []);
    const vaisseau = c0.state.units.find((u) => u.kind === 'ship');
    const libre = c0.slots.find(
      (s) =>
        s.kind === 'ship' && s.line === 'back' && !c0.state.units.some((u) => u.slot === s.index),
    );
    if (!vaisseau || !libre) throw new Error('repere');
    const c = avec(ANDAR, [
      { tick: 1, skill: 1, target: { kind: 'unit-slot', id: vaisseau.id, slot: libre.index } },
    ]);
    avancer(c, 1);
    expect(c.state.units.find((u) => u.id === vaisseau.id)).toMatchObject({
      slot: libre.index,
      line: 'back',
      x: libre.arena.x,
      y: libre.arena.y,
    });
  });

  it.each([
    ['un emplacement de l autre type', (k: string) => k !== 'ship', false],
    ['un emplacement occupe', (k: string) => k === 'ship', true],
  ] as const)('Repli tactique vers %s : sans cible valide', (_nom, filtreType, occupe) => {
    const c0 = avec(ANDAR, []);
    const vaisseau = c0.state.units.find((u) => u.kind === 'ship');
    const slot = c0.slots.find(
      (s) =>
        filtreType(s.kind) &&
        c0.state.units.some((u) => u.slot === s.index && u.id !== vaisseau?.id) === occupe,
    );
    if (!vaisseau || !slot) throw new Error('repere');
    const c = avec(ANDAR, [
      { tick: 1, skill: 1, target: { kind: 'unit-slot', id: vaisseau.id, slot: slot.index } },
    ]);
    expect(competence(avancer(c, 1))).toMatchObject({ applied: false, failure: 'no-target' });
  });
});
