import type { EngineSpec } from '../schemas';

/** Les trois motorisations de la maquette (renderAtlas, lignes 1360-1366). */
export const engines: readonly EngineSpec[] = [
  { id: 'Standard', description: 'Trajets courts, consommation moyenne', fuelRate: 1 },
  { id: 'Léger', description: 'Rapide mais faible autonomie', fuelRate: 0.7 },
  { id: 'Subspatial', description: 'Saut hyperespace, portée illimitée', fuelRate: 3.4 },
];
