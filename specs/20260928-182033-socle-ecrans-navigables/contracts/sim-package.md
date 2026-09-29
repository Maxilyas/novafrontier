# Contrat : paquet `@nova/sim` (types seulement)

En phase P0 de la feuille de route, `@nova/sim` n'a aucune regle ni aucun code execute. Il
declare les formes d'entree et de sortie de `plan.md` §6, pour que les phases suivantes s'y
branchent. Ces types sont **provisoires** : la phase P1 de la feuille de route les precisera
en portant les regles.

## Exports (`packages/sim/src/index.ts`)

```ts
/** Pas fixe de 50 ms (20 ticks/s, plan.md §6). */
export type Tick = number;
/** Virgule fixe 16.16 (plan.md §6). */
export type Fixed = number & { readonly __unit: 'fixed16.16' };
/** Angle en 1/1024 de tour (plan.md §6). */
export type Angle = number & { readonly __unit: 'turn/1024' };

export interface SimInput {
  seed: number;
  squad: import('@nova/data').Squad;
  formation: import('@nova/data').Formation;
  theatre: import('@nova/data').Theatre;
  waves: readonly WaveSpec[];
  commands: readonly SimCommand[];
}
export interface WaveSpec { index: number; boss: boolean; weapon: import('@nova/data').ActiveWeaponId }
export interface SimCommand { tick: Tick; action: string } // precise en phase P1 de la feuille de route
export type SimEventType =
  'wave' | 'spawn' | 'shot' | 'hit' | 'death' | 'skill' | 'objective' | 'end';
export interface SimEvent { type: SimEventType; tick: Tick }
export interface SimSnapshot { tick: Tick; objective: { hp: number; max: number } }
```

## Regles appliquees des maintenant

Principe II de la constitution :

1. `tsconfig.json` du paquet sans la bibliotheque `DOM` : toute reference au DOM echoue au
   typecheck.
2. Test de purete (`tests/purity.test.ts`) : aucune occurrence de `Math.random`, `Math.sin`,
   `Math.cos`, `Math.atan2`, `Math.hypot`, `Date.now`, `new Date`, `performance.now`,
   `window`, `document` ni `navigator` dans `src/`.
3. Dependances : `@nova/data` en import de types seulement ; ni Pixi, ni Svelte, ni reseau.
