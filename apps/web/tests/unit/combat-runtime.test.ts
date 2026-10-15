import { demoState } from '@nova/data';
import { autoPlacement, type SimEvent } from '@nova/sim';
import { describe, expect, it } from 'vitest';
import {
  createRuntime,
  MAX_STEPS_PER_FRAME,
  type RuntimeEnv,
} from '../../src/state/combat-runtime';

/**
 * Horloge et commandes du moteur client (research R12, FR-011, FR-013, FR-032), avec une fausse
 * horloge : les images sont declenchees a la main.
 */

function fausseHorloge() {
  let suivante: ((now: number) => void) | undefined;
  let visibilite: ((hidden: boolean) => void) | undefined;
  let maintenant = 0;
  const env: RuntimeEnv = {
    requestFrame: (cb) => {
      suivante = cb;
      return 1;
    },
    cancelFrame: () => {
      suivante = undefined;
    },
    onVisibilityChange: (ecoute) => {
      visibilite = ecoute;
    },
    randomSeed: () => 1,
  };
  return {
    env,
    /** Avance le temps de `ms` puis declenche l'image en attente. */
    image(ms: number) {
      maintenant += ms;
      const cb = suivante;
      suivante = undefined;
      cb?.(maintenant);
    },
    masquer: (cache: boolean) => visibilite?.(cache),
    get attend() {
      return suivante !== undefined;
    },
  };
}

const alpha = demoState.squads.find((s) => s.id === 'alpha');
if (!alpha) throw new Error('alpha');
const lancement = {
  squad: alpha,
  theatre: 'sol' as const,
  formation: 'ring' as const,
  placement: autoPlacement(alpha, 'sol', 'ring'),
  planet: 'gemenon',
  seed: 1,
};

function preparer() {
  const h = fausseHorloge();
  const rt = createRuntime(h.env);
  const evenements: SimEvent[] = [];
  rt.onStep((e) => evenements.push(...e));
  rt.start(lancement);
  h.image(0);
  return { h, rt, evenements };
}

const pas = (rt: ReturnType<typeof createRuntime>) => rt.combat?.state.tick ?? -1;

describe('horloge a pas fixe', () => {
  it('fait un pas par tranche de 50 ms', () => {
    const { h, rt } = preparer();
    h.image(16);
    h.image(16);
    h.image(16);
    expect(pas(rt)).toBe(0);
    h.image(16);
    expect(pas(rt)).toBe(1);
    h.image(100);
    expect(pas(rt)).toBe(3);
  });

  it(`fait au plus ${MAX_STEPS_PER_FRAME} pas par image et abandonne le retard`, () => {
    const { h, rt } = preparer();
    h.image(1000);
    expect(pas(rt)).toBe(MAX_STEPS_PER_FRAME);
    h.image(16);
    expect(pas(rt)).toBe(MAX_STEPS_PER_FRAME);
  });

  it('emet les evenements du pas 0 au lancement', () => {
    const { evenements } = preparer();
    expect(evenements.filter((e) => e.type === 'wave')).toHaveLength(1);
  });
});

describe('pause', () => {
  it('pause puis reprise au meme pas, sans rattrapage', () => {
    const { h, rt } = preparer();
    h.image(100);
    rt.pause();
    expect(rt.phase).toBe('paused');
    expect(h.attend).toBe(false);
    rt.resume();
    h.image(60_000);
    expect(pas(rt)).toBe(2);
    h.image(50);
    expect(pas(rt)).toBe(3);
  });

  it('onglet masque : l horloge s arrete, puis repart de l instant present', () => {
    const { h, rt } = preparer();
    h.image(50);
    h.masquer(true);
    expect(h.attend).toBe(false);
    h.masquer(false);
    h.image(30_000);
    expect(pas(rt)).toBe(1);
  });
});

describe('competences et designation', () => {
  it('une competence non ciblee vaut pour le pas suivant', () => {
    const { h, rt } = preparer();
    rt.activateSkill(1);
    expect(rt.combat?.setup.commands).toEqual([{ tick: 1, skill: 1 }]);
    rt.activateSkill(1);
    expect(rt.combat?.setup.commands).toHaveLength(1);
    h.image(50);
    expect(rt.combat?.state.defenseBuff).not.toBeNull();
  });

  it('une competence ciblee ouvre la designation ; la cible confirmee devient une commande', () => {
    const { rt } = preparer();
    rt.activateSkill(0);
    expect(rt.designation).toEqual({ skill: 0, step: 'point' });
    rt.designate({ kind: 'unit', id: 1 });
    expect(rt.designation).toBeDefined();
    rt.designate({ kind: 'point', x: 65536 * 400, y: 65536 * 300 });
    expect(rt.designation).toBeUndefined();
    expect(rt.combat?.setup.commands).toEqual([
      { tick: 1, skill: 0, target: { kind: 'point', x: 65536 * 400, y: 65536 * 300 } },
    ]);
  });

  it('annuler ne consomme rien ; une autre competence, la pause ou la fin annulent aussi', () => {
    const { h, rt } = preparer();
    rt.activateSkill(0);
    rt.cancelDesignation();
    expect(rt.designation).toBeUndefined();
    rt.activateSkill(0);
    rt.activateSkill(0);
    expect(rt.designation).toBeUndefined();
    rt.activateSkill(0);
    rt.activateSkill(2);
    expect(rt.designation).toEqual({ skill: 2, step: 'unit' });
    rt.pause();
    expect(rt.designation).toBeUndefined();
    rt.resume();
    h.image(50);
    expect(rt.combat?.setup.commands).toEqual([]);
    expect(rt.combat?.state.actionPoints).toBe(5);
  });

  it('en replay, les competences du joueur sont ignorees', () => {
    const h = fausseHorloge();
    const rt = createRuntime(h.env);
    rt.replay({ ...lancement, commands: [] });
    rt.activateSkill(1);
    expect(rt.combat?.setup.commands).toEqual([]);
    expect(rt.mode).toBe('replay');
  });
});
