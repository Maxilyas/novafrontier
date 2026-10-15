import type { CombatTuning, EnemyArchetype, Threat } from '../schemas';

/**
 * Reglages du combat (data-model.md §2.1) : valeurs de la maquette (`startCombat`, `buildSlots`,
 * `spawnWave`, `combatLoop`, `dmg`, lignes 1959-1976 et 2161-2298), durees converties des images a
 * 60 par seconde (research R5) et decisions de la spec (vagues toutes les 12 s, duree maximale).
 */
export const combatTuning: CombatTuning = {
  relicHp: 1000,
  arena: { width: 1600, height: 816 },
  relicPosition: { ring: { x: 800, y: 408 }, arc: { x: 1200, y: 408 } },
  board: {
    width: 988,
    height: 752,
    objective: { ring: { x: 494, y: 376 }, arc: { x: 818, y: 376 } },
  },
  boardToArena: { x: 1.04, y: 0.98 },
  slots: {
    ring: {
      front: { count: 8, radius: 132, startRad: -Math.PI / 2, stepRad: Math.PI / 4 },
      back: {
        count: 8,
        radius: 236,
        startRad: 0.0625 * 2 * Math.PI - Math.PI / 2,
        stepRad: Math.PI / 4,
      },
    },
    arc: {
      front: { count: 7, radius: 340, startRad: Math.PI - 0.95, stepRad: 1.9 / 6 },
      back: { count: 6, radius: 225, startRad: Math.PI - 0.8, stepRad: 1.6 / 5 },
    },
  },
  slotTypes: ['ship', 'mech'],
  spawn: {
    sector: {
      ring: { centerRad: 0, halfWidthRad: Math.PI },
      arc: { centerRad: Math.PI, halfWidthRad: 0.75 },
    },
    distance: { min: 520, range: 140, boss: 620 },
    squash: 0.72,
  },
  cooldownMs: { unit: 550, enemyVsUnit: 700, enemyVsRelic: 800 },
  waveIntervalMs: 12000,
  relicStrike: { radius: 70, attackShare: 0.5 },
  defenseConstant: 130,
  minDamage: 1,
  maxDurationMs: 600000,
  advantageLogMs: 1500,
};

/**
 * Archetypes d'ennemis par menace (data-model.md §2.2, `spawnWave`, lignes 2191-2200). Les
 * compositions sont les libelles corriges (FR-004) : elles annoncent ce qui apparait.
 */
export const enemyArchetypes: Readonly<Record<Threat, EnemyArchetype>> = {
  l: {
    threat: 'l',
    composition: 'Intercepteurs ×12',
    count: 12,
    hp: 120,
    attack: 11,
    defense: 22,
    range: 110,
    speed: 76.5,
    color: '#8fd6ff',
    size: 7,
  },
  m: {
    threat: 'm',
    composition: 'Intercepteurs lourds ×9',
    count: 9,
    hp: 230,
    attack: 18,
    defense: 22,
    range: 110,
    speed: 54,
    color: '#ffd07a',
    size: 10,
  },
  h: {
    threat: 'h',
    composition: 'Frégates de raid ×5',
    count: 5,
    hp: 520,
    attack: 34,
    defense: 46,
    range: 110,
    speed: 37.8,
    color: '#ff7a5c',
    size: 14,
  },
  b: {
    threat: 'b',
    composition: 'Croiseur porte-nef',
    count: 1,
    hp: 2600,
    attack: 90,
    defense: 70,
    range: 150,
    speed: 21.6,
    color: '#ff5fc0',
    size: 22,
  },
};
