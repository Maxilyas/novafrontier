import type { Skill, SkillEffect } from '@nova/data';
import type { SimEvent } from './events';
import { distSq256, FIXED_ONE, type Fixed, fmul, rangeSq256, toFixed } from './fixed';
import { ticksOf, tuning } from './tuning';
import type { CombatEnemy, CombatState, CombatUnit, Point, Slot, Target } from './types';

/**
 * Competences du commandant (FR-012 a FR-014b, table FR-014, data-model.md §2.3). Les parametres
 * viennent de @nova/data ; ce module les applique. Une competence sans cible valide au pas ou elle
 * s'applique ne coute rien et reste disponible (FR-014b).
 */

export interface SkillContext {
  readonly state: CombatState;
  readonly slots: readonly Slot[];
  readonly tick: number;
  emit(event: SimEvent): void;
  /** Degats a un ennemi, evenements `hit` et `death` compris. */
  hurtEnemy(enemy: CombatEnemy, damage: Fixed, multiplier: Fixed): void;
}

const vivant = (x: { hp: Fixed }) => x.hp > 0;

/** Plus proche par la distance au 1/256 ; a egalite, le plus petit identifiant (research R6). */
function plusProche<T extends { id: number; x: Fixed; y: Fixed; hp: Fixed }>(
  liste: readonly T[],
  x: Fixed,
  y: Fixed,
): T | undefined {
  let meilleur: T | undefined;
  let meilleureD2 = Number.POSITIVE_INFINITY;
  for (const e of liste) {
    if (!vivant(e)) continue;
    const d2 = distSq256(e.x, e.y, x, y);
    if (d2 < meilleureD2 || (d2 === meilleureD2 && meilleur !== undefined && e.id < meilleur.id)) {
      meilleur = e;
      meilleureD2 = d2;
    }
  }
  return meilleur;
}

function dansLArene(p: { x: Fixed; y: Fixed }): boolean {
  return p.x >= 0 && p.y >= 0 && p.x <= tuning.arena.width && p.y <= tuning.arena.height;
}

function soigner(u: CombatUnit, part: Fixed): void {
  u.hp = Math.min(u.maxHp, u.hp + fmul(u.maxHp, part));
}

function zone(ctx: SkillContext, centre: Point, rayon: number, degats: number): void {
  const r2 = rangeSq256(toFixed(rayon));
  const d = toFixed(degats);
  for (const e of ctx.state.enemies) {
    if (vivant(e) && distSq256(e.x, e.y, centre.x, centre.y) <= r2) ctx.hurtEnemy(e, d, FIXED_ONE);
  }
}

const uniteVivante = (state: CombatState, id: number) =>
  state.units.find((u) => u.id === id && vivant(u));

/** Effet resolu : point pour la scene, puis application. `null` : aucune cible valide. */
type Resolution = { readonly at: Point; readonly apply: () => void } | null;

function resoudre(
  ctx: SkillContext,
  effect: SkillEffect,
  target: Target | undefined,
  rank: number,
): Resolution {
  const { state } = ctx;
  const relique = { x: state.relic.x, y: state.relic.y };
  switch (effect.kind) {
    case 'strike-point':
    case 'heal-point': {
      if (target?.kind !== 'point' || !dansLArene(target)) return null;
      const at = { x: target.x, y: target.y };
      if (effect.kind === 'strike-point') {
        return { at, apply: () => zone(ctx, at, effect.radius, effect.damage) };
      }
      return {
        at,
        apply: () => {
          const r2 = rangeSq256(toFixed(effect.radius));
          const part = toFixed(effect.share);
          for (const u of state.units) {
            if (vivant(u) && distSq256(u.x, u.y, at.x, at.y) <= r2) soigner(u, part);
          }
        },
      };
    }
    case 'strike-nearest-relic': {
      const cible = plusProche(state.enemies, relique.x, relique.y);
      if (!cible) return null;
      return {
        at: { x: cible.x, y: cible.y },
        apply: () => ctx.hurtEnemy(cible, toFixed(effect.damage), FIXED_ONE),
      };
    }
    case 'strike-enemy': {
      const cible =
        target?.kind === 'enemy'
          ? state.enemies.find((e) => e.id === target.id && vivant(e))
          : undefined;
      if (!cible) return null;
      return {
        at: { x: cible.x, y: cible.y },
        apply: () => ctx.hurtEnemy(cible, toFixed(effect.damage), FIXED_ONE),
      };
    }
    case 'charge': {
      const plusSolide = (line: string) => {
        let meilleure: CombatUnit | undefined;
        for (const u of state.units) {
          if (vivant(u) && u.line === line && (!meilleure || u.defense > meilleure.defense)) {
            meilleure = u;
          }
        }
        return meilleure;
      };
      const unite = plusSolide('front') ?? plusSolide('back');
      const cible = unite ? plusProche(state.enemies, unite.x, unite.y) : undefined;
      if (!cible) return null;
      const at = { x: cible.x, y: cible.y };
      return { at, apply: () => zone(ctx, at, effect.radius, effect.damage) };
    }
    case 'defense-buff':
      return {
        at: relique,
        apply: () => {
          state.defenseBuff = {
            value: toFixed(effect.multiplier),
            ticks: ticksOf(effect.durationMs),
          };
        },
      };
    case 'front-damage-cut':
      return {
        at: relique,
        apply: () => {
          state.frontDamageCut = {
            value: toFixed(effect.multiplier),
            ticks: ticksOf(effect.durationMs),
          };
        },
      };
    case 'heal-unit':
    case 'attack-buff-unit': {
      const unite = target?.kind === 'unit' ? uniteVivante(state, target.id) : undefined;
      if (!unite) return null;
      return {
        at: { x: unite.x, y: unite.y },
        apply: () => {
          if (effect.kind === 'heal-unit') soigner(unite, toFixed(effect.share));
          else unite.attackBuff = { value: toFixed(effect.multiplier), wave: state.spawned };
        },
      };
    }
    case 'heal-all':
      return {
        at: relique,
        apply: () => {
          const part = toFixed(effect.share);
          for (const u of state.units) if (vivant(u)) soigner(u, part);
        },
      };
    case 'freeze':
      return {
        at: relique,
        apply: () => {
          const duree = ticksOf(effect.durationMs);
          for (const e of state.enemies) {
            if (vivant(e) && effect.threats.includes(e.threat)) e.frozen = duree;
          }
        },
      };
    case 'enemy-miss':
      return {
        at: relique,
        apply: () => {
          state.enemyMiss = { value: toFixed(effect.chance), ticks: ticksOf(effect.durationMs) };
        },
      };
    case 'loot-bonus':
      return {
        at: relique,
        apply: () => {
          state.pillage = {
            wave: state.spawned,
            share: toFixed(effect.share),
            skill: rank,
            status: 'pending',
          };
        },
      };
    case 'relocate': {
      if (target?.kind !== 'unit-slot') return null;
      const unite = uniteVivante(state, target.id);
      const slot = ctx.slots.find((s) => s.index === target.slot);
      if (!unite || !slot || slot.kind !== unite.kind) return null;
      if (state.units.some((u) => vivant(u) && u.slot === slot.index)) return null;
      return {
        at: slot.arena,
        apply: () => {
          unite.x = slot.arena.x;
          unite.y = slot.arena.y;
          unite.slot = slot.index;
          unite.line = slot.line;
        },
      };
    }
  }
}

/** Applique la competence de rang `rank` (FR-013) et emet son evenement `skill`. */
export function applySkill(
  ctx: SkillContext,
  rank: number,
  skill: Skill,
  target: Target | undefined,
): void {
  const { state } = ctx;
  const base = {
    type: 'skill',
    tick: ctx.tick,
    skill: rank,
    ...(target ? { target } : {}),
  } as const;
  if ((state.spentSkills & (1 << rank)) !== 0) {
    ctx.emit({ ...base, applied: false, failure: 'spent' });
    return;
  }
  if (state.actionPoints <= 0) {
    ctx.emit({ ...base, applied: false, failure: 'no-points' });
    return;
  }
  const resolution = resoudre(ctx, skill.effect, target, rank);
  if (!resolution) {
    ctx.emit({ ...base, applied: false, failure: 'no-target' });
    return;
  }
  state.actionPoints -= 1;
  state.spentSkills |= 1 << rank;
  ctx.emit({ ...base, applied: true, at: resolution.at });
  resolution.apply();
}
