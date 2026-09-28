import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Garde-fou du principe II de la constitution : la simulation est deterministe et ne depend ni
 * du DOM, ni d'une horloge, ni d'un tirage non seede (contracts/sim-package.md).
 */

const racine = join(import.meta.dirname, '..');
const src = join(racine, 'src');

const fichiers = (dossier: string): string[] =>
  readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory()
      ? fichiers(chemin)
      : chemin.endsWith('.ts')
        ? [chemin]
        : [];
  });

const INTERDITS: readonly [string, RegExp][] = [
  ['Math.random', /\bMath\.random\b/],
  ['Math.sin', /\bMath\.sin\b/],
  ['Math.cos', /\bMath\.cos\b/],
  ['Math.atan2', /\bMath\.atan2\b/],
  ['Math.hypot', /\bMath\.hypot\b/],
  ['Date.now', /\bDate\.now\b/],
  ['new Date', /\bnew\s+Date\b/],
  ['performance.now', /\bperformance\.now\b/],
  ['window', /\bwindow\b/],
  ['document', /\bdocument\b/],
  ['navigator', /\bnavigator\b/],
];

describe('purete de @nova/sim', () => {
  const sources = fichiers(src).map((f) => ({ f, texte: readFileSync(f, 'utf8') }));

  it('trouve les sources', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it.each(INTERDITS)('aucun appel a %s', (_nom, motif) => {
    const fautifs = sources.filter((s) => motif.test(s.texte)).map((s) => s.f);
    expect(fautifs).toEqual([]);
  });

  it('tsconfig sans la bibliotheque DOM', () => {
    const config = JSON.parse(readFileSync(join(racine, 'tsconfig.json'), 'utf8')) as {
      compilerOptions?: { lib?: string[] };
    };
    const lib = config.compilerOptions?.lib ?? [];
    expect(lib.length).toBeGreaterThan(0);
    expect(lib.some((l) => l.toLowerCase().startsWith('dom'))).toBe(false);
  });
});
