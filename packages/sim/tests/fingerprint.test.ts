import { describe, expect, it } from 'vitest';
import { fingerprint } from '../src/fingerprint';

/** Empreinte FNV-1a sur deux voies de 32 bits (research R7). */

describe('empreinte', () => {
  it('rend 16 chiffres hexadecimaux minuscules', () => {
    expect(fingerprint([1, 2, 3])).toMatch(/^[0-9a-f]{16}$/);
    expect(fingerprint([])).toMatch(/^[0-9a-f]{16}$/);
  });

  it('meme suite de mots, meme empreinte', () => {
    expect(fingerprint([0, -1, 2_147_483_647, -2_147_483_648])).toBe(
      fingerprint([0, -1, 2_147_483_647, -2_147_483_648]),
    );
  });

  it('un mot change, l empreinte change', () => {
    const base = [10, 20, 30, 40];
    const vues = new Set([fingerprint(base)]);
    for (let i = 0; i < base.length; i += 1) {
      const autre = [...base];
      autre[i] = (autre[i] ?? 0) + 1;
      vues.add(fingerprint(autre));
    }
    vues.add(fingerprint([20, 10, 30, 40]));
    expect(vues.size).toBe(6);
  });

  it('refuse un mot non entier ou hors des entiers signes sur 32 bits', () => {
    expect(() => fingerprint([1.5])).toThrow();
    expect(() => fingerprint([2 ** 31])).toThrow();
    expect(() => fingerprint([Number.NaN])).toThrow();
  });
});
