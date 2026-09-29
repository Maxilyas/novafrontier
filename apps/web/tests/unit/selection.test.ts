import { demoState, researchTrees, unitById } from '@nova/data';
import { describe, expect, it } from 'vitest';
import * as regles from '../../src/state/selection-rules';

const depart = () => regles.initialSelection(demoState);
const unite = (id: string) => {
  const u = unitById(id);
  if (!u) throw new Error(`unite ${id} absente`);
  return u;
};

describe('etat de consultation (data-model.md §5)', () => {
  it("part des valeurs par defaut de l'etat de demonstration", () => {
    const s = depart();
    expect(s.squad).toBe('alpha');
    expect(s.rosterFilter).toBe('cmd');
    expect(s.theatre).toBe('orbital');
    expect(s.atlas).toEqual({ unit: 's1', tier: 2, weapon: 'las' });
    expect(s.formation.alpha).toBe('ring');
    expect(s.formation.bravo).toBe('arc');
  });

  it('choisir une escouade verrouillee ne change rien', () => {
    const s = depart();
    expect(regles.selectSquad(s, 'delta', demoState)).toBe(s);
    expect(regles.selectSquad(s, 'bravo', demoState).squad).toBe('bravo');
  });

  it('un emplacement vide fixe le filtre a sa famille', () => {
    expect(regles.pickEmptySlot(depart(), 'mech').rosterFilter).toBe('mech');
  });

  it("ouvrir l'Atlas sur un combattant aligne palier et arme", () => {
    expect(regles.openAtlas(depart(), unite('s2')).atlas).toEqual({
      unit: 's2',
      tier: 2,
      weapon: 'nuc',
    });
  });

  it("ouvrir l'Atlas sur un commandant remet le palier a 1 et garde l'arme", () => {
    expect(regles.openAtlas(depart(), unite('c2')).atlas).toEqual({
      unit: 'c2',
      tier: 1,
      weapon: 'las',
    });
  });

  it('changer d arbre selectionne son premier noeud', () => {
    const flotte = researchTrees.find((t) => t.id === 'flotte');
    if (!flotte) throw new Error('arbre flotte absent');
    expect(regles.selectTree(depart(), flotte)).toMatchObject({ tree: 'flotte', node: 'f1' });
  });

  it('la formation est propre a chaque escouade', () => {
    const s = regles.setFormation(depart(), 'alpha', 'arc');
    expect(s.formation.alpha).toBe('arc');
    expect(s.formation.charlie).toBe('ring');
  });
});
