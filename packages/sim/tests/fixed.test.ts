import { describe, expect, it } from 'vitest';
import {
  distSq256,
  FIXED_ONE,
  fdiv,
  fmul,
  fromFixed,
  isqrt,
  rangeSq256,
  toFixed,
} from '../src/fixed';

/** Arithmetique en virgule fixe 16.16 (research R2). */

describe('conversions', () => {
  it('arrondit au 1/65536 le plus proche', () => {
    expect(FIXED_ONE).toBe(65536);
    expect(toFixed(1.35)).toBe(88474);
    expect(toFixed(0.72)).toBe(47186);
    expect(toFixed(-1.5)).toBe(-98304);
    expect(fromFixed(toFixed(420))).toBe(420);
  });
});

describe('produit et quotient', () => {
  it('tronquent vers zero', () => {
    expect(fmul(toFixed(1.5), toFixed(2))).toBe(toFixed(3));
    expect(fmul(3, 3)).toBe(0);
    expect(fmul(-3, FIXED_ONE / 2)).toBe(-1);
    expect(fdiv(toFixed(3), toFixed(2))).toBe(toFixed(1.5));
    expect(fdiv(1, 3)).toBe(21845);
    expect(fdiv(-1, 3)).toBe(-21845);
  });
});

describe('racine entiere', () => {
  it('vaut floor(sqrt(n)) de 0 a 1e6', () => {
    const fausses: number[] = [];
    for (let n = 0; n <= 1_000_000; n += 1) {
      const r = isqrt(n);
      if (r * r > n || (r + 1) * (r + 1) <= n) fausses.push(n);
    }
    expect(fausses).toEqual([]);
  });

  it('est exacte sur de grands carres et leurs voisins, jusqu a 2^52', () => {
    for (let k = 2 ** 20; k < 2 ** 26; k += 999_983) {
      expect(isqrt(k * k)).toBe(k);
      expect(isqrt(k * k - 1)).toBe(k - 1);
      expect(isqrt(k * k + 2 * k)).toBe(k);
    }
  });
});

describe('distances au 1/256', () => {
  it('compare exactement sur la diagonale de l arene', () => {
    const d2 = distSq256(0, 0, toFixed(1600), toFixed(816));
    expect(d2).toBe((1600 * 256) ** 2 + (816 * 256) ** 2);
    expect(Number.isSafeInteger(d2)).toBe(true);
  });

  it('une portee couvre exactement sa distance', () => {
    expect(distSq256(0, 0, toFixed(110), 0)).toBe(rangeSq256(toFixed(110)));
    expect(distSq256(0, 0, toFixed(110) + 256, 0)).toBeGreaterThan(rangeSq256(toFixed(110)));
  });

  it('supporte les coordonnees negatives', () => {
    expect(distSq256(toFixed(-30), toFixed(-40), 0, 0)).toBe(rangeSq256(toFixed(50)));
  });
});
