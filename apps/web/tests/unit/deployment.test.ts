import { demoState, type Squad } from '@nova/data';
import { autoPlacement, formationSlots, validatePlacement } from '@nova/sim';
import { describe, expect, it } from 'vitest';
import {
  type Combo,
  canPlace,
  comboKey,
  drop,
  initialPlacement,
  occupant,
  placeOn,
  removeAt,
  removeUnit,
} from '../../src/state/deployment-rules';

/** Regles du plateau de deploiement (FR-039 a FR-041, FR-044, cas limites de la spec). */

const escouade = (id: string): Squad => {
  const s = demoState.squads.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};

const sol: Combo = { squad: escouade('alpha'), theatre: 'sol', formation: 'ring' };
const slots = formationSlots('ring', 'sol');
const libre = (kind: string, line: string, sauf: number[] = []) => {
  const s = slots.find((x) => x.kind === kind && x.line === line && !sauf.includes(x.index));
  if (!s) throw new Error(`${kind}/${line}`);
  return s.index;
};
const valide = (p: ReturnType<typeof initialPlacement>) =>
  validatePlacement(sol.squad, sol.theatre, sol.formation, p).ok;

describe('placement initial', () => {
  it('automatique si l interrupteur est actif, vide sinon', () => {
    expect(initialPlacement(sol, true)).toEqual(autoPlacement(sol.squad, 'sol', 'ring'));
    expect(initialPlacement(sol, false)).toEqual([]);
  });

  it('memorise par escouade, theatre et formation', () => {
    expect(comboKey(sol)).toBe('alpha/sol/ring');
    expect(comboKey({ ...sol, formation: 'arc' })).toBe('alpha/sol/arc');
  });
});

describe('poser et retirer', () => {
  it('pose une unite sur un emplacement libre de son type', () => {
    const rang = libre('mech', 'back');
    const p = placeOn(sol, [], 'm1', rang);
    expect(p).toEqual([{ unit: 'm1', slot: rang }]);
  });

  it('refuse un emplacement de l autre type ou occupe', () => {
    expect(placeOn(sol, [], 's1', libre('mech', 'front'))).toBeNull();
    const rang = libre('ship', 'front');
    const p = placeOn(sol, [], 's1', rang) ?? [];
    expect(canPlace(sol, p, 's2', rang)).toBe(false);
    expect(placeOn(sol, p, 's2', rang)).toBeNull();
  });

  it('une unite deplacee quitte son ancien emplacement', () => {
    const a = libre('ship', 'front');
    const b = libre('ship', 'back');
    const p = placeOn(sol, placeOn(sol, [], 's1', a) ?? [], 's1', b) ?? [];
    expect(p).toEqual([{ unit: 's1', slot: b }]);
  });

  it('retire par l unite ou par l emplacement', () => {
    const p = autoPlacement(sol.squad, 'sol', 'ring');
    const premier = p[0];
    if (!premier) throw new Error('vide');
    expect(removeUnit(p, premier.unit)).toHaveLength(p.length - 1);
    expect(occupant(removeAt(p, premier.slot), premier.slot)).toBeUndefined();
  });
});

describe('glisser-deposer', () => {
  it('sur un emplacement libre de son type : pose', () => {
    const rang = libre('ship', 'back');
    expect(drop(sol, [], 's2', rang)).toEqual([{ unit: 's2', slot: rang }]);
  });

  it('hors emplacement ou sur l autre type : rien ne change', () => {
    const p = placeOn(sol, [], 's2', libre('ship', 'back')) ?? [];
    expect(drop(sol, p, 's2', null)).toBe(p);
    expect(drop(sol, p, 's2', libre('mech', 'back'))).toBe(p);
  });

  it('sur un emplacement occupe de son type : echange les places', () => {
    const a = libre('ship', 'front');
    const b = libre('ship', 'back');
    let p = placeOn(sol, [], 's1', a) ?? [];
    p = placeOn(sol, p, 's2', b) ?? [];
    const apres = drop(sol, p, 's1', b);
    expect(occupant(apres, b)).toBe('s1');
    expect(occupant(apres, a)).toBe('s2');
    expect(valide(apres)).toBe(true);
  });

  it('depuis la liste sur un emplacement occupe : l occupant retourne dans la liste', () => {
    const a = libre('ship', 'front');
    const p = placeOn(sol, [], 's1', a) ?? [];
    const apres = drop(sol, p, 's4', a);
    expect(apres).toEqual([{ unit: 's4', slot: a }]);
  });
});
