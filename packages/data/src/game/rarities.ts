import type { Rarity } from '../schemas';

/** Portage de `RAR` (maquette, lignes 868-874). */

export const rarities: readonly Rarity[] = [
  {
    id: 'com',
    label: 'Commun',
    color: '#8b968f',
    maxStars: 2,
    actionPoints: 2,
    legendarySlot: false,
  },
  {
    id: 'rare',
    label: 'Rare',
    color: '#4f9ad6',
    maxStars: 3,
    actionPoints: 3,
    legendarySlot: false,
  },
  {
    id: 'epic',
    label: 'Épique',
    color: '#9d6ff0',
    maxStars: 4,
    actionPoints: 4,
    legendarySlot: false,
  },
  {
    id: 'leg',
    label: 'Légendaire',
    color: '#f5a623',
    maxStars: 5,
    actionPoints: 5,
    legendarySlot: false,
  },
  {
    id: 'div',
    label: 'Divin',
    color: '#ff5fc0',
    maxStars: 6,
    actionPoints: 5,
    legendarySlot: true,
  },
];
