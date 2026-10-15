import { describe, expect, it } from 'vitest';
import { createRng, nextInt, nextU32 } from '../src/rng';

/**
 * Generateur xoshiro128** initialise par splitmix32 (research R4), compare a une implementation de
 * reference en BigInt ecrite ici, independante du code teste.
 */

const M32 = 0xffffffffn;
const imul = (a: bigint, b: bigint) => (a * b) & M32;
const rotl = (x: bigint, k: bigint) => ((x << k) | (x >> (32n - k))) & M32;

function reference(seed: number): () => number {
  let a = BigInt(seed >>> 0);
  const splitmix = () => {
    a = (a + 0x9e3779b9n) & M32;
    let t = a ^ (a >> 16n);
    t = imul(t, 0x21f0aaadn);
    t ^= t >> 15n;
    t = imul(t, 0x735a2d97n);
    return t ^ (t >> 15n);
  };
  const s = [splitmix(), splitmix(), splitmix(), splitmix()] as [bigint, bigint, bigint, bigint];
  return () => {
    const resultat = imul(rotl(imul(s[1], 5n), 7n), 9n);
    const t = (s[1] << 9n) & M32;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 11n);
    return Number(resultat);
  };
}

describe('xoshiro128**', () => {
  it.each([1, 0xdeadbeef, 4_294_967_295])('suit la reference pour la graine %i', (graine) => {
    const rng = createRng(graine);
    const ref = reference(graine);
    for (let i = 0; i < 1000; i += 1) expect(nextU32(rng)).toBe(ref());
  });

  it('garde un etat de 4 entiers signes sur 32 bits', () => {
    const rng = createRng(7);
    nextU32(rng);
    expect(rng.state).toHaveLength(4);
    for (const mot of rng.state) expect(mot).toBe(mot | 0);
  });

  it('tire des entiers dans [0, n)', () => {
    const rng = createRng(42);
    const vus = new Set<number>();
    for (let i = 0; i < 5000; i += 1) {
      const v = nextInt(rng, 10);
      expect(Number.isInteger(v) && v >= 0 && v < 10).toBe(true);
      vus.add(v);
    }
    expect(vus.size).toBe(10);
  });
});
