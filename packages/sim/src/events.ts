import type { ActiveWeaponId, Threat } from '@nova/data';
import type { Fixed } from './fixed';
import type { EndReason, Outcome, Target, Tick } from './types';

/**
 * Evenements d'un pas (plan.md §6, data-model.md §3.6). La scene et le journal s'en servent ; ils
 * n'entrent pas dans l'empreinte, car ils se deduisent de l'etat et des entrees.
 */

export interface WaveEvent {
  readonly type: 'wave';
  readonly tick: Tick;
  readonly index: number;
  readonly boss: boolean;
  readonly composition: string;
}

export interface SpawnEvent {
  readonly type: 'spawn';
  readonly tick: Tick;
  readonly id: number;
  readonly threat: Threat;
  readonly weapon: ActiveWeaponId;
  readonly x: Fixed;
  readonly y: Fixed;
}

/** Tir instantane ; `to` vaut 0 pour la relique. */
export interface ShotEvent {
  readonly type: 'shot';
  readonly tick: Tick;
  readonly from: number;
  readonly to: number;
  readonly weapon: ActiveWeaponId;
  readonly missed: boolean;
}

export interface HitEvent {
  readonly type: 'hit';
  readonly tick: Tick;
  readonly target: number;
  readonly damage: Fixed;
  /** Multiplicateur de la matrice d'armement applique (16.16). */
  readonly multiplier: Fixed;
}

export interface DeathEvent {
  readonly type: 'death';
  readonly tick: Tick;
  readonly id: number;
  readonly side: 'unit' | 'enemy';
  readonly boss: boolean;
}

export type SkillFailure = 'spent' | 'no-points' | 'no-target';

export interface SkillEvent {
  readonly type: 'skill';
  readonly tick: Tick;
  /** Rang de la competence dans la barre d'actions. */
  readonly skill: number;
  readonly applied: boolean;
  readonly failure?: SkillFailure;
  readonly target?: Target;
  /** Point vise pour la scene (frappes, soins de zone, charge). */
  readonly at?: { readonly x: Fixed; readonly y: Fixed };
  /** Pillage obtenu : la vague a ete nettoyee a temps. */
  readonly bonus?: 'loot';
}

export interface ObjectiveEvent {
  readonly type: 'objective';
  readonly tick: Tick;
  readonly damage: Fixed;
  readonly hp: Fixed;
}

export interface EndEvent {
  readonly type: 'end';
  readonly tick: Tick;
  readonly outcome: Exclude<Outcome, 'running'>;
  readonly reason: EndReason;
}

export type SimEvent =
  | WaveEvent
  | SpawnEvent
  | ShotEvent
  | HitEvent
  | DeathEvent
  | SkillEvent
  | ObjectiveEvent
  | EndEvent;

export type SimEventType = SimEvent['type'];
