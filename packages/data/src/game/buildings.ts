import type { Building, BuildingSlots } from '../schemas';

/**
 * Portage de `BUILDINGS` (lignes 1439-1458). Couts d'amelioration de la maquette, pour le rang i :
 * alliage `28000 + i*4200`, credits `1800 + i*260`.
 */

export const buildings: readonly Building[] = [
  {
    id: 'hq',
    name: 'Centre de commandement',
    level: 9,
    position: {
      x: 640,
      y: 300,
      width: 230,
    },
    icon: 'ic-hq',
    status: 'ACTIF',
    description:
      "Détermine le niveau maximum des autres bâtiments et le nombre d'escouades déployables.",
    upgrade: {
      alloy: 28000,
      credits: 1800,
      duration: '04:12:30',
      effect: '+14% rendement',
    },
  },
  {
    id: 'refinery',
    name: "Raffinerie d'alliage",
    level: 12,
    position: {
      x: 410,
      y: 150,
      width: 186,
    },
    icon: 'ic-refinery',
    status: '+3 420/h',
    description: 'Extraction et raffinage du minerai. Ossature de toute construction.',
    upgrade: {
      alloy: 32200,
      credits: 2060,
      duration: '04:12:30',
      effect: '+14% rendement',
    },
  },
  {
    id: 'reactor',
    name: 'Centrale à fusion',
    level: 8,
    position: {
      x: 900,
      y: 300,
      width: 186,
    },
    icon: 'ic-reactor',
    status: '2 840/3 200',
    description: "Alimente l'ensemble de la base. Un déficit ralentit toutes les productions.",
    upgrade: {
      alloy: 36400,
      credits: 2320,
      duration: '04:12:30',
      effect: '+14% rendement',
    },
  },
  {
    id: 'lab',
    name: 'Laboratoire central',
    level: 7,
    position: {
      x: 1090,
      y: 180,
      width: 176,
    },
    icon: 'ic-lab',
    status: 'EN COURS',
    description: 'Ouvre les trois arbres de recherche. Consomme alliage et crédits.',
    upgrade: {
      alloy: 40600,
      credits: 2580,
      duration: '04:12:30',
      effect: '+14% rendement',
    },
  },
  {
    id: 'shipyard',
    name: 'Chantier orbital',
    level: 6,
    position: {
      x: 430,
      y: 470,
      width: 214,
    },
    icon: 'ic-shipyard',
    status: '2 EN FILE',
    description: "Assemble la flotte et augmente l'effectif des escadrilles.",
    upgrade: {
      alloy: 44800,
      credits: 2840,
      duration: '04:12:30',
      effect: '+14% rendement',
    },
  },
  {
    id: 'mechbay',
    name: 'Baie méca',
    level: 5,
    position: {
      x: 700,
      y: 500,
      width: 190,
    },
    icon: 'ic-mechbay',
    status: 'DISPONIBLE',
    description: 'Produit et entretient la force méca engagée sur les combats terrestres.',
    upgrade: {
      alloy: 49000,
      credits: 3100,
      duration: '04:12:30',
      effect: '+14% rendement',
    },
  },
  {
    id: 'radar',
    name: "Station d'écoute",
    level: 4,
    position: {
      x: 900,
      y: 140,
      width: 160,
    },
    icon: 'ic-radar',
    status: 'PORTÉE 820 UA',
    description: "Révèle les missions et autorise l'espionnage d'une planète avant l'assaut.",
    upgrade: {
      alloy: 53200,
      credits: 3360,
      duration: '04:12:30',
      effect: '+14% rendement',
    },
  },
  {
    id: 'market',
    name: 'Comptoir',
    level: 6,
    position: {
      x: 930,
      y: 520,
      width: 176,
    },
    icon: 'ic-market',
    status: '+540/h',
    description: "Convertit les surplus en crédits. Revenu lié à l'étendue du territoire.",
    upgrade: {
      alloy: 57400,
      credits: 3620,
      duration: '04:12:30',
      effect: '+14% rendement',
    },
  },
  {
    id: 'turret',
    name: 'Tourelles orbitales',
    level: 3,
    position: {
      x: 1150,
      y: 470,
      width: 132,
    },
    icon: 'ic-turret',
    status: 'DÉFENSE 62',
    description: 'Défense passive contre les raids. Intervient en soutien du combat.',
    upgrade: {
      alloy: 61600,
      credits: 3880,
      duration: '04:12:30',
      effect: '+14% rendement',
    },
  },
];

/** Compteur "9 / 12" du panneau des batiments. */
export const buildingSlots: BuildingSlots = { used: 9, total: 12 };
