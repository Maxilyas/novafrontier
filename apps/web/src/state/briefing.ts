import { demoState, planetById, type Squad, type SquadId } from '@nova/data';
import { briefing, route, squadSummary, territoryGain, ultimateStatus, wavesFor } from '@nova/sim';

/**
 * Valeurs de briefing de la mission de demonstration, calculees par les regles de @nova/sim
 * (FR-033, research R9) : synthese des escouades (Escouades), trajet (Carte), simulation et vagues
 * (Briefing, Deploiement, Combat), ultime de palier. Les vagues annoncees sont celles que le combat
 * fait apparaitre (FR-034).
 */

const cible = planetById(demoState.mission.target);
if (!cible) throw new Error(`planete visee introuvable : ${demoState.mission.target}`);

/** Planete visee, trajet, vagues et revenu du territoire : fixes tant que la carte n'existe pas. */
export const mission = {
  planet: cible,
  route: route(cible),
  waves: wavesFor(cible),
  territoryGain: territoryGain(cible),
};

/** Ultime de palier au niveau du joueur. */
export const ultimate = ultimateStatus(demoState.profile.level);

function escouade(id: SquadId): Squad {
  const s = demoState.squads.find((x) => x.id === id);
  if (!s) throw new Error(`escouade inconnue : ${id}`);
  return s;
}

/** Synthese d'une escouade : puissance, armement dominant, effectifs, PV, attaque, defense. */
export const summaryOf = (id: SquadId) => squadSummary(escouade(id));

/** Simulation du Briefing d'une escouade contre la planete visee. */
export const briefingOf = (id: SquadId) => briefing(escouade(id), cible);
