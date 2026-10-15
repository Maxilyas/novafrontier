/**
 * Generateur pseudo-aleatoire de la simulation (plan.md §6, research R4) : xoshiro128**, initialise
 * par splitmix32 a partir de la graine. Uniquement des operations entieres sur 32 bits
 * (`Math.imul`, decalages), identiques sur tous les moteurs. L'etat fait partie de l'empreinte.
 */

export interface Rng {
  /** 4 mots, en entiers signes sur 32 bits. */
  state: [number, number, number, number];
}

const DEUX_PUISSANCE_32 = 4294967296;

function splitmix32(graine: number): () => number {
  let a = graine | 0;
  return () => {
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) | 0;
  };
}

const rotl = (x: number, k: number) => (x << k) | (x >>> (32 - k));

/** Graine : entier non signe sur 32 bits. */
export function createRng(seed: number): Rng {
  const suivant = splitmix32(seed >>> 0);
  return { state: [suivant(), suivant(), suivant(), suivant()] };
}

/** Prochain entier non signe sur 32 bits. */
export function nextU32(rng: Rng): number {
  const s = rng.state;
  const resultat = Math.imul(rotl(Math.imul(s[1], 5), 7), 9) >>> 0;
  const t = s[1] << 9;
  s[2] ^= s[0];
  s[3] ^= s[1];
  s[1] ^= s[2];
  s[0] ^= s[3];
  s[2] ^= t;
  s[3] = rotl(s[3], 11) | 0;
  return resultat;
}

/** Entier dans [0, n), exact pour n < 2^21 (le produit reste sous 2^53). */
export function nextInt(rng: Rng, n: number): number {
  return Math.floor((nextU32(rng) * n) / DEUX_PUISSANCE_32);
}
