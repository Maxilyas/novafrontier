import {
  type ActiveWeaponId,
  combatTuning,
  damageMatrix,
  enemyArchetypes,
  type Formation,
  type Line,
  type SlotKind,
  type Threat,
} from '@nova/data';
import { type Fixed, rangeSq256, toFixed } from './fixed';
import { type Angle, radiansToAngle } from './trig';
import { type Point, TICK_MS } from './types';

/**
 * Conversion unique des reglages de @nova/data en pas et en virgule fixe (research R2, R5, R8). Les
 * regles ne lisent que ces valeurs entieres.
 */

/** Duree en millisecondes vers un nombre de pas, au plus proche. */
export const ticksOf = (ms: number): number => Math.round(ms / TICK_MS);

const point = (p: { x: number; y: number }): Point => ({ x: toFixed(p.x), y: toFixed(p.y) });

export interface SlotLineTuning {
  readonly count: number;
  readonly radius: Fixed;
  /** Angle de chaque place, en 1/1024 de tour. */
  readonly angles: readonly Angle[];
}

export interface ArchetypeTuning {
  readonly threat: Threat;
  readonly composition: string;
  readonly count: number;
  readonly hp: Fixed;
  readonly attack: Fixed;
  readonly defense: Fixed;
  readonly range: Fixed;
  /** Avance par pas. */
  readonly speed: Fixed;
}

const FORMATIONS: readonly Formation[] = ['ring', 'arc'];

function slotLine(l: {
  count: number;
  radius: number;
  startRad: number;
  stepRad: number;
}): SlotLineTuning {
  return {
    count: l.count,
    radius: toFixed(l.radius),
    angles: Array.from({ length: l.count }, (_, i) => radiansToAngle(l.startRad + i * l.stepRad)),
  };
}

const t = combatTuning;

export const tuning = {
  relicHp: toFixed(t.relicHp),
  arena: { width: toFixed(t.arena.width), height: toFixed(t.arena.height) },
  relicPosition: { ring: point(t.relicPosition.ring), arc: point(t.relicPosition.arc) },
  boardObjective: { ring: point(t.board.objective.ring), arc: point(t.board.objective.arc) },
  boardToArena: { x: toFixed(t.boardToArena.x), y: toFixed(t.boardToArena.y) },
  slots: Object.fromEntries(
    FORMATIONS.map((f) => [
      f,
      { front: slotLine(t.slots[f].front), back: slotLine(t.slots[f].back) },
    ]),
  ) as Record<Formation, Record<Line, SlotLineTuning>>,
  slotTypes: t.slotTypes as readonly [SlotKind, SlotKind],
  spawn: {
    sector: Object.fromEntries(
      FORMATIONS.map((f) => {
        const s = t.spawn.sector[f];
        const demiOuverture = radiansToAngle(s.halfWidthRad);
        return [
          f,
          {
            center: radiansToAngle(s.centerRad),
            halfWidth: demiOuverture,
            /** Tour complet : un tirage uniforme sur 1 024 angles, sans doubler l'angle oppose. */
            full: demiOuverture >= 512,
          },
        ];
      }),
    ) as Record<Formation, { center: Angle; halfWidth: Angle; full: boolean }>,
    /** Distances tirees au 1/256 d'unite : `nextInt` reste exact (research R4). */
    distMin: toFixed(t.spawn.distance.min),
    distRange256: Math.round(t.spawn.distance.range * 256),
    distBoss: toFixed(t.spawn.distance.boss),
    squash: toFixed(t.spawn.squash),
  },
  cooldown: {
    unit: ticksOf(t.cooldownMs.unit),
    enemyVsUnit: ticksOf(t.cooldownMs.enemyVsUnit),
    enemyVsRelic: ticksOf(t.cooldownMs.enemyVsRelic),
  },
  waveInterval: ticksOf(t.waveIntervalMs),
  relicStrikeRadiusSq: rangeSq256(toFixed(t.relicStrike.radius)),
  relicStrikeShare: toFixed(t.relicStrike.attackShare),
  defenseConstant: toFixed(t.defenseConstant),
  minDamage: toFixed(t.minDamage),
  maxTicks: ticksOf(t.maxDurationMs),
  advantageLogTicks: ticksOf(t.advantageLogMs),
  archetypes: Object.fromEntries(
    Object.values(enemyArchetypes).map((a) => [
      a.threat,
      {
        threat: a.threat,
        composition: a.composition,
        count: a.count,
        hp: toFixed(a.hp),
        attack: toFixed(a.attack),
        defense: toFixed(a.defense),
        range: toFixed(a.range),
        speed: toFixed(a.speed / (1000 / TICK_MS)),
      },
    ]),
  ) as Record<Threat, ArchetypeTuning>,
  /** Matrice d'armement en 16.16 : tireur, puis cible. */
  matrix: Object.fromEntries(
    Object.entries(damageMatrix).map(([tireur, cibles]) => [
      tireur,
      Object.fromEntries(Object.entries(cibles).map(([cible, m]) => [cible, toFixed(m)])),
    ]),
  ) as Record<ActiveWeaponId, Record<ActiveWeaponId, Fixed>>,
} as const;

export type Tuning = typeof tuning;
