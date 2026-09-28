import type {
  ActionPointsMode,
  ActiveWeaponId,
  BuildingId,
  DemoState,
  Formation,
  ResearchTree,
  ResearchTreeId,
  SquadId,
  Theatre,
  Unit,
  UnitFamily,
  UnlockedSquadId,
} from '@nova/data';

/**
 * Etat de consultation (data-model.md §5) : regles pures. Rien n'est sauvegarde ; tout repart des
 * valeurs par defaut au rechargement (FR-014).
 */
export interface Selection {
  /** Toujours une escouade jouable : les escouades verrouillees ne se choisissent pas. */
  squad: UnlockedSquadId;
  rosterFilter: UnitFamily;
  actionPointsMode: ActionPointsMode;
  formation: Record<SquadId, Formation>;
  theatre: Theatre;
  atlas: { unit: string; tier: number; weapon: ActiveWeaponId };
  building: BuildingId;
  tree: ResearchTreeId;
  node: string;
}

export function initialSelection(demo: DemoState): Selection {
  const d = demo.defaults;
  return {
    squad: d.squad,
    rosterFilter: d.rosterFilter,
    actionPointsMode: d.actionPointsMode,
    formation: Object.fromEntries(demo.squads.map((s) => [s.id, s.defaultFormation])) as Record<
      SquadId,
      Formation
    >,
    theatre: d.theatre,
    atlas: { ...d.atlas },
    building: d.building,
    tree: d.tree,
    node: d.node,
  };
}

/**
 * Escouade jouable : sans grade requis. Les invariants de @nova/data garantissent que ce sont
 * exactement les escouades de `UnlockedSquadId`.
 */
export function isUnlockedSquad(id: SquadId, demo: DemoState): id is UnlockedSquadId {
  const escouade = demo.squads.find((x) => x.id === id);
  return escouade !== undefined && escouade.lockedUntilRank === undefined;
}

/** Choisir une escouade verrouillee ne change rien. */
export function selectSquad(s: Selection, id: SquadId, demo: DemoState): Selection {
  return isUnlockedSquad(id, demo) ? { ...s, squad: id } : s;
}

/** Choisir un emplacement vide fixe le filtre des effectifs a sa famille. */
export function pickEmptySlot(s: Selection, famille: UnitFamily): Selection {
  return { ...s, rosterFilter: famille };
}

/**
 * Ouvrir l'Atlas sur une unite. Comme la maquette (ligne 1323), un vaisseau ou un meca aligne le
 * palier et l'arme sur l'unite ; un commandant remet le palier a 1 et garde l'arme.
 */
export function openAtlas(s: Selection, unite: Unit): Selection {
  if (unite.family === 'cmd') return { ...s, atlas: { ...s.atlas, unit: unite.id, tier: 1 } };
  return { ...s, atlas: { unit: unite.id, tier: unite.tier, weapon: unite.weapon } };
}

/** Changer d'arbre selectionne son premier noeud (maquette, ligne 1631). */
export function selectTree(s: Selection, arbre: ResearchTree): Selection {
  return { ...s, tree: arbre.id, node: arbre.nodes[0]?.id ?? s.node };
}

/** La formation est propre a chaque escouade et partagee entre les ecrans (FR-016). */
export function setFormation(s: Selection, squad: SquadId, formation: Formation): Selection {
  return { ...s, formation: { ...s.formation, [squad]: formation } };
}
