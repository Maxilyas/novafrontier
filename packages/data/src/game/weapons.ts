import type { DamageMatrix, Enemy, Weapon } from '../schemas';

/** Portage de `WEP` (lignes 879-885), `MATRIX` (ligne 887) et `ENEMY` (ligne 1805). */

export const weapons: readonly Weapon[] = [
  {
    id: 'las',
    label: 'Laser',
    symbol: 'L',
    color: '#63d6ff',
    strongAgainst: 'Blindage léger',
    profile: 'Précis · fort contre les coques légères, faible contre le blindé',
    status: 'active',
  },
  {
    id: 'art',
    label: 'Artillerie',
    symbol: 'A',
    color: '#c9d94a',
    strongAgainst: 'Partout',
    profile: 'Moyenne partout — la valeur sûre, aucun trou de couverture',
    status: 'active',
  },
  {
    id: 'nuc',
    label: 'Nucléaire',
    symbol: 'N',
    color: '#ff8a3d',
    strongAgainst: 'Blindage lourd',
    profile: 'Fort partout mais cadence lente et coût élevé — à calibrer',
    status: 'active',
  },
  {
    id: 'ion',
    label: 'Ionique',
    symbol: 'I',
    color: '#b479ff',
    strongAgainst: 'Boucliers',
    profile: "Prévu — palier 4 de l'arbre d'armement",
    status: 'planned',
  },
  {
    id: 'cin',
    label: 'Cinétique',
    symbol: 'C',
    color: '#8b998f',
    strongAgainst: 'Structures',
    profile: "Prévu — palier 5 de l'arbre d'armement",
    status: 'planned',
  },
];

/** Multiplicateur de degats : attaquant, puis defenseur. */
export const damageMatrix: DamageMatrix = {
  las: {
    las: 1,
    art: 1.35,
    nuc: 0.75,
  },
  art: {
    las: 0.75,
    art: 1,
    nuc: 1.35,
  },
  nuc: {
    las: 1.35,
    art: 0.75,
    nuc: 1,
  },
};

/** Adversaire de la mission de demonstration. */
export const enemy: Enemy = {
  weapon: 'nuc',
  armor: 'Lourd',
  siteDefense: 68,
};
