import {
  type ActionPointsMode,
  type ActiveWeaponId,
  type BuildingId,
  demoState,
  type Formation,
  researchTrees,
  type SquadId,
  type Theatre,
  type Unit,
  type UnitFamily,
} from '@nova/data';
import * as regles from './selection-rules';

/** Etat de consultation partage entre les ecrans (data-model.md §5), en memoire seulement. */

let etat = $state(regles.initialSelection(demoState));

export const selection = {
  get current(): Readonly<regles.Selection> {
    return etat;
  },
  selectSquad(id: SquadId) {
    etat = regles.selectSquad(etat, id, demoState);
  },
  pickEmptySlot(famille: UnitFamily) {
    etat = regles.pickEmptySlot(etat, famille);
  },
  setRosterFilter(famille: UnitFamily) {
    etat = { ...etat, rosterFilter: famille };
  },
  setActionPointsMode(mode: ActionPointsMode) {
    etat = { ...etat, actionPointsMode: mode };
  },
  setFormation(formation: Formation) {
    etat = regles.setFormation(etat, etat.squad, formation);
  },
  setTheatre(theatre: Theatre) {
    etat = { ...etat, theatre };
  },
  openAtlas(unite: Unit) {
    etat = regles.openAtlas(etat, unite);
  },
  setAtlasTier(tier: number) {
    etat = { ...etat, atlas: { ...etat.atlas, tier } };
  },
  setAtlasWeapon(weapon: ActiveWeaponId) {
    etat = { ...etat, atlas: { ...etat.atlas, weapon } };
  },
  selectBuilding(id: BuildingId) {
    etat = { ...etat, building: id };
  },
  selectTree(id: string) {
    const arbre = researchTrees.find((t) => t.id === id);
    if (arbre) etat = regles.selectTree(etat, arbre);
  },
  selectNode(id: string) {
    etat = { ...etat, node: id };
  },
};
