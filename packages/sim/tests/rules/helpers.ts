import { demoState, type Formation, type Squad, type SquadId, type Theatre } from '@nova/data';
import { type Combat, createCombat } from '../../src/combat';
import type { SimEvent } from '../../src/events';
import { autoPlacement } from '../../src/formation';
import type { CombatSetup, CombatState, Command } from '../../src/types';

/** Outils communs aux tests de regles : escouades, combats, etat modifiable en boite blanche. */

export const escouade = (id: SquadId): Squad => {
  const s = demoState.squads.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};

/** Escouade Alpha (vaisseaux et mecas) commandee par `commander` : sert aux commandants hors demonstration. */
export const avecCommandant = (commander: string | null): Squad => ({
  ...escouade('alpha'),
  commander,
});

export interface Options {
  squad?: Squad;
  theatre?: Theatre;
  formation?: Formation;
  seed?: number;
  commands?: readonly Command[];
}

export function setupDe(o: Options = {}): CombatSetup {
  const squad = o.squad ?? escouade('alpha');
  const theatre = o.theatre ?? 'sol';
  const formation = o.formation ?? 'ring';
  return {
    seed: o.seed ?? 1,
    squad,
    theatre,
    formation,
    placement: autoPlacement(squad, theatre, formation),
    planet: 'gemenon',
    commands: o.commands ?? [],
  };
}

export const combatDe = (o: Options = {}): Combat => createCombat(setupDe(o));

/** Etat modifiable : tests en boite blanche seulement. */
export const etat = (c: Combat): CombatState => c.state as CombatState;

/** Avance de `n` pas et rend tous les evenements. */
export function avancer(c: Combat, n: number): SimEvent[] {
  const tous: SimEvent[] = [];
  for (let i = 0; i < n; i += 1) tous.push(...c.step());
  return tous;
}

/** Avance jusqu'a la fin et rend tous les evenements. */
export function jusquAuBout(c: Combat): SimEvent[] {
  const tous: SimEvent[] = [];
  while (c.result() === null) tous.push(...c.step());
  return tous;
}

export const de = <T extends SimEvent['type']>(evenements: readonly SimEvent[], type: T) =>
  evenements.filter((e): e is Extract<SimEvent, { type: T }> => e.type === type);
