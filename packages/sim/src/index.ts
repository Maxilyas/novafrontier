import type { ActiveWeaponId, Formation, Squad, Theatre } from '@nova/data';

/**
 * @nova/sim : types seulement en phase P0 de la feuille de route (contracts/sim-package.md).
 * Ils sont provisoires ; la phase P1 les precisera en portant les regles (plan.md §6).
 */

/** Pas fixe de 50 ms, soit 20 ticks par seconde (plan.md §6). */
export type Tick = number;

/** Nombre en virgule fixe 16.16 (plan.md §6). */
export type Fixed = number & { readonly __unit: 'fixed16.16' };

/** Angle en 1/1024 de tour (plan.md §6). */
export type Angle = number & { readonly __unit: 'turn/1024' };

export interface WaveSpec {
  index: number;
  boss: boolean;
  weapon: ActiveWeaponId;
}

export interface SimCommand {
  tick: Tick;
  /** Precise en phase P1 de la feuille de route. */
  action: string;
}

export interface SimInput {
  seed: number;
  squad: Squad;
  formation: Formation;
  theatre: Theatre;
  waves: readonly WaveSpec[];
  commands: readonly SimCommand[];
}

export type SimEventType =
  | 'wave'
  | 'spawn'
  | 'shot'
  | 'hit'
  | 'death'
  | 'skill'
  | 'objective'
  | 'end';

export interface SimEvent {
  type: SimEventType;
  tick: Tick;
}

export interface SimSnapshot {
  tick: Tick;
  objective: { hp: number; max: number };
}
