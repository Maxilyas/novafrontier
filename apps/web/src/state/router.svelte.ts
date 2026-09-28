import { unitById } from '@nova/data';
import { NAV_SECTION, parseHash, type Route, readParams, toHash } from './routes';

/** Routeur par fragment d'URL (contracts/routes.md) : Precedent, rechargement et adresse directe. */

const lire = () => parseHash(window.location.hash, (id) => unitById(id) !== undefined);

let courante = $state<Route>(lire().route);

export const router = {
  get route(): Route {
    return courante;
  },
  get section() {
    return NAV_SECTION[courante.screen];
  },
};

/** Parametres de diagnostic, fixes pour la session. */
export const urlParams = readParams(window.location.search);

function synchroniser(): void {
  const { route, canonical } = lire();
  if (window.location.hash !== canonical) {
    // Adresse vide ou inconnue : remplacee sans nouvelle entree d'historique.
    history.replaceState(history.state, '', canonical);
  }
  courante = route;
}

/** Demarre l'ecoute de l'adresse ; renvoie la fonction d'arret. */
export function startRouter(): () => void {
  synchroniser();
  window.addEventListener('hashchange', synchroniser);
  return () => window.removeEventListener('hashchange', synchroniser);
}

/** Change d'ecran : une entree d'historique, aucune si l'adresse est deja la bonne. */
export function navigate(route: Route): void {
  const cible = toHash(route);
  if (window.location.hash !== cible) window.location.hash = cible;
}

export { toHash };
