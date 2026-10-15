import { describe, expect, it } from 'vitest';
import { fitInto, toLogical, toZone } from '../../src/scene/scenes/fit';

const ARENE = { width: 1600, height: 816 };

describe('mise a l echelle des scenes', () => {
  it('tient entiere dans une zone plus large, centree horizontalement', () => {
    const fit = fitInto(ARENE, { width: 2000, height: 816 });
    expect(fit.scale).toBe(1);
    expect(fit.offsetX).toBe(200);
    expect(fit.offsetY).toBe(0);
  });

  it('tient entiere dans une zone plus haute, centree verticalement', () => {
    const fit = fitInto(ARENE, { width: 800, height: 900 });
    expect(fit.scale).toBe(0.5);
    expect(fit.offsetX).toBe(0);
    expect(fit.offsetY).toBe(246);
  });

  it('garde le rapport et revient au point de depart', () => {
    const fit = fitInto(ARENE, { width: 1333, height: 777 });
    const zone = toZone(fit, 800, 408);
    expect(zone.x).toBeCloseTo(1333 / 2, 6);
    expect(zone.y).toBeCloseTo(777 / 2, 6);
    const retour = toLogical(fit, zone.x, zone.y);
    expect(retour.x).toBeCloseTo(800, 9);
    expect(retour.y).toBeCloseTo(408, 9);
  });
});
