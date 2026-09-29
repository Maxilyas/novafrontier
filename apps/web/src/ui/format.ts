/** Nombres a la francaise, comme `fr()` dans la maquette (ligne 862) : 128 400, 2 566. */
export const nombre = (n: number): string => n.toLocaleString('fr-FR');

/** Pourcentage d'une fraction (0,64 -> "64%"), pour les largeurs de jauge. */
export const pourcent = (fraction: number): string => `${Math.round(fraction * 1000) / 10}%`;
