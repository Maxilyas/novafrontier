import { describe, expect, it } from 'vitest';
import { createCombat, runCombat } from '../src/combat';
import { goldenCombats, setupDe } from './golden/golden';

/**
 * Replay (SC-003, FR-021) : un combat joue en direct, commande par commande au fil des pas, et le
 * meme combat rejoue a partir de son journal complet passent par les memes etats, pas a pas.
 */

const avecCommandes = goldenCombats.filter((g) => g.setup.commands.length > 0);

describe('replay a l identique', () => {
  it('trouve des combats de reference avec commandes', () => {
    expect(avecCommandes.length).toBeGreaterThan(10);
  });

  it.each(avecCommandes.map((g) => [g.name, g] as const))(
    '%s : direct et replay, meme empreinte a chaque pas',
    (_nom, g) => {
      const setup = setupDe(g);
      const direct = createCombat({ ...setup, commands: [] });
      const replay = createCombat(setup);
      let suivante = 0;
      while (direct.result() === null) {
        // En direct, chaque commande est emise juste avant son pas, comme le fait le client.
        const prochaine = setup.commands[suivante];
        if (prochaine && prochaine.tick === direct.state.tick + 1) {
          direct.issue(prochaine);
          suivante += 1;
          continue;
        }
        direct.step();
        replay.step();
        expect(direct.fingerprint()).toBe(replay.fingerprint());
      }
      expect(replay.result()).toEqual(direct.result());
      expect(direct.result()?.fingerprint).toBe(g.expected.fingerprint);
    },
  );

  it('10 executions du meme replay donnent la meme empreinte', () => {
    const g = avecCommandes[0];
    if (!g) throw new Error('aucun combat');
    const empreintes = new Set(Array.from({ length: 10 }, () => runCombat(setupDe(g)).fingerprint));
    expect([...empreintes]).toEqual([g.expected.fingerprint]);
  });
});
