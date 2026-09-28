/**
 * Message bref de la maquette (toast(), lignes 2430-2434) : un seul a la fois, 2,6 s
 * (research R12).
 */

export const LATER_PHASE_MESSAGE = 'Pas encore disponible';
const DUREE_MS = 2600;

let courant = $state<{ text: string; seq: number } | null>(null);
let minuteur: ReturnType<typeof setTimeout> | undefined;
let sequence = 0;

export const toast = {
  get current() {
    return courant;
  },
};

export function showToast(text: string): void {
  sequence += 1;
  courant = { text, seq: sequence };
  clearTimeout(minuteur);
  minuteur = setTimeout(() => {
    courant = null;
  }, DUREE_MS);
}
