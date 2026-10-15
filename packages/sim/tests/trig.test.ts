import { describe, expect, it } from 'vitest';
import { cos, radiansToAngle, sin } from '../src/trig';
import { QUARTER_SINE } from '../src/trig-table';

/** Table trigonometrique commitee (research R3) : Math.sin est permis dans les tests. */

describe('table d un quart de tour', () => {
  it('compte 257 valeurs egales a round(sin x 65536)', () => {
    expect(QUARTER_SINE).toHaveLength(257);
    QUARTER_SINE.forEach((v, i) => {
      expect(v, `indice ${i}`).toBe(Math.round(Math.sin((i * Math.PI) / 512) * 65536));
    });
  });
});

describe('sin et cos en 1/1024 de tour', () => {
  it('donnent les valeurs remarquables', () => {
    expect(sin(0)).toBe(0);
    expect(sin(256)).toBe(65536);
    expect(sin(512)).toBe(0);
    expect(sin(768)).toBe(-65536);
    expect(cos(0)).toBe(65536);
    expect(cos(256)).toBe(0);
    expect(cos(512)).toBe(-65536);
  });

  it('suivent Math.sin a un ulp 16.16 pres, angles negatifs et superieurs a un tour compris', () => {
    for (let a = -2048; a <= 2048; a += 7) {
      const attendu = Math.sin((a * Math.PI) / 512) * 65536;
      expect(Math.abs(sin(a) - attendu)).toBeLessThanOrEqual(1);
      expect(Math.abs(cos(a) - Math.cos((a * Math.PI) / 512) * 65536)).toBeLessThanOrEqual(1);
    }
  });

  it('convertit des radians au 1/1024 de tour le plus proche', () => {
    expect(radiansToAngle(Math.PI)).toBe(512);
    expect(radiansToAngle(-Math.PI / 2)).toBe(-256);
    expect(radiansToAngle(0.75)).toBe(122);
  });
});
