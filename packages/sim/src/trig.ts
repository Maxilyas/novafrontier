import type { Fixed } from './fixed';
import { QUARTER_SINE } from './trig-table';

/**
 * Trigonometrie sans fonction transcendante (plan.md §6, research R3) : angles entiers en 1/1024
 * de tour, sinus lu dans une table d'un quart de tour et deduit par symetrie.
 */

/** Angle en 1/1024 de tour. */
export type Angle = number;

export const FULL_TURN = 1024;

const quart = (i: number): Fixed => QUARTER_SINE[i] ?? 0;

/** Sinus en 16.16 d'un angle quelconque (negatif ou superieur a un tour). */
export function sin(angle: Angle): Fixed {
  const a = ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN;
  if (a <= 256) return quart(a);
  if (a <= 512) return quart(512 - a);
  if (a <= 768) return -quart(a - 512);
  return -quart(1024 - a);
}

export const cos = (angle: Angle): Fixed => sin(angle + 256);

/**
 * Angle le plus proche d'une valeur en radians des reglages de la maquette. Multiplication,
 * division et arrondi sont exacts et identiques sur tous les moteurs.
 */
export const radiansToAngle = (rad: number): Angle => Math.round((rad * 512) / Math.PI);
