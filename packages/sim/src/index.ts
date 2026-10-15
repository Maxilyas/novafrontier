/**
 * @nova/sim : regles du jeu, deterministes, sans rendu (plan.md §6, contracts/sim-package.md). Le
 * meme code sert le client et, en phase P5 de la feuille de route, le serveur.
 */

export { briefing, route, squadSummary, ultimateStatus } from './briefing';
export { type Combat, createCombat, runCombat } from './combat';
export * from './events';
export { FIXED_ONE, type Fixed, fromFixed, toFixed } from './fixed';
export { autoPlacement, engagedUnits, formationSlots, validatePlacement } from './formation';
export { difficulty, fuelOf, lootOf, planetDistance, territoryGain, travel } from './planet';
export type { Angle } from './trig';
export * from './types';
export { wavesFor } from './waves';
