import { demoState, type Formation, type SquadId, type Theatre } from '@nova/data';
import type { Placement } from '@nova/sim';
import * as regles from './deployment-rules';
import { selection } from './selection.svelte';

/**
 * Etat du plateau de deploiement (contracts/combat-runtime.md, data-model.md §4.1) : placement par
 * escouade, theatre et formation, interrupteur "Deploiement automatique" du Briefing, unite choisie
 * et glisser-deposer en cours. En memoire seulement : rien n'est sauvegarde.
 */

export interface Dragging {
  readonly unit: string;
  /** D'ou vient l'unite : la liste, ou le rang de son emplacement. */
  readonly from: 'list' | number;
  readonly x: number;
  readonly y: number;
}

let autoDeploy = $state(true);
let placements = $state<Record<string, Placement>>({});
let choisie = $state<string | null>(null);
let glissement = $state<Dragging | null>(null);

function comboDe(
  squadId: SquadId,
  theatre: Theatre,
  formation: Formation,
): regles.Combo | undefined {
  const squad = demoState.squads.find((s) => s.id === squadId);
  return squad ? { squad, theatre, formation } : undefined;
}

function courant(): regles.Combo | undefined {
  const { squad, theatre, formation } = selection.current;
  return comboDe(squad, theatre, formation[squad]);
}

function lire(c: regles.Combo): Placement {
  return placements[regles.comboKey(c)] ?? regles.initialPlacement(c, autoDeploy);
}

function ecrire(c: regles.Combo, p: Placement): void {
  placements = { ...placements, [regles.comboKey(c)]: p };
}

/** Applique une operation au placement courant ; une operation refusee ne change rien. */
function modifier(operation: (c: regles.Combo, p: Placement) => Placement | null): void {
  const c = courant();
  if (!c) return;
  const suivant = operation(c, lire(c));
  if (suivant) ecrire(c, suivant);
}

export const deployment = {
  get autoDeploy() {
    return autoDeploy;
  },
  setAutoDeploy(valeur: boolean) {
    autoDeploy = valeur;
  },
  get picked() {
    return choisie;
  },
  get dragging() {
    return glissement;
  },
  /** Placement courant (escouade, theatre et formation de la selection). */
  get current(): Placement {
    const c = courant();
    return c ? lire(c) : [];
  },
  /** Placement d'une combinaison : celui du joueur, sinon celui de la premiere arrivee (FR-041). */
  placementFor(squadId: SquadId, theatre: Theatre, formation: Formation): Placement {
    const c = comboDe(squadId, theatre, formation);
    return c ? lire(c) : [];
  },
  /** Le joueur a-t-il deja un placement pour cette combinaison ? */
  has(squadId: SquadId, theatre: Theatre, formation: Formation): boolean {
    const c = comboDe(squadId, theatre, formation);
    return c !== undefined && regles.comboKey(c) in placements;
  },
  /** A l'arrivee au Deploiement : memorise le placement initial s'il n'existe pas (FR-041). */
  ensure() {
    const c = courant();
    if (c && !(regles.comboKey(c) in placements)) ecrire(c, regles.initialPlacement(c, autoDeploy));
  },
  /** Choix d'une unite dans la liste ; la choisir de nouveau annule le choix. */
  pick(unite: string | null) {
    choisie = unite !== null && unite === choisie ? null : unite;
  },
  /** Clic sur un emplacement : retire son occupant, ou y pose l'unite choisie (FR-039). */
  activateSlot(rang: number) {
    const c = courant();
    if (!c) return;
    const p = lire(c);
    if (regles.occupant(p, rang) !== undefined) {
      ecrire(c, regles.removeAt(p, rang));
      return;
    }
    if (choisie === null) return;
    const suivant = regles.placeOn(c, p, choisie, rang);
    if (suivant) {
      ecrire(c, suivant);
      choisie = null;
    }
  },
  /** L'unite choisie peut-elle aller sur cet emplacement ? */
  canPlace(rang: number): boolean {
    const c = courant();
    return c !== undefined && choisie !== null && regles.canPlace(c, lire(c), choisie, rang);
  },
  removeUnit(unite: string) {
    modifier((_c, p) => regles.removeUnit(p, unite));
    if (choisie === unite) choisie = null;
  },
  startDrag(unite: string, from: 'list' | number, x: number, y: number) {
    glissement = { unit: unite, from, x, y };
    choisie = null;
  },
  moveDrag(x: number, y: number) {
    if (glissement) glissement = { ...glissement, x, y };
  },
  /** Fin du glisser-deposer : sur un emplacement (rang) ou ailleurs (`null`). */
  endDrag(rang: number | null) {
    const g = glissement;
    glissement = null;
    if (g) modifier((c, p) => regles.drop(c, p, g.unit, rang));
  },
  /** "Deploiement automatique" (FR-040). */
  auto() {
    modifier((c) => regles.initialPlacement(c, true));
    choisie = null;
  },
  /** "Tout retirer" (FR-040). */
  clear() {
    modifier(() => []);
    choisie = null;
  },
};
