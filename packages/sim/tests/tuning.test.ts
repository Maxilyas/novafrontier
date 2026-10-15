import { describe, expect, it } from 'vitest';
import { toFixed } from '../src/fixed';
import { ticksOf, tuning } from '../src/tuning';

/** Table de research R5 : durees en pas de 50 ms, vitesses par pas. */

describe('durees en pas', () => {
  it.each([
    ['recharge d une unite', tuning.cooldown.unit, 11],
    ['recharge ennemie contre une unite', tuning.cooldown.enemyVsUnit, 14],
    ['recharge ennemie contre la relique', tuning.cooldown.enemyVsRelic, 16],
    ['delai entre deux vagues', tuning.waveInterval, 240],
    ['duree maximale', tuning.maxTicks, 12000],
    ['espacement du message d avantage', tuning.advantageLogTicks, 30],
  ])('%s', (_nom, valeur, attendu) => {
    expect(valeur).toBe(attendu);
  });

  it('convertit les durees des competences', () => {
    expect(ticksOf(7000)).toBe(140);
    expect(ticksOf(4000)).toBe(80);
    expect(ticksOf(6000)).toBe(120);
    expect(ticksOf(8000)).toBe(160);
  });
});

describe('vitesses par pas', () => {
  it.each([
    ['l', 3.825],
    ['m', 2.7],
    ['h', 1.89],
    ['b', 1.08],
  ] as const)('menace %s', (menace, parPas) => {
    expect(tuning.archetypes[menace].speed).toBe(toFixed(parPas));
  });
});

describe('positions et secteurs', () => {
  it('reprend la relique et les secteurs d apparition de la maquette', () => {
    expect(tuning.relicPosition.ring).toEqual({ x: toFixed(800), y: toFixed(408) });
    expect(tuning.relicPosition.arc).toEqual({ x: toFixed(1200), y: toFixed(408) });
    expect(tuning.spawn.sector.ring.full).toBe(true);
    expect(tuning.spawn.sector.arc).toEqual({ center: 512, halfWidth: 122, full: false });
  });

  it('place les lignes de la formation a 360 degres sur des angles exacts', () => {
    expect(tuning.slots.ring.front.angles).toEqual([-256, -128, 0, 128, 256, 384, 512, 640]);
    expect(tuning.slots.ring.back.angles).toEqual([-192, -64, 64, 192, 320, 448, 576, 704]);
  });

  it('convertit la matrice d armement', () => {
    expect(tuning.matrix.las.art).toBe(toFixed(1.35));
    expect(tuning.matrix.art.las).toBe(toFixed(0.75));
    expect(tuning.matrix.nuc.nuc).toBe(65536);
  });
});
