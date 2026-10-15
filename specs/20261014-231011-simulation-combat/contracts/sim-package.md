# Contrat : paquet `@nova/sim`

Remplace le contrat "types seulement" de la phase P0 de la feuille de route
(`specs/20260928-182033-socle-ecrans-navigables/contracts/sim-package.md`). Formes des donnees :
`data-model.md` §3. Le meme code sert le client et, en phase P5 de la feuille de route, le serveur.

## Dependances

- `@nova/data` : donnees de jeu et types (valeurs importees, schemas zod jamais importes a
  l'execution).
- Aucune autre dependance d'execution. Developpement : `vitest`, `@vitest/browser-playwright`,
  `playwright`, `typescript`, `@biomejs/biome`.
- `"sideEffects": false` : l'application n'embarque que ce qu'elle utilise.

## Exports (`packages/sim/src/index.ts`)

```ts
// Unites
export type Tick = number;                // pas de 50 ms
export type Fixed = number;               // 16.16 (R2) ; alias documentaire
export const TICK_MS = 50;
export const toFixed: (x: number) => Fixed;      // Math.round(x * 65536), pour donnees et tests
export const fromFixed: (f: Fixed) => number;    // affichage seulement

// Formations et placement (data-model.md §3.1-3.2)
export function formationSlots(formation: Formation, theatre: Theatre): readonly Slot[];
export function engagedUnits(squad: Squad, theatre: Theatre): readonly Combatant[];
export function autoPlacement(squad: Squad, theatre: Theatre, formation: Formation): Placement;
export function validatePlacement(
  squad: Squad, theatre: Theatre, formation: Formation, placement: Placement,
): { ok: true } | { ok: false; reason: string };

// Combat (data-model.md §3.3-3.7)
export interface Combat {
  readonly state: Readonly<CombatState>;
  readonly setup: Readonly<CombatSetup>;   // journal de commandes a jour compris
  readonly initialEvents: readonly SimEvent[]; // pas 0 : apparition de la premiere vague
  readonly slots: readonly Slot[];         // emplacements de la formation et du theatre
  readonly bar: readonly Skill[];          // competences de la barre d'actions, par rang
  /** Avance d'un pas : applique les commandes datees de ce pas. Sans effet apres la fin. */
  step(): readonly SimEvent[];
  /** Ajoute une commande pour un pas futur (> state.tick) ; journal en direct. */
  issue(command: Command): void;
  fingerprint(): string;
  result(): CombatResult | null;          // null tant que le combat n'est pas fini
}
export function createCombat(setup: CombatSetup): Combat;   // leve une erreur si entree invalide
export function runCombat(setup: CombatSetup): CombatResult; // sans affichage, jusqu'a la fin
export function loadScenario(): CombatSetup;                 // scenario de charge (R14), graine 1

// Valeurs de briefing (R9) : memes formes que les types de @nova/data
export function squadSummary(squad: Squad): SquadDerived;
export function route(target: Planet): RouteDerived;
export function briefing(squad: Squad, target: Planet): BriefingDerived;
export function wavesFor(target: Planet): readonly WaveSpec[];   // avec `composition` corrigee
export function territoryGain(target: Planet): number;           // revenu quotidien, round(butin / 12)
export function ultimateStatus(level: number): { ready: boolean; level: number; progress: number };
```

`WaveSpec` = `{ index, boss, composition, weapon, threat }` (forme de `Wave` de `@nova/data`).

## Garanties

| Garantie | Regle | Exigence |
|---|---|---|
| Determinisme | memes entrees, memes etats a chaque pas, memes evenements, meme empreinte, sous Node, Chromium, Firefox et WebKit | FR-016, SC-002 |
| Pas fixe | aucune lecture d'horloge ; le pas n'avance que par `step()` | FR-011 |
| Entrees | `createCombat` valide graine, placement (`validatePlacement`), commandes (forme, rang de competence, pas croissants) ; toute entree invalide leve une `Error` dont le message dit pourquoi | FR-044 |
| Commandes en direct | `issue` refuse un pas deja calcule ; l'ordre d'emission est conserve a pas egal | FR-013 |
| Fin | `step()` apres `end` ne fait rien et rend `[]` ; duree maximale de 12 000 pas | FR-010 |
| Lecture seule | `state` n'est jamais modifie de l'exterieur ; les tests le gelent en mode developpement | principe III |
| Performance | combat de 1 200 pas a 60 entites en moins de 50 ms sur le poste de reference | SC-006 |

## Purete (principe II)

Le test `tests/purity.test.ts` interdit dans `src/` : `Math.random`, `Math.sin`, `Math.cos`,
`Math.atan2`, `Math.hypot`, `Math.pow`, `Math.exp`, `Math.log`, `Math.log2`, `Math.log10`,
`Math.log1p`, `Math.expm1`, `Math.tan`, `Math.asin`, `Math.acos`, `Math.atan`, `Math.sinh`,
`Math.cosh`, `Math.tanh`, `Math.cbrt`, l'operateur `**`, `Date.now`, `new Date`,
`performance.now`, `window`, `document`, `navigator`. `tsconfig.json` reste sans la bibliotheque
`DOM`. Les scripts (`packages/sim/scripts/`) et les tests ne sont pas concernes.

## Scripts du paquet

| Script | Effet |
|---|---|
| `lint`, `typecheck` | comme en phase P0 de la feuille de route |
| `test` | Vitest sous Node : regles, briefing, combats de reference, proprietes, performance, purete |
| `test:browsers` | combats de reference dans Chromium, Firefox et WebKit (Vitest, mode navigateur) |
| `golden:update` | recalcule `tests/golden/combats.json` ; a lancer seulement pour assumer un changement de regle (FR-023) |
| `trig:generate` | regenere `src/trig-table.ts` (R3) |
