import { deployment } from '../../state/deployment.svelte';

/**
 * Glisser-deposer du plateau (FR-039, research R18), en Pointer Events : une ligne de la liste ou un
 * emplacement occupe se fait glisser vers un emplacement. Le glissement commence au-dela de 4 px ;
 * en deca, c'est un clic ordinaire. Le clic qui suit un depot est absorbe.
 */

const SEUIL = 4;

export interface Source {
  readonly unit: string;
  readonly from: 'list' | number;
}

/** Rang de l'emplacement sous le pointeur, ou `null`. */
function emplacementSous(x: number, y: number): number | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const slot = el.closest<HTMLElement>('[data-slot]');
    if (slot) return Number(slot.dataset.slot);
  }
  return null;
}

/** Absorbe le prochain clic : celui que le navigateur emet a la fin d'un glissement. */
function absorberLeClic(): void {
  const absorbe = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };
  window.addEventListener('click', absorbe, { capture: true, once: true });
  // Si aucun clic ne suit (relache hors de l'element), l'ecoute ne doit pas survivre.
  setTimeout(() => window.removeEventListener('click', absorbe, { capture: true }), 0);
}

/** Action Svelte : `use:glissable={{ unit, from }}` ; `null` desactive le glissement. */
export function glissable(node: HTMLElement, initiale: Source | null) {
  let source = initiale;
  let depart: { x: number; y: number; id: number } | undefined;
  let enCours = false;

  function bas(e: PointerEvent) {
    if (!source || e.button !== 0) return;
    depart = { x: e.clientX, y: e.clientY, id: e.pointerId };
    enCours = false;
  }

  function bouge(e: PointerEvent) {
    if (!source || !depart || e.pointerId !== depart.id) return;
    if (!enCours) {
      if (Math.hypot(e.clientX - depart.x, e.clientY - depart.y) < SEUIL) return;
      enCours = true;
      node.setPointerCapture(e.pointerId);
      deployment.startDrag(source.unit, source.from, e.clientX, e.clientY);
    }
    deployment.moveDrag(e.clientX, e.clientY);
  }

  function haut(e: PointerEvent) {
    if (!depart || e.pointerId !== depart.id) return;
    depart = undefined;
    if (!enCours) return;
    enCours = false;
    if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
    deployment.endDrag(emplacementSous(e.clientX, e.clientY));
    absorberLeClic();
  }

  function annule() {
    depart = undefined;
    if (enCours) deployment.endDrag(null);
    enCours = false;
  }

  node.addEventListener('pointerdown', bas);
  node.addEventListener('pointermove', bouge);
  node.addEventListener('pointerup', haut);
  node.addEventListener('pointercancel', annule);
  return {
    update(suivante: Source | null) {
      source = suivante;
    },
    destroy() {
      node.removeEventListener('pointerdown', bas);
      node.removeEventListener('pointermove', bouge);
      node.removeEventListener('pointerup', haut);
      node.removeEventListener('pointercancel', annule);
    },
  };
}
