import type { SimEvent } from '@nova/sim';
import { describe, expect, it } from 'vitest';
import {
  appendEvents,
  emptyLog,
  type LogContext,
  type LogState,
  MAX_LOG_LINES,
  openingLines,
} from '../../src/state/combat-log';

/** Journal du combat (FR-029) : messages de la maquette, 11 lignes, la plus recente en premier. */

const ctx: LogContext = {
  unitName: (id) => (id === 1 ? 'VIPER MK-VII' : id === 2 ? 'LANCIER-9' : undefined),
  weaponLabel: (id) => (id === 1 ? 'Laser' : id === 2 ? 'Nucléaire' : 'Artillerie'),
  skill: (rank) =>
    rank === 0
      ? { name: 'Frappe orbitale', description: 'Dégâts de zone sur un point choisi' }
      : undefined,
  advantageEveryTicks: 30,
};

const texte = (log: LogState) => log.lines.map((l) => l.parts.map((p) => p.text).join(''));

const vague = (tick: number, index: number, boss = false): SimEvent => ({
  type: 'wave',
  tick,
  index,
  boss,
  composition: boss ? 'Croiseur porte-nef' : 'Intercepteurs ×12',
});

describe('journal du combat', () => {
  it('ouvre sur le deploiement puis la formation, puis la vague 1 au-dessus', () => {
    let log = openingLines(emptyLog, 3, 'ring');
    log = appendEvents(log, [vague(0, 1)], ctx);
    expect(texte(log)).toEqual([
      'Vague 01 — Intercepteurs ×12',
      'Formation 360° · objectif au centre du dispositif',
      'Escouade déployée — 3 unités en position',
    ]);
    expect(log.lines.map((l) => l.tone)).toEqual(['', '', 'ok']);
  });

  it('marque le boss et sa destruction en or', () => {
    const log = appendEvents(
      emptyLog,
      [vague(1, 6, true), { type: 'death', tick: 2, id: 40, side: 'enemy', boss: true }],
      ctx,
    );
    expect(texte(log)).toEqual(['BOSS DÉTRUIT', 'Vague 06 — Croiseur porte-nef · BOSS']);
    expect(log.lines.every((l) => l.tone === 'gold')).toBe(true);
  });

  it('annonce la destruction d une unite du joueur', () => {
    const log = appendEvents(
      emptyLog,
      [{ type: 'death', tick: 3, id: 2, side: 'unit', boss: false }],
      ctx,
    );
    expect(texte(log)).toEqual(['LANCIER-9 détruit']);
    expect(log.lines[0]?.tone).toBe('crit');
  });

  it('signale l avantage d armement au plus une fois par 30 pas', () => {
    const coup = (tick: number): SimEvent[] => [
      { type: 'shot', tick, from: 1, to: 9, weapon: 'las', missed: false },
      { type: 'hit', tick, target: 9, damage: 1, multiplier: 88474 },
    ];
    let log = appendEvents(emptyLog, [...coup(10), ...coup(10)], ctx);
    log = appendEvents(log, coup(39), ctx);
    log = appendEvents(log, coup(40), ctx);
    expect(texte(log)).toEqual([
      'Avantage LASER ▸ ARTILLERIE ×1.35',
      'Avantage LASER ▸ ARTILLERIE ×1.35',
    ]);
    expect(log.lines[0]?.parts[1]).toEqual({ text: '×1.35', strong: true });
  });

  it('ignore l avantage d un ennemi et un multiplicateur neutre', () => {
    const log = appendEvents(
      emptyLog,
      [
        { type: 'shot', tick: 1, from: 9, to: 1, weapon: 'nuc', missed: false },
        { type: 'hit', tick: 1, target: 1, damage: 1, multiplier: 88474 },
        { type: 'shot', tick: 1, from: 1, to: 9, weapon: 'las', missed: false },
        { type: 'hit', tick: 1, target: 9, damage: 1, multiplier: 65536 },
      ],
      ctx,
    );
    expect(log.lines).toEqual([]);
  });

  it('decrit la competence utilisee, sans cible, ou le bonus de Pillage', () => {
    const log = appendEvents(
      emptyLog,
      [
        { type: 'skill', tick: 1, skill: 0, applied: true },
        { type: 'skill', tick: 2, skill: 0, applied: false, failure: 'no-target' },
        { type: 'skill', tick: 3, skill: 0, applied: true, bonus: 'loot' },
      ],
      ctx,
    );
    expect(texte(log)).toEqual([
      'FRAPPE ORBITALE — vague nettoyée, butin supplémentaire',
      'FRAPPE ORBITALE — aucune cible valide',
      'FRAPPE ORBITALE — Dégâts de zone sur un point choisi',
    ]);
    expect(log.lines[2]?.parts[0]).toEqual({ text: 'FRAPPE ORBITALE', strong: true });
  });

  it('garde 11 lignes au plus', () => {
    let log = emptyLog;
    for (let i = 1; i <= 15; i += 1) log = appendEvents(log, [vague(i, i)], ctx);
    expect(log.lines).toHaveLength(MAX_LOG_LINES);
    expect(texte(log)[0]).toBe('Vague 15 — Intercepteurs ×12');
    expect(new Set(log.lines.map((l) => l.id)).size).toBe(MAX_LOG_LINES);
  });
});
