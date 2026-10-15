import type { Formation, Theatre } from '@nova/data';
import { describe, expect, it } from 'vitest';
import { createCombat } from '../src/combat';
import { autoPlacement } from '../src/formation';
import { tuning } from '../src/tuning';
import type { Command, Target } from '../src/types';
import { escouade } from './rules/helpers';

/**
 * SC-007 : 10 000 combats tires au hasard (graine, escouade, theatre, formation, commandes valides)
 * ne produisent aucune valeur invalide et se terminent avant la duree maximale. Le tirage des cas
 * est lui-meme reproductible (mulberry32 du test, Math.random exclu).
 */

const COMBATS = 10_000;
/** L'empreinte verifie que chaque champ est un entier signe sur 32 bits ; elle est echantillonnee. */
const ECHANTILLON = 64;

function mulberry32(graine: number): () => number {
  let etat = graine;
  return () => {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_FIXED = 2147483647;

describe('proprietes (SC-007)', () => {
  it(`${COMBATS} combats sans valeur invalide, tous finis avant 12 000 pas`, () => {
    const hasard = mulberry32(0x5c007);
    const entier = (n: number) => Math.floor(hasard() * n);
    const defauts: string[] = [];
    for (let i = 0; i < COMBATS; i += 1) {
      const squad = escouade(hasard() < 0.6 ? 'alpha' : 'bravo');
      const theatre: Theatre = hasard() < 0.5 ? 'orbital' : 'sol';
      const formation: Formation = hasard() < 0.5 ? 'ring' : 'arc';
      const placement = autoPlacement(squad, theatre, formation);
      const nbUnites = placement.length;
      const commandant = squad.id === 'alpha' ? 5 : 3;
      const commands: Command[] = [];
      let pas = 1;
      for (let k = entier(4); k > 0; k -= 1) {
        pas += 1 + entier(400);
        const skill = entier(commandant);
        const cibles: Record<string, Target | undefined> = {
          point: { kind: 'point', x: entier(tuning.arena.width), y: entier(tuning.arena.height) },
          unit: { kind: 'unit', id: 1 + entier(nbUnites) },
          enemy: { kind: 'enemy', id: nbUnites + 1 + entier(60) },
        };
        const besoin = squad.id === 'alpha' ? ['point', 'none', 'unit', 'none', 'unit'] : ['none'];
        const target = cibles[besoin[skill] ?? 'none'];
        commands.push(target ? { tick: pas, skill, target } : { tick: pas, skill });
      }
      const c = createCombat({
        seed: entier(4294967296),
        squad,
        theatre,
        formation,
        placement,
        planet: 'gemenon',
        commands,
      });
      while (c.result() === null) {
        c.step();
        const s = c.state;
        if (s.relic.hp < 0 || s.relic.hp > s.relic.maxHp)
          defauts.push(`#${i} relique ${s.relic.hp}`);
        for (const x of [...s.units, ...s.enemies]) {
          if (!(x.hp >= 0 && x.hp <= x.maxHp && x.maxHp <= MAX_FIXED)) {
            defauts.push(`#${i} pas ${s.tick} entite ${x.id} PV ${x.hp}/${x.maxHp}`);
          }
          if (!Number.isSafeInteger(x.x) || !Number.isSafeInteger(x.y)) {
            defauts.push(`#${i} pas ${s.tick} entite ${x.id} position ${x.x},${x.y}`);
          }
        }
        if (s.tick % ECHANTILLON === 0) c.fingerprint();
        if (defauts.length > 10) break;
      }
      expect(() => c.fingerprint()).not.toThrow();
      if (c.state.tick > tuning.maxTicks) defauts.push(`#${i} fini au pas ${c.state.tick}`);
      if (defauts.length > 10) break;
    }
    expect(defauts).toEqual([]);
  }, 300_000);
});
