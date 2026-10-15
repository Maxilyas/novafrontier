import { describe, expect, it } from 'vitest';
import { readTeamParams } from '../../src/state/team-params';

describe('parametres de l equipe', () => {
  it('sans parametre, aucun outil', () => {
    expect(readTeamParams('')).toEqual({ seed: undefined, diag: false, charge: false });
  });

  it('lit la graine, le diagnostic et le scenario de charge', () => {
    expect(readTeamParams('?graine=7&diag=1&charge=1')).toEqual({
      seed: 7,
      diag: true,
      charge: true,
    });
    expect(readTeamParams('?graine=4294967295').seed).toBe(4294967295);
  });

  it.each(['-1', '1.5', 'abc', '', '4294967296', '99999999999'])(
    'ignore la graine invalide %s',
    (valeur) => {
      expect(readTeamParams(`?graine=${valeur}`).seed).toBeUndefined();
    },
  );

  it('ignore les autres valeurs des interrupteurs', () => {
    expect(readTeamParams('?diag=oui&charge=true')).toMatchObject({ diag: false, charge: false });
  });
});
