import type { Planet } from '@nova/data';
import { difficulty } from './planet';
import { tuning } from './tuning';
import type { WaveSpec } from './types';

/**
 * Vagues d'une planete (`wavesFor`, lignes 1806-1814) : deux par niveau de difficulte, le boss a la
 * derniere. Armement : nucleaire pour le boss, laser aux rangs impairs, artillerie aux pairs.
 * Menace : boss, puis lourde tous les trois rangs, moyenne aux rangs pairs, legere sinon. La
 * composition annoncee est celle de l'archetype (libelles corriges, FR-004).
 */
export function wavesFor(planet: Planet): readonly WaveSpec[] {
  const total = difficulty(planet) * 2;
  return Array.from({ length: total }, (_, i) => {
    const index = i + 1;
    const boss = index === total;
    const threat = boss ? 'b' : index % 3 === 0 ? 'h' : index % 2 === 0 ? 'm' : 'l';
    return {
      index,
      boss,
      composition: tuning.archetypes[threat].composition,
      weapon: boss ? 'nuc' : index % 2 === 1 ? 'las' : 'art',
      threat,
    };
  });
}
