/**
 * Parametres de l'equipe lus dans `location.search` (contracts/combat-runtime.md, research R14).
 * Sans parametre, aucun de ces outils n'est visible des joueurs ; une valeur invalide est ignoree.
 */
export interface TeamParams {
  /** Graine imposee aux combats et aux resolutions automatiques (FR-022). */
  readonly seed: number | undefined;
  /** Badge de diagnostic et releve de mesures (FR-035). */
  readonly diag: boolean;
  /** Scenario de charge sur l'ecran Combat (FR-036). */
  readonly charge: boolean;
}

const MAX_U32 = 4294967295;

export function readTeamParams(search: string): TeamParams {
  const params = new URLSearchParams(search);
  const brute = params.get('graine');
  const graine = brute !== null && /^\d{1,10}$/.test(brute) ? Number(brute) : undefined;
  return {
    seed: graine !== undefined && graine <= MAX_U32 ? graine : undefined,
    diag: params.get('diag') === '1',
    charge: params.get('charge') === '1',
  };
}

/** Parametres de la session, fixes jusqu'au rechargement. */
export const teamParams: TeamParams = readTeamParams(
  typeof location === 'undefined' ? '' : location.search,
);
