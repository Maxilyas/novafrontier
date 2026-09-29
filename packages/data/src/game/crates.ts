import type { Crate, LaunchPool } from '../schemas';

/** Portage de `CRATES` (lignes 2380-2390). */

export const crates: readonly Crate[] = [
  {
    id: 'free',
    title: 'Coffre quotidien',
    subtitle: 'Gratuit · 1 par jour',
    icon: 'ic-crate',
    odds: [
      {
        rarity: 'com',
        percent: 82,
      },
      {
        rarity: 'rare',
        percent: 17,
      },
      {
        rarity: 'epic',
        percent: 1,
      },
    ],
    availability: 'Prochain dans 18 h 42',
    cta: 'Ouvrir — disponible',
  },
  {
    id: 'week',
    title: 'Coffre hebdomadaire',
    subtitle: 'Gratuit · 1 par semaine',
    icon: 'ic-crate',
    odds: [
      {
        rarity: 'com',
        percent: 40,
      },
      {
        rarity: 'rare',
        percent: 48,
      },
      {
        rarity: 'epic',
        percent: 9,
      },
      {
        rarity: 'leg',
        percent: 2.5,
      },
      {
        rarity: 'div',
        percent: 0.5,
      },
    ],
    availability: 'Cumule si non ouvert',
    cta: 'Ouvrir dans 2 j 06 h',
  },
  {
    id: 'prem',
    title: 'Dossier gradé',
    subtitle: '9 800 crédits',
    icon: 'ic-academy',
    odds: [
      {
        rarity: 'rare',
        percent: 62,
      },
      {
        rarity: 'epic',
        percent: 30,
      },
      {
        rarity: 'leg',
        percent: 7,
      },
      {
        rarity: 'div',
        percent: 1,
      },
    ],
    availability: 'Pitié légendaire 34/50',
    cta: 'Acheter — 9 800 crédits',
  },
];

/** Pool de lancement (lignes 2408-2420) : 5 communes, 5 rares, 1 divine ; epique et legendaire pas encore ouverts. */
export const launchPool: LaunchPool = {
  groups: [
    {
      rarity: 'com',
      label: 'Communes — 5 cartes',
      units: ['c4', 'c5', 's3', 's4', 'm2'],
    },
    {
      rarity: 'rare',
      label: 'Rares — 5 cartes',
      units: ['c2', 'c3', 's1', 's2', 'm1'],
    },
    {
      rarity: 'div',
      label: 'Divine — 1 carte',
      units: ['c1'],
    },
  ],
  locked: ['epic', 'epic', 'leg', 'leg'],
};
