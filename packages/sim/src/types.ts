import type { ActiveWeaponId, Formation, Line, SlotKind, Squad, Theatre, Threat } from '@nova/data';
import type { Fixed } from './fixed';

/**
 * Formes de la simulation (data-model.md §3, contracts/sim-package.md). Toutes les grandeurs de
 * l'etat sont des entiers : virgule fixe 16.16 (`Fixed`), pas (`Tick`), identifiants.
 */

/** Pas fixe de 50 ms ; le pas 0 est l'etat initial. */
export type Tick = number;

export const TICK_MS = 50;

export interface Point {
  x: Fixed;
  y: Fixed;
}

/** Emplacement d'une formation (data-model.md §3.1). */
export interface Slot {
  /** Rang dans la formation : premiere ligne, puis seconde, dans l'ordre de la maquette. */
  readonly index: number;
  readonly line: Line;
  readonly kind: SlotKind;
  /** Position sur le plateau de deploiement (988 x 752). */
  readonly board: Readonly<Point>;
  /** Position dans l'arene (1600 x 816). */
  readonly arena: Readonly<Point>;
}

/** Emplacement de chaque unite placee (identifiant d'unite de @nova/data, rang d'emplacement). */
export type Placement = readonly { readonly unit: string; readonly slot: number }[];

export type Target =
  | { readonly kind: 'point'; readonly x: Fixed; readonly y: Fixed }
  | { readonly kind: 'unit'; readonly id: number }
  | { readonly kind: 'enemy'; readonly id: number }
  | { readonly kind: 'unit-slot'; readonly id: number; readonly slot: number };

/** Action du joueur : competence par son rang dans la barre d'actions, datee du pas ou elle s'applique. */
export interface Command {
  readonly tick: Tick;
  readonly skill: number;
  readonly target?: Target;
}

/** Entrees d'un combat (data-model.md §3.3) : elles le determinent entierement. */
export interface CombatSetup {
  /** Entier non signe sur 32 bits. */
  readonly seed: number;
  readonly squad: Squad;
  readonly theatre: Theatre;
  readonly formation: Formation;
  readonly placement: Placement;
  /** Identifiant de la planete visee : sa difficulte donne les vagues. */
  readonly planet: string;
  readonly commands: readonly Command[];
  /** Scenario de charge seulement (research R14) ; sinon, le reglage de @nova/data. */
  readonly waveIntervalTicks?: number;
}

/** Vague annoncee (forme de `Wave` de @nova/data). */
export interface WaveSpec {
  readonly index: number;
  readonly boss: boolean;
  readonly composition: string;
  readonly weapon: ActiveWeaponId;
  readonly threat: Threat;
}

export interface CombatUnit {
  readonly id: number;
  readonly unitId: string;
  slot: number;
  line: Line;
  readonly kind: SlotKind;
  x: Fixed;
  y: Fixed;
  hp: Fixed;
  readonly maxHp: Fixed;
  readonly attack: Fixed;
  readonly defense: Fixed;
  readonly range: Fixed;
  readonly weapon: ActiveWeaponId;
  /** Pas restants avant de pouvoir tirer ; 0 : pret. */
  cooldown: number;
  /**
   * Surcharge : multiplicateur d'attaque, valable tant qu'aucune nouvelle vague n'est apparue
   * (`wave` : nombre de vagues apparues a l'activation).
   */
  attackBuff: { readonly value: Fixed; readonly wave: number } | null;
}

export interface CombatEnemy {
  readonly id: number;
  /** Rang de sa vague (1 pour la premiere). */
  readonly wave: number;
  readonly threat: Threat;
  readonly weapon: ActiveWeaponId;
  x: Fixed;
  y: Fixed;
  hp: Fixed;
  readonly maxHp: Fixed;
  readonly attack: Fixed;
  readonly defense: Fixed;
  readonly range: Fixed;
  /** Avance par pas. */
  readonly speed: Fixed;
  cooldown: number;
  /** Pas d'immobilisation restants. */
  frozen: number;
}

/** Effet de competence en cours : multiplicateur (ou chance) et pas restants. */
export interface TimedEffect {
  readonly value: Fixed;
  ticks: number;
}

export type Outcome = 'running' | 'victory' | 'defeat';
export type EndReason = 'relic' | 'cleared' | 'timeout';

export interface CombatState {
  tick: Tick;
  readonly rng: { state: [number, number, number, number] };
  outcome: Outcome;
  endReason: EndReason | null;
  readonly relic: { readonly x: Fixed; readonly y: Fixed; hp: Fixed; readonly maxHp: Fixed };
  readonly units: CombatUnit[];
  enemies: CombatEnemy[];
  readonly waves: readonly WaveSpec[];
  /** Vagues apparues. */
  spawned: number;
  /** Pas avant la vague suivante ; 0 une fois la derniere apparue. */
  nextWaveIn: number;
  /** Prochain identifiant d'entite. */
  nextId: number;
  /** Bouclier de flotte ou Garde serree : multiplicateur de defense. */
  defenseBuff: TimedEffect | null;
  /** Mur d'acier : multiplicateur des degats subis par la premiere ligne. */
  frontDamageCut: TimedEffect | null;
  /** Fumigene : chance qu'un tir ennemi manque. */
  enemyMiss: TimedEffect | null;
  actionPoints: number;
  /** Competences depensees, un bit par rang. */
  spentSkills: number;
  /** Pillage : vague visee, part de butin en plus (16.16), rang de la competence, issue. */
  pillage: {
    readonly wave: number;
    readonly share: Fixed;
    readonly skill: number;
    status: 'pending' | 'won' | 'lost';
  } | null;
}

/** Resultat d'un combat termine (data-model.md §3.7). */
export interface CombatResult {
  readonly outcome: Exclude<Outcome, 'running'>;
  readonly reason: EndReason;
  readonly ticks: Tick;
  readonly wavesSpawned: number;
  readonly wavesTotal: number;
  readonly unitsLeft: number;
  readonly unitsEngaged: number;
  readonly relicHp: Fixed;
  readonly relicMaxHp: Fixed;
  readonly lootBonus: boolean;
  /** Butin estime de la planete, majore par Pillage ; 0 en defaite. */
  readonly loot: number;
  readonly fingerprint: string;
}
