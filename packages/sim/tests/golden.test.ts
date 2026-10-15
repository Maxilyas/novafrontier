import { describe, expect, it } from 'vitest';
import { runCombat } from '../src/combat';
import { goldenCombats, setupDe } from './golden/golden';

/**
 * Combats de reference (SC-002, FR-016, FR-023, research R10 et R11). Ce fichier tourne sous Node
 * (`pnpm test`) et dans Chromium, Firefox et WebKit (`pnpm test:browsers`) : memes entrees, meme
 * issue, meme dernier pas, meme empreinte, quel que soit le moteur JavaScript. Le JSON est importe,
 * sans `node:fs`, pour tourner aussi dans les navigateurs.
 */

describe('combats de reference', () => {
  it('au moins 100 combats varies, avec et sans commandes, avec et sans placement manuel', () => {
    expect(goldenCombats.length).toBeGreaterThanOrEqual(100);
    expect(goldenCombats.some((g) => g.setup.commands.length > 0)).toBe(true);
    expect(goldenCombats.some((g) => g.name.endsWith('-placement'))).toBe(true);
    expect(new Set(goldenCombats.map((g) => g.name)).size).toBe(goldenCombats.length);
  });

  it.each(goldenCombats.map((g) => [g.name, g] as const))('%s', (_nom, g) => {
    const r = runCombat(setupDe(g));
    expect({ outcome: r.outcome, ticks: r.ticks, fingerprint: r.fingerprint }).toEqual(g.expected);
  });
});
