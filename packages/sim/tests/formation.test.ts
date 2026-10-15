import {
  type Combatant,
  combatTuning,
  demoState,
  derivedValues,
  type Formation,
  type Squad,
  type Theatre,
  unitById,
} from '@nova/data';
import { describe, expect, it } from 'vitest';
import { fromFixed } from '../src/fixed';
import { autoPlacement, engagedUnits, formationSlots, validatePlacement } from '../src/formation';

/**
 * Emplacements, placement automatique et validation (FR-037, FR-040, FR-044, SC-012, research
 * R18). Les positions de reference sont recalculees ici comme la maquette les calcule (buildSlots,
 * lignes 1960-1975 ; startCombat, ligne 2172), avec Math.cos et Math.sin, permis dans les tests.
 */

const escouade = (id: string): Squad => {
  const s = demoState.squads.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};

const FORMATIONS: readonly Formation[] = ['ring', 'arc'];
const THEATRES: readonly Theatre[] = ['orbital', 'sol'];

/** Positions de la maquette : plateau et arene. */
function maquette(formation: Formation) {
  const t = combatTuning;
  const obj = t.board.objective[formation];
  const relique = t.relicPosition[formation];
  const lignes = t.slots[formation];
  return (['front', 'back'] as const).flatMap((ligne) =>
    Array.from({ length: lignes[ligne].count }, (_, i) => {
      const a = lignes[ligne].startRad + i * lignes[ligne].stepRad;
      const bx = obj.x + Math.cos(a) * lignes[ligne].radius;
      const by = obj.y + Math.sin(a) * lignes[ligne].radius;
      return {
        bx,
        by,
        ax: relique.x + (bx - obj.x) * t.boardToArena.x,
        ay: relique.y + (by - obj.y) * t.boardToArena.y,
      };
    }),
  );
}

describe('emplacements', () => {
  it('360 degres : 8 en premiere ligne puis 8 en seconde, types alternes', () => {
    const slots = formationSlots('ring', 'sol');
    expect(slots).toHaveLength(16);
    expect(slots.map((s) => s.index)).toEqual([...Array(16).keys()]);
    expect(slots.slice(0, 8).every((s) => s.line === 'front')).toBe(true);
    expect(slots.slice(8).every((s) => s.line === 'back')).toBe(true);
    expect(slots.slice(0, 4).map((s) => s.kind)).toEqual(['ship', 'mech', 'ship', 'mech']);
    expect(slots[8]?.kind).toBe('ship');
  });

  it('arc : 7 en premiere ligne et 6 en seconde', () => {
    const slots = formationSlots('arc', 'sol');
    expect(slots.filter((s) => s.line === 'front')).toHaveLength(7);
    expect(slots.filter((s) => s.line === 'back')).toHaveLength(6);
    expect(slots.filter((s) => s.line === 'front' && s.kind === 'ship')).toHaveLength(4);
  });

  it('en combat spatial, seuls les emplacements de vaisseaux, rangs conserves', () => {
    for (const f of FORMATIONS) {
      const spatial = formationSlots(f, 'orbital');
      expect(spatial.every((s) => s.kind === 'ship')).toBe(true);
      expect(spatial.map((s) => s.index)).toEqual(
        formationSlots(f, 'sol')
          .filter((s) => s.kind === 'ship')
          .map((s) => s.index),
      );
    }
  });

  it.each(FORMATIONS)('%s : positions de la maquette a 1,5 unite pres', (formation) => {
    const reference = maquette(formation);
    for (const slot of formationSlots(formation, 'sol')) {
      const r = reference[slot.index];
      if (!r) throw new Error(`emplacement ${slot.index}`);
      expect(Math.abs(fromFixed(slot.board.x) - r.bx)).toBeLessThan(1.5);
      expect(Math.abs(fromFixed(slot.board.y) - r.by)).toBeLessThan(1.5);
      expect(Math.abs(fromFixed(slot.arena.x) - r.ax)).toBeLessThan(1.5);
      expect(Math.abs(fromFixed(slot.arena.y) - r.ay)).toBeLessThan(1.5);
    }
  });
});

describe('unites engagees', () => {
  it('vaisseaux seuls en spatial, puis les mecas en terrestre', () => {
    expect(engagedUnits(escouade('alpha'), 'orbital').map((u) => u.id)).toEqual(['s1', 's2', 's4']);
    expect(engagedUnits(escouade('alpha'), 'sol').map((u) => u.id)).toEqual([
      's1',
      's2',
      's4',
      'm1',
      'm2',
    ]);
    expect(engagedUnits(escouade('charlie'), 'sol')).toEqual([]);
  });
});

describe('placement automatique (SC-012)', () => {
  for (const id of ['alpha', 'bravo', 'charlie'] as const) {
    for (const theatre of THEATRES) {
      for (const formation of FORMATIONS) {
        it(`${id}, ${theatre}, ${formation}`, () => {
          const squad = escouade(id);
          const placement = autoPlacement(squad, theatre, formation);
          expect(validatePlacement(squad, theatre, formation, placement)).toEqual({ ok: true });
          const slots = formationSlots(formation, theatre);
          const lignes = Object.fromEntries(
            placement.map((p) => [p.unit, slots.find((s) => s.index === p.slot)?.line]),
          );
          const attendu = Object.fromEntries(
            derivedValues.deployment[id][theatre].units.map((u) => [u.unit, u.line]),
          );
          expect(lignes).toEqual(attendu);
          for (const p of placement) {
            const unite = unitById(p.unit) as Combatant;
            expect(slots.find((s) => s.index === p.slot)?.kind).toBe(unite.family);
          }
        });
      }
    }
  }

  it('range la force engagee dans l ordre de la maquette', () => {
    const ordre = (theatre: Theatre) =>
      [...autoPlacement(escouade('alpha'), theatre, 'ring')]
        .sort((a, b) => a.slot - b.slot)
        .map((p) => p.unit);
    expect(ordre('orbital')).toEqual(
      derivedValues.combatStart.alpha.orbital.units.map((u) => u.unit),
    );
    expect(ordre('sol')).toEqual(derivedValues.combatStart.alpha.sol.units.map((u) => u.unit));
  });
});

describe('validation du placement (FR-044)', () => {
  const alpha = escouade('alpha');
  const refuse = (theatre: Theatre, placement: { unit: string; slot: number }[]) =>
    validatePlacement(alpha, theatre, 'ring', placement).ok;

  it('accepte un placement manuel partiel', () => {
    expect(refuse('sol', [{ unit: 'm1', slot: 9 }])).toBe(true);
  });

  it.each([
    ['unite hors escouade', 'sol', [{ unit: 's3', slot: 0 }]],
    ['meca en combat spatial', 'orbital', [{ unit: 'm1', slot: 1 }]],
    [
      'unite placee deux fois',
      'sol',
      [
        { unit: 's1', slot: 0 },
        { unit: 's1', slot: 2 },
      ],
    ],
    ['emplacement inexistant', 'sol', [{ unit: 's1', slot: 99 }]],
    ['emplacement de l autre type', 'sol', [{ unit: 's1', slot: 1 }]],
    [
      'emplacement occupe deux fois',
      'sol',
      [
        { unit: 's1', slot: 0 },
        { unit: 's2', slot: 0 },
      ],
    ],
  ] as const)('refuse : %s', (_nom, theatre, placement) => {
    expect(refuse(theatre, [...placement])).toBe(false);
  });
});
