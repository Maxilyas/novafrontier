import type { ScreenId } from '@nova/data';

/**
 * Adresses des ecrans : logique pure, sans effet de bord (contracts/routes.md, research R3).
 * Format : `#/<ecran>[/<parametre>]` dans le fragment de l'URL.
 */

export type NavSection = 'escouades' | 'base' | 'recherche' | 'carte' | 'butin';

export interface Route {
  screen: ScreenId;
  /** Unite ouverte dans l'Atlas. */
  unit?: string | undefined;
}

export const SCREENS: readonly ScreenId[] = [
  'escouades',
  'atlas',
  'base',
  'recherche',
  'carte',
  'briefing',
  'deploiement',
  'combat',
  'butin',
];

/** Entree de la navigation principale mise en evidence pour chaque ecran (FR-003). */
export const NAV_SECTION: Readonly<Record<ScreenId, NavSection>> = {
  escouades: 'escouades',
  atlas: 'escouades',
  base: 'base',
  recherche: 'recherche',
  carte: 'carte',
  briefing: 'carte',
  deploiement: 'carte',
  combat: 'carte',
  butin: 'butin',
};

export const DEFAULT_SCREEN: ScreenId = 'escouades';
export const DEFAULT_ATLAS_UNIT = 's1';

const estEcran = (valeur: string): valeur is ScreenId =>
  (SCREENS as readonly string[]).includes(valeur);

export function toHash(route: Route): string {
  return route.screen === 'atlas'
    ? `#/atlas/${route.unit ?? DEFAULT_ATLAS_UNIT}`
    : `#/${route.screen}`;
}

/**
 * Lit un fragment d'URL. `canonical` est l'adresse a afficher : si elle differe du fragment lu,
 * l'appelant la substitue sans nouvelle entree d'historique (adresse vide ou inconnue, unite
 * inconnue).
 */
export function parseHash(
  hash: string,
  unitExists: (id: string) => boolean,
): { route: Route; canonical: string } {
  const [ecran = '', parametre] = hash.replace(/^#\/?/, '').split('/');
  let route: Route;
  if (!estEcran(ecran)) {
    route = { screen: DEFAULT_SCREEN };
  } else if (ecran === 'atlas') {
    route = {
      screen: 'atlas',
      unit: parametre && unitExists(parametre) ? parametre : DEFAULT_ATLAS_UNIT,
    };
  } else {
    route = { screen: ecran };
  }
  return { route, canonical: toHash(route) };
}

/** Parametres de diagnostic lus dans `location.search` (contracts/scene-host.md). */
export function readParams(search: string): { diag: boolean; forceWebgl: boolean } {
  const params = new URLSearchParams(search);
  return { diag: params.get('diag') === '1', forceWebgl: params.get('rendu') === 'webgl' };
}
