import type { Combat, Target } from '@nova/sim';
import type { Designation } from '../../../state/combat-runtime';

/**
 * Designation des cibles dans la scene (FR-013, contracts/scenes.md) : quelles cibles sont valides,
 * et laquelle est sous le pointeur. Coordonnees en unites d'arene ; la commande les arrondit au
 * 1/65536 (virgule fixe de la sim).
 */

/** Distance de prise d'une unite, d'un ennemi ou d'un emplacement sous le pointeur. */
export const PRISE = 30;

const F = 65536;

export interface Repere {
  readonly x: number;
  readonly y: number;
  readonly rayon: number;
}

/** Cibles a mettre en evidence pendant la designation. */
export function ciblesValides(combat: Combat, d: Designation): readonly Repere[] {
  const s = combat.state;
  switch (d.step) {
    case 'unit':
      return s.units.filter((u) => u.hp > 0).map((u) => ({ x: u.x / F, y: u.y / F, rayon: 22 }));
    case 'enemy':
      return s.enemies.filter((e) => e.hp > 0).map((e) => ({ x: e.x / F, y: e.y / F, rayon: 18 }));
    case 'slot':
      return emplacementsLibres(combat, d).map((sl) => ({
        x: sl.arena.x / F,
        y: sl.arena.y / F,
        rayon: 24,
      }));
    case 'point':
      return [];
  }
}

function emplacementsLibres(combat: Combat, d: Designation) {
  const unite = combat.state.units.find((u) => u.id === d.unit);
  if (!unite) return [];
  return combat.slots.filter(
    (sl) =>
      sl.kind === unite.kind && !combat.state.units.some((u) => u.hp > 0 && u.slot === sl.index),
  );
}

/** Rayon de la zone d'effet a montrer sous le pointeur pour une competence a point. */
export function rayonDeZone(combat: Combat, d: Designation): number | undefined {
  const effet = combat.bar[d.skill]?.effect;
  return effet && 'radius' in effet ? effet.radius : undefined;
}

const dansLArene = (x: number, y: number) => x >= 0 && y >= 0 && x <= 1600 && y <= 816;

/** Cible sous le pointeur, ou rien si le clic ne designe rien de valide. */
export function cibleSousPointeur(
  combat: Combat,
  d: Designation,
  p: { x: number; y: number },
): Target | undefined {
  if (d.step === 'point') {
    return dansLArene(p.x, p.y)
      ? { kind: 'point', x: Math.round(p.x * F), y: Math.round(p.y * F) }
      : undefined;
  }
  const s = combat.state;
  const plusProche = <T extends { x: number; y: number }>(liste: readonly T[]) => {
    let meilleur: T | undefined;
    let meilleureD = PRISE;
    for (const x of liste) {
      const dist = Math.hypot(x.x / F - p.x, x.y / F - p.y);
      if (dist <= meilleureD) {
        meilleur = x;
        meilleureD = dist;
      }
    }
    return meilleur;
  };
  if (d.step === 'unit') {
    const u = plusProche(s.units.filter((x) => x.hp > 0));
    return u ? { kind: 'unit', id: u.id } : undefined;
  }
  if (d.step === 'enemy') {
    const e = plusProche(s.enemies.filter((x) => x.hp > 0));
    return e ? { kind: 'enemy', id: e.id } : undefined;
  }
  const libre = plusProche(
    emplacementsLibres(combat, d).map((sl) => ({ ...sl.arena, index: sl.index })),
  );
  return libre && d.unit !== undefined
    ? { kind: 'unit-slot', id: d.unit, slot: libre.index }
    : undefined;
}
