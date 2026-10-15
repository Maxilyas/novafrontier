import { describe, expect, it } from 'vitest';
import { createCombat } from '../../src/combat';
import { avecCommandant, combatDe, setupDe } from './helpers';

/** Entrees invalides : refusees avec une raison lisible (contracts/sim-package.md, FR-044). */

describe('createCombat refuse', () => {
  it.each([
    ['une graine negative', { ...setupDe(), seed: -1 }, /Graine/],
    ['une graine non entiere', { ...setupDe(), seed: 1.5 }, /Graine/],
    ['une graine sur plus de 32 bits', { ...setupDe(), seed: 4294967296 }, /Graine/],
    ['une planete inconnue', { ...setupDe(), planet: 'nulle-part' }, /Planete inconnue/],
    ['la base, sans vague', { ...setupDe(), planet: 'astrea-iv' }, /Aucune vague/],
    ['un placement vide', { ...setupDe(), placement: [] }, /Placement vide/],
    [
      'un placement invalide',
      { ...setupDe(), placement: [{ unit: 's3', slot: 0 }] },
      /Placement invalide/,
    ],
    [
      'une competence inexistante',
      { ...setupDe(), commands: [{ tick: 1, skill: 9 }] },
      /competence 9 inconnue/,
    ],
    [
      'une competence ciblee sans cible',
      { ...setupDe(), commands: [{ tick: 1, skill: 0 }] },
      /cible "point" attendue/,
    ],
    [
      'une cible pour une competence qui n en attend pas',
      { ...setupDe(), commands: [{ tick: 1, skill: 1, target: { kind: 'unit', id: 1 } }] },
      /aucune cible attendue/,
    ],
    [
      'des coordonnees non entieres',
      { ...setupDe(), commands: [{ tick: 1, skill: 0, target: { kind: 'point', x: 1.5, y: 0 } }] },
      /entiers attendus/,
    ],
    ['une commande au pas 0', { ...setupDe(), commands: [{ tick: 0, skill: 1 }] }, /pas entier/],
    [
      'des pas decroissants',
      {
        ...setupDe(),
        commands: [
          { tick: 5, skill: 1 },
          { tick: 4, skill: 3 },
        ],
      },
      /pas entier >= 5/,
    ],
  ] as const)('%s', (_nom, setup, message) => {
    expect(() => createCombat(setup)).toThrow(message);
  });

  it('une escouade sans commandant ne peut porter aucune commande', () => {
    expect(() =>
      createCombat({
        ...setupDe({ squad: avecCommandant(null) }),
        commands: [{ tick: 1, skill: 0 }],
      }),
    ).toThrow(/inconnue/);
  });
});

describe('issue', () => {
  it('ajoute une commande future au journal', () => {
    const c = combatDe();
    c.step();
    c.issue({ tick: 2, skill: 1 });
    expect(c.setup.commands).toEqual([{ tick: 2, skill: 1 }]);
    c.step();
    expect(c.state.defenseBuff).not.toBeNull();
  });

  it('refuse un pas deja calcule', () => {
    const c = combatDe();
    c.step();
    c.step();
    expect(() => c.issue({ tick: 2, skill: 1 })).toThrow(/pas entier >= 3/);
  });
});
