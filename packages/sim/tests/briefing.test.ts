import {
  demoState,
  derivedValues,
  enemyArchetypes,
  planetById,
  type Squad,
  unlockedSquadIdSchema,
} from '@nova/data';
import { describe, expect, it } from 'vitest';
import { briefing, route, squadSummary, ultimateStatus } from '../src/briefing';
import { createCombat } from '../src/combat';
import { autoPlacement } from '../src/formation';
import { territoryGain } from '../src/planet';
import { wavesFor } from '../src/waves';

/**
 * Valeurs de briefing calculees par la sim (FR-033, SC-008, research R9) : egales a celles que la
 * maquette calcule (`derived.generated.json`, verifie contre la maquette par le test oracle de la
 * phase P0), pour chaque escouade deverrouillee. Seuls ecarts admis, verifies ici tels quels :
 * - compositions annoncees des vagues : libelles corriges des archetypes (FR-004) ;
 * - delai avant la vague suivante au premier instant du combat : "0:12" au lieu de "0:03"
 *   (Clarifications : une vague toutes les 12 s, la premiere des le debut).
 */

const cible = planetById(derivedValues.route.target);
if (!cible) throw new Error('planete visee introuvable');

const escouade = (id: string): Squad => {
  const s = demoState.squads.find((x) => x.id === id);
  if (!s) throw new Error(`escouade inconnue : ${id}`);
  return s;
};

describe.each(unlockedSquadIdSchema.options)('escouade %s', (id) => {
  it('synthese : emplacements, unites, puissance, armement, PV, attaque, defense', () => {
    expect(squadSummary(escouade(id))).toEqual(derivedValues.squads[id]);
  });

  it('simulation du Briefing : puissances, avantage, chances, contrainte', () => {
    expect(briefing(escouade(id), cible)).toEqual(derivedValues.briefing[id]);
  });
});

describe('planete visee', () => {
  it('trajet : distance, carburant, temps, vitesse, difficulte, butin, portee', () => {
    expect(route(cible)).toEqual(derivedValues.route);
  });

  it('gain de territoire', () => {
    expect(territoryGain(cible)).toBe(derivedValues.mission.territoryGain);
  });

  it('vagues : celles de la maquette, aux compositions corrigees pres (ecart admis)', () => {
    const vagues = wavesFor(cible);
    expect(vagues.map(({ composition, ...v }) => v)).toEqual(
      derivedValues.mission.waves.map(({ composition, ...v }) => v),
    );
    for (const v of vagues) expect(v.composition).toBe(enemyArchetypes[v.threat].composition);
  });

  it('delai avant la vague suivante au premier instant : 0:12 au lieu de 0:03 (ecart admis)', () => {
    expect(derivedValues.combat.nextWaveIn).toBe('0:03');
    const squad = escouade('alpha');
    const combat = createCombat({
      seed: 1,
      squad,
      theatre: 'orbital',
      formation: 'ring',
      placement: autoPlacement(squad, 'orbital', 'ring'),
      planet: cible.id,
      commands: [],
    });
    combat.step();
    const secondes = Math.ceil(combat.state.nextWaveIn / 20);
    expect(`0:${String(secondes).padStart(2, '0')}`).toBe('0:12');
  });
});

describe('ultime de palier', () => {
  it('niveau 47 : verrouille, prochain au niveau 50, progression 0,7', () => {
    expect(ultimateStatus(demoState.profile.level)).toEqual(derivedValues.combat.ultimate);
  });

  it('pret aux niveaux multiples de 10, prochain palier au-dela', () => {
    expect(ultimateStatus(50)).toEqual({ ready: true, level: 60, progress: 0 });
    expect(ultimateStatus(9)).toEqual({ ready: false, level: 10, progress: 0.9 });
  });
});
