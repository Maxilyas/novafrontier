/**
 * Virgule fixe 16.16 (plan.md §6, research R2). Une valeur `v` est stockee `round(v x 65536)`, un
 * entier JavaScript. Produits et quotients tronquent explicitement ; leurs operandes restent bornes
 * pour que le resultat intermediaire soit sous 2^53, donc exact en double precision.
 */

/** Nombre en virgule fixe 16.16. */
export type Fixed = number;

export const FIXED_ONE = 65536;

/** Conversion d'une donnee decimale (reglage, multiplicateur) ; exacte et identique partout. */
export const toFixed = (x: number): Fixed => Math.round(x * FIXED_ONE);

/** Pour l'affichage seulement : jamais dans une regle. */
export const fromFixed = (f: Fixed): number => f / FIXED_ONE;

/** a x b, tronque vers zero. |a x b| doit rester sous 2^53. */
export const fmul = (a: Fixed, b: Fixed): Fixed => Math.trunc((a * b) / FIXED_ONE);

/** a / b, tronque vers zero. |a| doit rester sous 2^37. */
export const fdiv = (a: Fixed, b: Fixed): Fixed => Math.trunc((a * FIXED_ONE) / b);

/** a x b / c en entiers, tronque vers zero. |a x b| doit rester sous 2^53. */
export const mulDiv = (a: number, b: number, c: number): number => Math.trunc((a * b) / c);

/**
 * Racine carree entiere, floor(sqrt(n)), exacte pour 0 <= n <= 2^53. Math.sqrt ne sert que de point
 * de depart : la correction qui suit rend le resultat exact quel que soit son arrondi.
 */
export function isqrt(n: number): number {
  if (n < 2) return n;
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r -= 1;
  while ((r + 1) * (r + 1) <= n) r += 1;
  return r;
}

/**
 * Carre de la distance entre deux points 16.16, calcule sur des coordonnees ramenees au 1/256
 * d'unite : le resultat reste exact (au plus 10^12 dans l'arene).
 */
export function distSq256(ax: Fixed, ay: Fixed, bx: Fixed, by: Fixed): number {
  const dx = (ax - bx) >> 8;
  const dy = (ay - by) >> 8;
  return dx * dx + dy * dy;
}

/** Carre d'une portee 16.16, dans la meme unite que `distSq256`. */
export function rangeSq256(range: Fixed): number {
  const r = range >> 8;
  return r * r;
}
