import {
  type Combat,
  type CombatSetup,
  createCombat,
  type SimEvent,
  type Target,
  TICK_MS,
} from '@nova/sim';

/**
 * Moteur du combat cote client (contracts/combat-runtime.md, research R12) : il possede la session
 * de combat, son horloge a pas fixe, le journal de commandes, la designation des cibles et le
 * replay. Sans Svelte ni Pixi : le combat avance meme sans rendu, et l'horloge se teste avec des
 * cadences simulees. La scene et le HUD le lisent ; seules les commandes le font agir.
 */

export type RuntimePhase = 'idle' | 'running' | 'paused' | 'ended';
export type RuntimeMode = 'live' | 'replay';

/** Designation en cours (FR-013) : `slot` est la seconde etape de Repli tactique. */
export interface Designation {
  readonly skill: number;
  readonly step: 'point' | 'unit' | 'enemy' | 'slot';
  /** Unite choisie a la premiere etape de Repli tactique. */
  readonly unit?: number;
}

/** Ce que le moteur demande a son environnement ; remplace par une fausse horloge dans les tests. */
export interface RuntimeEnv {
  requestFrame(callback: (now: number) => void): number;
  cancelFrame(handle: number): void;
  /** Appele quand l'onglet est masque (`true`) ou de nouveau visible (`false`). */
  onVisibilityChange(listener: (hidden: boolean) => void): void;
  randomSeed(): number;
}

export interface CombatRuntime {
  readonly phase: RuntimePhase;
  readonly mode: RuntimeMode;
  readonly combat: Combat | undefined;
  readonly designation: Designation | undefined;
  start(setup: Omit<CombatSetup, 'commands' | 'seed'> & { seed?: number }): void;
  replay(setup: CombatSetup): void;
  pause(): void;
  resume(): void;
  activateSkill(rank: number): void;
  designate(target: Target): void;
  cancelDesignation(): void;
  /** Interpolation entre le pas precedent et le pas courant, de 0 a 1. */
  alpha(now: number): number;
  previousPosition(id: number): { x: number; y: number } | undefined;
  onStep(listener: (events: readonly SimEvent[], combat: Combat) => void): () => void;
  onChange(listener: () => void): () => void;
}

/** Au plus 4 pas par image : au-dela, le retard est abandonne (pas de rattrapage, FR-032). */
export const MAX_STEPS_PER_FRAME = 4;

export function createRuntime(env: RuntimeEnv): CombatRuntime {
  let phase: RuntimePhase = 'idle';
  let mode: RuntimeMode = 'live';
  let combat: Combat | undefined;
  let designation: Designation | undefined;
  let accumule = 0;
  let derniere: number | undefined;
  let image: number | undefined;
  let masque = false;
  const precedentes = new Map<number, { x: number; y: number }>();
  const ecoutesPas = new Set<(events: readonly SimEvent[], combat: Combat) => void>();
  const ecoutesChangement = new Set<() => void>();

  const changement = () => {
    for (const ecoute of ecoutesChangement) ecoute();
  };

  function memoriserPositions(): void {
    precedentes.clear();
    if (!combat) return;
    for (const e of combat.state.enemies) precedentes.set(e.id, { x: e.x, y: e.y });
    for (const u of combat.state.units) precedentes.set(u.id, { x: u.x, y: u.y });
  }

  function arreterHorloge(): void {
    if (image !== undefined) env.cancelFrame(image);
    image = undefined;
    derniere = undefined;
  }

  function planifier(): void {
    if (image === undefined && phase === 'running' && !masque) image = env.requestFrame(tour);
  }

  function tour(now: number): void {
    image = undefined;
    if (phase !== 'running' || !combat || masque) return;
    accumule += derniere === undefined ? 0 : now - derniere;
    derniere = now;
    let pas = 0;
    while (accumule >= TICK_MS && pas < MAX_STEPS_PER_FRAME) {
      accumule -= TICK_MS;
      pas += 1;
      memoriserPositions();
      const evenements = combat.step();
      for (const ecoute of ecoutesPas) ecoute(evenements, combat);
      if (combat.result()) {
        phase = 'ended';
        designation = undefined;
        accumule = 0;
        changement();
        return;
      }
    }
    if (accumule >= TICK_MS) accumule = 0;
    planifier();
  }

  function demarrer(nouveau: Combat, nouveauMode: RuntimeMode): void {
    arreterHorloge();
    combat = nouveau;
    mode = nouveauMode;
    phase = 'running';
    designation = undefined;
    accumule = 0;
    memoriserPositions();
    for (const ecoute of ecoutesPas) ecoute(nouveau.initialEvents, nouveau);
    changement();
    planifier();
  }

  env.onVisibilityChange((cache) => {
    masque = cache;
    if (cache) arreterHorloge();
    else planifier();
  });

  /** Une commande de cette competence attend deja son pas : un double clic ne la duplique pas. */
  function enAttente(rank: number): boolean {
    if (!combat) return false;
    const pas = combat.state.tick;
    return combat.setup.commands.some((c) => c.skill === rank && c.tick > pas);
  }

  function emettre(rank: number, target?: Target): void {
    if (!combat) return;
    const tick = combat.state.tick + 1;
    combat.issue(target ? { tick, skill: rank, target } : { tick, skill: rank });
  }

  const actif = () => phase === 'running' && mode === 'live' && combat !== undefined;

  return {
    get phase() {
      return phase;
    },
    get mode() {
      return mode;
    },
    get combat() {
      return combat;
    },
    get designation() {
      return designation;
    },
    start(setup) {
      const seed = setup.seed ?? env.randomSeed();
      demarrer(createCombat({ ...setup, seed, commands: [] }), 'live');
    },
    replay(setup) {
      demarrer(createCombat(setup), 'replay');
    },
    pause() {
      if (phase !== 'running') return;
      phase = 'paused';
      designation = undefined;
      arreterHorloge();
      changement();
    },
    resume() {
      if (phase !== 'paused') return;
      phase = 'running';
      accumule = 0;
      derniere = undefined;
      changement();
      planifier();
    },
    activateSkill(rank) {
      if (!actif() || !combat) return;
      const skill = combat.bar[rank];
      const s = combat.state;
      if (!skill || (s.spentSkills & (1 << rank)) !== 0 || s.actionPoints <= 0) return;
      if (enAttente(rank)) return;
      if (designation?.skill === rank) {
        designation = undefined;
      } else if (skill.target === 'none') {
        designation = undefined;
        emettre(rank);
      } else {
        designation = { skill: rank, step: skill.target === 'unit-slot' ? 'unit' : skill.target };
      }
      changement();
    },
    designate(target) {
      if (!actif() || !designation) return;
      const { skill, step } = designation;
      if (step === 'unit' && target.kind === 'unit' && combat?.bar[skill]?.target === 'unit-slot') {
        designation = { skill, step: 'slot', unit: target.id };
      } else if (
        (step === 'point' && target.kind === 'point') ||
        (step === 'unit' && target.kind === 'unit') ||
        (step === 'enemy' && target.kind === 'enemy') ||
        (step === 'slot' && target.kind === 'unit-slot' && target.id === designation.unit)
      ) {
        designation = undefined;
        emettre(skill, target);
      } else {
        return;
      }
      changement();
    },
    cancelDesignation() {
      if (!designation) return;
      designation = undefined;
      changement();
    },
    alpha(now) {
      if (phase !== 'running' || derniere === undefined) return 1;
      return Math.max(0, Math.min(1, (accumule + now - derniere) / TICK_MS));
    },
    previousPosition: (id) => precedentes.get(id),
    onStep(ecoute) {
      ecoutesPas.add(ecoute);
      return () => ecoutesPas.delete(ecoute);
    },
    onChange(ecoute) {
      ecoutesChangement.add(ecoute);
      return () => ecoutesChangement.delete(ecoute);
    },
  };
}

/** Environnement du navigateur ; inerte hors navigateur (tests Node, rendu sans fenetre). */
function navigateur(): RuntimeEnv {
  const disponible = typeof window !== 'undefined' && typeof document !== 'undefined';
  return {
    requestFrame: (cb) => (disponible ? requestAnimationFrame(cb) : 0),
    cancelFrame: (h) => {
      if (disponible) cancelAnimationFrame(h);
    },
    onVisibilityChange: (ecoute) => {
      if (!disponible) return;
      document.addEventListener('visibilitychange', () =>
        ecoute(document.visibilityState === 'hidden'),
      );
    },
    randomSeed: () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1,
  };
}

/** Instance unique de la page. */
export const combatRuntime: CombatRuntime = createRuntime(navigateur());
