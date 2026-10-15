import { demoState } from '@nova/data';
import { autoPlacement, type CombatSetup, runCombat } from '@nova/sim';
import { describe, expect, it } from 'vitest';
import { createRuntime, type RuntimeEnv } from '../../src/state/combat-runtime';

/**
 * SC-004 et FR-011 : la cadence d'affichage (60, 120, 144 images/s), les pauses et l'onglet masque
 * ne changent que le nombre de pas par image, jamais les pas eux-memes. Le meme combat, avec les
 * memes commandes datees, aboutit a la meme empreinte que sous Node sans affichage.
 */

const alpha = demoState.squads.find((s) => s.id === 'alpha');
if (!alpha) throw new Error('alpha');

const setup: CombatSetup = {
  seed: 7,
  squad: alpha,
  theatre: 'sol',
  formation: 'ring',
  placement: autoPlacement(alpha, 'sol', 'ring'),
  planet: 'gemenon',
  commands: [
    { tick: 120, skill: 1 },
    { tick: 200, skill: 0, target: { kind: 'point', x: 65536 * 640, y: 65536 * 360 } },
    { tick: 330, skill: 2, target: { kind: 'unit', id: 1 } },
  ],
};

/**
 * Pilote le moteur avec une fausse horloge : une image toutes les `periode` ms, et, si demande, une
 * pause et un onglet masque en cours de route. Rend l'empreinte finale.
 */
function jouer(periode: number, interruptions = false): string {
  let suivante: ((now: number) => void) | undefined;
  let visibilite: ((hidden: boolean) => void) | undefined;
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
  const rt = createRuntime(env);
  rt.replay(setup);
  let maintenant = 0;
  let images = 0;
  while (rt.phase !== 'ended' && images < 1_000_000) {
    images += 1;
    if (interruptions && images === 500) rt.pause();
    if (interruptions && images === 520) rt.resume();
    if (interruptions && images === 900) visibilite?.(true);
    if (interruptions && images === 950) visibilite?.(false);
    maintenant += periode;
    const cb = suivante;
    suivante = undefined;
    cb?.(maintenant);
  }
  const r = rt.combat?.result();
  if (!r) throw new Error('combat non termine');
  return r.fingerprint;
}

describe('cadences d affichage', () => {
  const reference = runCombat(setup).fingerprint;

  it.each([
    ['60 images/s', 1000 / 60],
    ['120 images/s', 1000 / 120],
    ['144 images/s', 1000 / 144],
    ['30 images/s', 1000 / 30],
  ])('%s : meme empreinte que sans affichage', (_nom, periode) => {
    expect(jouer(periode)).toBe(reference);
  });

  it('pause et onglet masque en cours de combat : meme empreinte', () => {
    expect(jouer(1000 / 60, true)).toBe(reference);
  });
});
