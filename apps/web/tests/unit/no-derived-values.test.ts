import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * FR-033, research R9 : les valeurs de briefing viennent des regles de @nova/sim. L'instantane des
 * valeurs de la maquette (`derivedValues` de @nova/data) ne sert plus qu'aux tests ; aucun fichier
 * de apps/web/src ne l'importe.
 */

const SRC = new URL('../../src/', import.meta.url);

const fichiers = (readdirSync(SRC, { recursive: true }) as string[]).filter((f) =>
  /\.(svelte|ts)$/.test(f),
);

describe('FR-033 : les ecrans lisent les valeurs de briefing dans la sim', () => {
  it('trouve les sources a verifier', () => {
    expect(fichiers.length).toBeGreaterThan(10);
  });

  it('aucun fichier de apps/web/src ne lit derivedValues', () => {
    const fautifs = fichiers.filter((f) =>
      /\bderivedValues\b|derived\.generated/.test(readFileSync(new URL(f, SRC), 'utf8')),
    );
    expect(fautifs).toEqual([]);
  });
});
