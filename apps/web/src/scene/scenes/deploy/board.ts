import type { Formation, Theatre } from '@nova/data';

/**
 * Ce que la scene du plateau doit montrer : formation et theatre choisis. L'ecran Deploiement le
 * met a jour ; la scene se redessine a chaque changement, meme quand elle ne s'anime pas
 * (animations reduites). Elle ne lit pas les stores Svelte (principe III).
 */
export const board = {
  formation: 'ring' as Formation,
  theatre: 'orbital' as Theatre,
  version: 0,
};

const ecoutes = new Set<() => void>();

export function setBoard(formation: Formation, theatre: Theatre): void {
  if (board.formation === formation && board.theatre === theatre) return;
  board.formation = formation;
  board.theatre = theatre;
  board.version += 1;
  for (const ecoute of ecoutes) ecoute();
}

/** Abonnement aux changements ; renvoie la desinscription. */
export function onBoardChange(ecoute: () => void): () => void {
  ecoutes.add(ecoute);
  return () => ecoutes.delete(ecoute);
}
