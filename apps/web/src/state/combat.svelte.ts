import {
  type ActiveWeaponId,
  type Combatant,
  demoState,
  type Formation,
  type SquadId,
  type Theatre,
  unitById,
  weaponById,
} from '@nova/data';
import {
  autoPlacement,
  type Combat,
  type CombatResult,
  type CombatSetup,
  engagedUnits,
  type Placement,
  type SimEvent,
} from '@nova/sim';
import { appendEvents, emptyLog, type LogContext, type LogState, openingLines } from './combat-log';
import {
  combatRuntime,
  type Designation,
  type RuntimeMode,
  type RuntimePhase,
} from './combat-runtime';
import { teamParams } from './team-params';

/**
 * Projection reactive du combat pour le HUD (contracts/combat-runtime.md, data-model.md §4.3) : le
 * bandeau a chaque pas, la force engagee tous les 5 pas, le journal a chaque evenement, le resume a
 * la fin. Le HUD ne lit que cette projection ; il n'agit que par le moteur.
 */

export interface HudSnapshot {
  readonly tick: number;
  readonly wave: number;
  readonly waves: number;
  /** Integrite de la relique, de 0 a 1. */
  readonly relic: number;
  readonly nextWaveSeconds: number;
  readonly actionPoints: number;
  readonly spentSkills: number;
  /** Empreinte de l'etat, seulement avec `?diag=1` (FR-022). */
  readonly fingerprint: string | undefined;
}

export interface ForceRow {
  readonly id: number;
  readonly unitId: string;
  readonly name: string;
  readonly weaponColor: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly destroyed: boolean;
}

/** Rafraichissement de la force engagee : au moins deux fois par seconde (FR-028). */
const FORCES_TOUS_LES = 5;

let hud = $state.raw<HudSnapshot | null>(null);
let forces = $state.raw<readonly ForceRow[]>([]);
let journal = $state.raw<LogState>(emptyLog);
let fin = $state.raw<CombatResult | null>(null);
let phase = $state<RuntimePhase>(combatRuntime.phase);
let mode = $state<RuntimeMode>(combatRuntime.mode);
let designation = $state.raw<Designation | undefined>(undefined);
let combatCourant = $state.raw<Combat | undefined>(undefined);

const PAS_PAR_SECONDE = 20;

/** Armement des ennemis apparus : un ennemi detruit a disparu de l'etat quand le journal le cite. */
const armesEnnemies = new Map<number, ActiveWeaponId>();

function instantane(c: Combat): HudSnapshot {
  const s = c.state;
  return {
    tick: s.tick,
    wave: s.spawned,
    waves: s.waves.length,
    relic: s.relic.hp / s.relic.maxHp,
    nextWaveSeconds: Math.ceil(s.nextWaveIn / PAS_PAR_SECONDE),
    actionPoints: s.actionPoints,
    spentSkills: s.spentSkills,
    fingerprint: teamParams.diag ? c.fingerprint() : undefined,
  };
}

function lignesDeForce(c: Combat): readonly ForceRow[] {
  return c.state.units.map((u) => {
    const unite = unitById(u.unitId);
    return {
      id: u.id,
      unitId: u.unitId,
      name: unite?.name ?? u.unitId,
      weaponColor: weaponById(u.weapon)?.color ?? '#8b968f',
      hp: Math.max(0, Math.round(u.hp / 65536)),
      maxHp: Math.round(u.maxHp / 65536),
      destroyed: u.hp <= 0,
    };
  });
}

function contexteDuJournal(c: Combat): LogContext {
  const armeDe = (id: number) =>
    c.state.units.find((u) => u.id === id)?.weapon ?? armesEnnemies.get(id);
  return {
    unitName: (id) => {
      const u = c.state.units.find((x) => x.id === id);
      return u ? unitById(u.unitId)?.name : undefined;
    },
    weaponLabel: (id) => {
      const arme = armeDe(id);
      return arme ? weaponById(arme)?.label : undefined;
    },
    skill: (rank) => c.bar[rank],
    advantageEveryTicks: 30,
  };
}

combatRuntime.onStep((evenements: readonly SimEvent[], c: Combat) => {
  if (c !== combatCourant) {
    combatCourant = c;
    fin = null;
    armesEnnemies.clear();
    journal = openingLines(emptyLog, c.state.units.length, c.setup.formation);
  }
  for (const e of evenements) if (e.type === 'spawn') armesEnnemies.set(e.id, e.weapon);
  journal = appendEvents(journal, evenements, contexteDuJournal(c));
  hud = instantane(c);
  const mort = evenements.some((e) => e.type === 'death' && e.side === 'unit');
  if (c.state.tick % FORCES_TOUS_LES === 0 || mort || forces.length === 0)
    forces = lignesDeForce(c);
  const resultat = c.result();
  if (resultat) {
    forces = lignesDeForce(c);
    fin = resultat;
  }
});

combatRuntime.onChange(() => {
  phase = combatRuntime.phase;
  mode = combatRuntime.mode;
  designation = combatRuntime.designation;
});

export const combatHud = {
  get hud() {
    return hud;
  },
  get forces() {
    return forces;
  },
  get log() {
    return journal.lines;
  },
  get end() {
    return fin;
  },
  get phase() {
    return phase;
  },
  get mode() {
    return mode;
  },
  get replay() {
    return mode === 'replay';
  },
  get designation() {
    return designation;
  },
  get combat() {
    return combatCourant;
  },
};

/**
 * Entrees d'un combat pour les choix courants, sans graine ni commande. Sans placement donne, le
 * placement automatique (adresse directe du Combat, FR-031). Aucun combat sans unite placee.
 */
export function combatChoices(
  squadId: SquadId,
  theatre: Theatre,
  formation: Formation,
  placement?: Placement,
): Omit<CombatSetup, 'commands' | 'seed'> | undefined {
  const squad = demoState.squads.find((s) => s.id === squadId);
  if (!squad || engagedUnits(squad, theatre).length === 0) return undefined;
  const p = placement ?? autoPlacement(squad, theatre, formation);
  if (p.length === 0) return undefined;
  return { squad, theatre, formation, placement: p, planet: demoState.mission.target };
}

/** Lance un combat en direct avec les choix courants ; graine de l'adresse s'il y en a une. */
export function launchCombat(choices: Omit<CombatSetup, 'commands' | 'seed'>): void {
  combatRuntime.start(
    teamParams.seed === undefined ? choices : { ...choices, seed: teamParams.seed },
  );
}

/** Graine d'un combat : celle de l'adresse (`?graine=`), sinon tiree au hasard. */
export const seedForCombat = (): number =>
  teamParams.seed ?? crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;

/** Rejoue des entrees completes a l'ecran (Revoir le combat, resolution automatique, FR-021). */
export function replayCombat(setup: CombatSetup): void {
  combatRuntime.replay(setup);
}

/** Vaisseaux et mecas engageables, pour savoir si un combat peut etre lance. */
export const engageable = (squadId: SquadId, theatre: Theatre): readonly Combatant[] => {
  const squad = demoState.squads.find((s) => s.id === squadId);
  return squad ? engagedUnits(squad, theatre) : [];
};
