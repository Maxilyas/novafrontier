import { enemy } from '../game/weapons';
import type { DemoState } from '../schemas';

/**
 * Etat de demonstration de la maquette (data-model.md §3) : profil (lignes 673-697), ressources
 * (699-711), escouades (`SQUADS`, 1070-1076), file de recherche (1625-1635), mission et selections
 * par defaut. Rien n'est sauvegarde (FR-014).
 */

export const demoState: DemoState = {
  profile: {
    name: 'CDR. A. GOMÈS',
    rank: 'Commodore',
    wing: 'Escadre de Caprica',
    badge: 'G4',
    level: 47,
    xpProgress: 0.64,
    nextUltimateLevel: 50,
  },
  resources: {
    credits: 128400,
    alloy: 184720,
    fuel: 9420,
    artefacts: 6,
  },
  pendingIncome: {
    amount: 14280,
    cap: 27300,
    untilCap: '3 j 16 h',
    gauge: 0.52,
  },
  squads: [
    {
      id: 'alpha',
      name: 'Escouade Alpha',
      commander: 'c1',
      ships: ['s1', 's2', 's4'],
      mechs: ['m1', 'm2'],
      defaultFormation: 'ring',
    },
    {
      id: 'bravo',
      name: 'Escouade Bravo',
      commander: 'c2',
      ships: ['s3', null, null],
      mechs: ['m2', null],
      defaultFormation: 'arc',
    },
    {
      id: 'charlie',
      name: 'Escouade Charlie',
      commander: 'c4',
      ships: [null, null, null],
      mechs: [null, null],
      defaultFormation: 'ring',
    },
    {
      id: 'delta',
      name: 'Escouade Delta',
      commander: null,
      ships: [null, null, null],
      mechs: [null, null],
      defaultFormation: 'ring',
      lockedUntilRank: 'Grade 5',
    },
    {
      id: 'echo',
      name: 'Escouade Echo',
      commander: null,
      ships: [null, null, null],
      mechs: [null, null],
      defaultFormation: 'ring',
      lockedUntilRank: 'Grade 6',
    },
  ],
  researchQueue: {
    header: '3 EMPLACEMENTS · LABORATOIRE NIV 7',
    slots: [
      {
        kind: 'active',
        label: 'Canon laser II — palier 3',
        icon: 'ic-weapon',
        progress: 0.62,
        remaining: '00:48:12',
      },
      {
        kind: 'active',
        label: 'Moteur léger — palier 3',
        icon: 'ic-engine',
        progress: 0.18,
        remaining: '03:11:40',
      },
      {
        kind: 'free',
        label: 'Emplacement libre — Laboratoire NIV 9',
      },
    ],
  },
  mission: {
    target: 'gemenon',
    enemy: enemy,
    relicHp: 1000,
    reach: 900,
    engine: 'Standard',
    fuelRate: 1,
  },
  defaults: {
    squad: 'alpha',
    rosterFilter: 'cmd',
    actionPointsMode: 'fixe',
    theatre: 'orbital',
    atlas: {
      unit: 's1',
      tier: 2,
      weapon: 'las',
    },
    building: 'hq',
    tree: 'arm',
    node: 'a2',
    map: {
      scale: 'Secteur',
      zone: 'BRAS DE CYRANNUS · SECTEUR 04-07',
      coords: 'X:24 Y:12',
    },
  },
};
