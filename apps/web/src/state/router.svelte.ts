import { unitById } from '@nova/data';
import { NAV_SECTION, parseHash, type Route, readParams, toHash } from './routes';

/** Routeur par fragment d'URL (contracts/routes.md) : Precedent, rechargement et adresse directe. */

const lire = () => parseHash(window.location.hash, (id) => unitById(id) !== undefined);

let courante = $state<Route>(lire().route);
/** Debut du changement d'ecran en cours et duree du dernier, pour le badge de diagnostic. */
let debutChangement: number | undefined;
let derniereDuree = $state<number | undefined>(undefined);

export const router = {
  get route(): Route {
    return courante;
  },
  get section() {
    return NAV_SECTION[courante.screen];
  },
  /** Duree du dernier changement d'ecran, de l'adresse au montage du nouvel ecran (SC-004). */
  get lastTransitionMs(): number | undefined {
    return derniereDuree;
  },
};

/** Appele par la zone des ecrans une fois le nouvel ecran monte. */
export function screenMounted(): void {
  if (debutChangement === undefined) return;
  derniereDuree = performance.now() - debutChangement;
  debutChangement = undefined;
}

/** Parametres de diagnostic, fixes pour la session. */
export const urlParams = readParams(window.location.search);

function synchroniser(): void {
  const { route, canonical } = lire();
  if (window.location.hash !== canonical) {
    // Adresse vide ou inconnue : remplacee sans nouvelle entree d'historique.
    history.replaceState(history.state, '', canonical);
  }
  if (route.screen !== courante.screen) debutChangement = performance.now();
  courante = route;
}

/** Demarre l'ecoute de l'adresse ; renvoie la fonction d'arret. */
export function startRouter(): () => void {
  synchroniser();
  window.addEventListener('hashchange', synchroniser);
  return () => window.removeEventListener('hashchange', synchroniser);
}

/**
 * Change d'ecran : une entree d'historique, aucune si l'adresse est deja la bonne. `replace`
 * remplace l'adresse sans entree d'historique : choisir une unite dans l'Atlas n'est pas un
 * changement d'ecran, mais l'adresse doit la designer pour le rechargement (FR-006).
 */
export function navigate(route: Route, { replace = false }: { replace?: boolean } = {}): void {
  const cible = toHash(route);
  if (window.location.hash === cible) return;
  if (replace) {
    history.replaceState(history.state, '', cible);
    synchroniser();
  } else {
    window.location.hash = cible;
  }
}

export { toHash };
