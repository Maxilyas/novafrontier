import { writeFileSync } from 'node:fs';
import { demoState, type Formation, type Squad, type Theatre } from '@nova/data';
import { it } from 'vitest';
import { runCombat } from '../src/combat';
import { toFixed } from '../src/fixed';
import { autoPlacement, formationSlots } from '../src/formation';
import type { Command, Placement } from '../src/types';
import type { GoldenCombat } from '../tests/golden/golden';

/**
 * Regenere tests/golden/combats.json (research R11, FR-023). Lance seulement par
 * `pnpm --filter @nova/sim golden:update`, pour ASSUMER un changement de regle : le diff du fichier
 * montre alors quels combats ont change. Jamais pour faire passer un test.
 *
 * 120 combats : Alpha (20 graines) et Bravo (10 graines), deux theatres, deux formations. Selon la
 * graine, un tiers sans commande, un tiers avec un journal de commandes (toutes les competences de
 * Vell ou de Tallow, ciblees comprises), un tiers avec un placement manuel.
 */

const THEATRES: readonly Theatre[] = ['orbital', 'sol'];
const FORMATIONS: readonly Formation[] = ['ring', 'arc'];
const PLANETE = 'gemenon';

const escouade = (id: string): Squad => {
  const s = demoState.squads.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};

/** Journal couvrant toute la barre d'actions du commandant, cibles comprises. */
function journal(squadId: string, formation: Formation, graine: number): Command[] {
  const relique = formation === 'ring' ? { x: 800, y: 408 } : { x: 1200, y: 408 };
  const decalage = (graine % 5) * 20;
  if (squadId === 'alpha') {
    return [
      {
        tick: 90 + decalage,
        skill: 0,
        target: {
          kind: 'point',
          x: toFixed(relique.x - 180 - decalage),
          y: toFixed(relique.y - 40),
        },
      },
      { tick: 150 + decalage, skill: 1 },
      { tick: 260 + decalage, skill: 2, target: { kind: 'unit', id: 1 } },
      { tick: 300 + decalage, skill: 3 },
      { tick: 480 + decalage, skill: 4, target: { kind: 'unit', id: 2 } },
    ];
  }
  return [
    { tick: 110 + decalage, skill: 0 },
    { tick: 140 + decalage, skill: 1 },
    { tick: 250 + decalage, skill: 2 },
  ];
}

/**
 * Placement manuel valide : chaque unite du placement automatique passe sur le dernier emplacement
 * libre de son type (de la seconde ligne vers la premiere), et la derniere unite reste hors du
 * plateau quand il y en a plusieurs.
 */
function placementManuel(squad: Squad, theatre: Theatre, formation: Formation): Placement {
  const auto = autoPlacement(squad, theatre, formation);
  const slots = [...formationSlots(formation, theatre)].reverse();
  const pris = new Set<number>();
  const engages = auto.length > 1 ? auto.slice(0, -1) : auto;
  return engages
    .map((p) => {
      const actuel = formationSlots(formation, theatre).find((s) => s.index === p.slot);
      const libre = slots.find((s) => s.kind === actuel?.kind && !pris.has(s.index));
      if (!libre) throw new Error(`aucun emplacement pour ${p.unit}`);
      pris.add(libre.index);
      return { unit: p.unit, slot: libre.index };
    })
    .sort((a, b) => a.slot - b.slot);
}

it('regenere tests/golden/combats.json', () => {
  const combats: GoldenCombat[] = [];
  for (const [squadId, graines] of [
    ['alpha', 20],
    ['bravo', 10],
  ] as const) {
    const squad = escouade(squadId);
    for (const theatre of THEATRES) {
      for (const formation of FORMATIONS) {
        for (let seed = 1; seed <= graines; seed += 1) {
          const variante = (seed - 1) % 3;
          const commands = variante === 1 ? journal(squadId, formation, seed) : [];
          const placement =
            variante === 2
              ? placementManuel(squad, theatre, formation)
              : autoPlacement(squad, theatre, formation);
          const suffixe = variante === 1 ? '-commandes' : variante === 2 ? '-placement' : '';
          const setup = { seed, squad, theatre, formation, placement, planet: PLANETE, commands };
          const r = runCombat(setup);
          combats.push({
            name: `${squadId}-${theatre}-${formation}-${seed}${suffixe}`,
            setup: {
              seed,
              squad: squadId,
              theatre,
              formation,
              placement,
              planet: PLANETE,
              commands,
            },
            expected: { outcome: r.outcome, ticks: r.ticks, fingerprint: r.fingerprint },
          });
        }
      }
    }
  }
  combats.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(
    new URL('../tests/golden/combats.json', import.meta.url),
    `${JSON.stringify(combats, null, 2)}\n`,
  );
});
