import { SvelteSet } from 'svelte/reactivity';

/**
 * Registre des visuels deja rendus, comme le cache `ATLAS` de la maquette (art(), ligne 894) :
 * il alimente la pastille "ATLAS — N VISUELS EN CACHE" de l'Atlas. Les illustrations sont des
 * composants rendus sans chargement : aucun rechargement visible au retour sur un ecran (FR-010).
 */
const cles = new SvelteSet<string>();

export const visualRegistry = {
  get size() {
    return cles.size;
  },
};

export function registerVisual(cle: string): void {
  cles.add(cle);
}
