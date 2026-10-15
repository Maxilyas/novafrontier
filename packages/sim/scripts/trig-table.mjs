import { writeFileSync } from 'node:fs';

/**
 * Genere packages/sim/src/trig-table.ts (research R3) : sinus d'un quart de tour, 257 valeurs en
 * virgule fixe 16.16, pour des angles en 1/1024 de tour. Math.sin n'est appele qu'ici, une fois,
 * hors de la simulation ; tests/trig.test.ts verifie la table.
 *
 * Usage : pnpm --filter @nova/sim trig:generate
 */

const valeurs = Array.from({ length: 257 }, (_, i) =>
  Math.round(Math.sin((i * Math.PI) / 512) * 65536),
);

const lignes = [];
for (let i = 0; i < valeurs.length; i += 8) lignes.push(`  ${valeurs.slice(i, i + 8).join(', ')},`);

const contenu = `/**
 * Fichier genere par scripts/trig-table.mjs : ne pas modifier a la main.
 * Sinus d'un quart de tour en virgule fixe 16.16 : QUARTER_SINE[i] = round(sin(i x pi / 512) x 65536)
 * pour i de 0 a 256 (angles en 1/1024 de tour, research R3).
 */
export const QUARTER_SINE: readonly number[] = [
${lignes.join('\n')}
];
`;

writeFileSync(new URL('../src/trig-table.ts', import.meta.url), contenu);
