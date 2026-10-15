import { demoState, type Formation, type SquadId, type Theatre } from '@nova/data';
import type { CombatSetup, Command, Placement } from '../../src/types';
import donnees from './combats.json' with { type: 'json' };

/**
 * Combats de reference (research R11, FR-023) : entrees, issue, dernier pas et empreinte finale
 * attendus. Le fichier est regenere par `pnpm --filter @nova/sim golden:update`, jamais par un test.
 * L'escouade est rangee par son identifiant ; `setupDe` la retrouve dans l'etat de demonstration.
 */
export interface GoldenCombat {
  readonly name: string;
  readonly setup: {
    readonly seed: number;
    readonly squad: string;
    readonly theatre: Theatre;
    readonly formation: Formation;
    readonly placement: Placement;
    readonly planet: string;
    readonly commands: readonly Command[];
  };
  readonly expected: {
    readonly outcome: 'victory' | 'defeat';
    readonly ticks: number;
    readonly fingerprint: string;
  };
}

export const goldenCombats = donnees as readonly GoldenCombat[];

export function setupDe(g: GoldenCombat): CombatSetup {
  const squad = demoState.squads.find((s) => s.id === (g.setup.squad as SquadId));
  if (!squad) throw new Error(`escouade inconnue : ${g.setup.squad}`);
  return { ...g.setup, squad };
}
