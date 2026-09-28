import type { Planet, PlanetIncome } from '../schemas';

/** Portage de `PLANETS` (lignes 1644-1661). */

export const planets: readonly Planet[] = [
  {
    id: 'astrea-iv',
    name: 'ASTREA IV',
    position: {
      x: 2400,
      y: 1224,
    },
    radius: 30,
    colors: {
      light: '#8fd6a8',
      dark: '#1d4a35',
    },
    status: 'BASE',
    resources: ['Alliage', 'Carburant'],
    operations: 0,
    description: 'Colonie mère. Point de départ de tous les trajets.',
  },
  {
    id: 'caprica-minor',
    name: 'CAPRICA MINOR',
    position: {
      x: 2010,
      y: 960,
    },
    radius: 21,
    colors: {
      light: '#d6b98f',
      dark: '#4a3a1d',
    },
    status: 'CONTRÔLE',
    resources: ['Alliage'],
    operations: 2,
    description: 'Territoire conquis. Verse 3 200 crédits par jour.',
  },
  {
    id: 'lune-de-tauron',
    name: 'LUNE DE TAURON',
    position: {
      x: 2820,
      y: 900,
    },
    radius: 15,
    colors: {
      light: '#c9c9d6',
      dark: '#33343f',
    },
    status: 'CONTRÔLE',
    resources: ['Carburant'],
    operations: 1,
    description: 'Satellite minier. Seule source stable de carburant du secteur.',
  },
  {
    id: 'gemenon',
    name: 'GEMENON',
    position: {
      x: 1880,
      y: 1560,
    },
    radius: 24,
    colors: {
      light: '#d68f8f',
      dark: '#4a1d1d',
    },
    status: 'HOSTILE',
    resources: ['Alliage', 'Crédits'],
    operations: 3,
    description:
      'Avant-poste hostile. Une victoire transfère le territoire et son revenu quotidien.',
  },
  {
    id: 'ceinture-de-picon',
    name: 'CEINTURE DE PICON',
    position: {
      x: 2900,
      y: 1520,
    },
    radius: 13,
    colors: {
      light: '#a89b8f',
      dark: '#3a332c',
    },
    status: 'NEUTRE',
    resources: ['Alliage'],
    operations: 2,
    description: "Champ d'astéroïdes dense. Pertes probables au minage.",
  },
  {
    id: 'station-virgon',
    name: 'STATION VIRGON',
    position: {
      x: 2660,
      y: 1230,
    },
    radius: 11,
    colors: {
      light: '#8fb8d6',
      dark: '#1d3a4a',
    },
    status: 'MARCHAND',
    resources: ['Crédits'],
    operations: 1,
    description: 'Comptoir indépendant. Achat de crédits et de pièces détachées.',
  },
  {
    id: 'sagittaron',
    name: 'SAGITTARON',
    position: {
      x: 1740,
      y: 930,
    },
    radius: 19,
    colors: {
      light: '#b8a8d6',
      dark: '#2f2447',
    },
    status: 'HOSTILE',
    resources: ['Alliage', 'Carburant'],
    operations: 2,
    description: 'Bastion fortifié. Défense orbitale et terrestre : engagement combiné requis.',
  },
  {
    id: 'aerilon',
    name: 'AERILON',
    position: {
      x: 3020,
      y: 1700,
    },
    radius: 15,
    colors: {
      light: '#9fd68f',
      dark: '#274a1d',
    },
    status: 'NEUTRE',
    resources: ['Crédits'],
    operations: 1,
    description: 'Agromonde neutre. Faible défense, butin modeste.',
  },
  {
    id: 'ruines-d-erebe',
    name: "RUINES D'ÉRÈBE",
    position: {
      x: 3480,
      y: 640,
    },
    radius: 17,
    colors: {
      light: '#63d6bc',
      dark: '#0d3a33',
    },
    status: 'INEXPLORÉ',
    resources: ['Artefact'],
    operations: 1,
    description: 'Signature ancienne. Hors de portée sans moteur subspatial.',
  },
  {
    id: 'amas-de-kobol',
    name: 'AMAS DE KOBOL',
    position: {
      x: 1180,
      y: 1880,
    },
    radius: 22,
    colors: {
      light: '#d6c78f',
      dark: '#3f3a1d',
    },
    status: 'INEXPLORÉ',
    resources: ['Artefact', 'Alliage'],
    operations: 0,
    description: 'Nébuleuse dense. Trajet long, consommation très élevée.',
  },
  {
    id: 'libran',
    name: 'LIBRAN',
    position: {
      x: 3760,
      y: 1380,
    },
    radius: 18,
    colors: {
      light: '#8fa8d6',
      dark: '#1d2a4a',
    },
    status: 'HOSTILE',
    resources: ['Crédits'],
    operations: 2,
    description: 'Secteur voisin. Flotte de raid connue.',
  },
  {
    id: 'scorpia',
    name: 'SCORPIA',
    position: {
      x: 820,
      y: 700,
    },
    radius: 20,
    colors: {
      light: '#d69f8f',
      dark: '#4a2a1d',
    },
    status: 'HOSTILE',
    resources: ['Alliage'],
    operations: 1,
    description: 'Bras extérieur. Difficulté maximale.',
  },
  {
    id: 'tauron-prime',
    name: 'TAURON PRIME',
    position: {
      x: 2960,
      y: 420,
    },
    radius: 23,
    colors: {
      light: '#c9b48f',
      dark: '#43371d',
    },
    status: 'NEUTRE',
    resources: ['Alliage', 'Crédits'],
    operations: 2,
    description: 'Monde industriel neutre.',
  },
  {
    id: 'picon',
    name: 'PICON',
    position: {
      x: 1420,
      y: 1180,
    },
    radius: 19,
    colors: {
      light: '#8fd6c9',
      dark: '#1d4a44',
    },
    status: 'NEUTRE',
    resources: ['Carburant'],
    operations: 1,
    description: 'Monde océanique. Raffineries de deutérium.',
  },
  {
    id: 'canceron',
    name: 'CANCERON',
    position: {
      x: 4120,
      y: 760,
    },
    radius: 16,
    colors: {
      light: '#d68fc9',
      dark: '#4a1d3f',
    },
    status: 'INEXPLORÉ',
    resources: ['Artefact'],
    operations: 0,
    description: 'Limite de la carte connue.',
  },
  {
    id: 'leonis',
    name: 'LEONIS',
    position: {
      x: 660,
      y: 1620,
    },
    radius: 17,
    colors: {
      light: '#b8d68f',
      dark: '#374a1d',
    },
    status: 'INEXPLORÉ',
    resources: ['Alliage'],
    operations: 0,
    description: 'Bras opposé. Aucun relais de ravitaillement.',
  },
];

/** Revenu quotidien des planetes possedees : portage de `INCOME` (lignes 1459-1463). */
export const planetIncome: readonly PlanetIncome[] = [
  {
    planet: 'astrea-iv',
    label: 'Colonie mère',
    daily: 8400,
  },
  {
    planet: 'caprica-minor',
    label: 'Territoire conquis · 210 UA',
    daily: 3200,
  },
  {
    planet: 'lune-de-tauron',
    label: 'Territoire conquis · 340 UA',
    daily: 2680,
  },
];
