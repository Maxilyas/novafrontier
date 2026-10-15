# Contrat : moteur du combat, deploiement et parametres de l'equipe (`apps/web`)

Couvre la story 1 (deroulement a l'ecran), la story 2 (plateau), la story 3 (replay), FR-021,
FR-022, FR-027 a FR-032, FR-035 a FR-043 (`research.md` R12, R14, R17, R18).

## Module `src/state/combat-runtime.ts` (TypeScript sans Svelte)

```ts
export type RuntimePhase = 'idle' | 'running' | 'paused' | 'ended';
export type RuntimeMode = 'live' | 'replay';

export interface CombatRuntime {
  readonly phase: RuntimePhase;
  readonly mode: RuntimeMode;
  readonly combat: Combat | undefined;              // @nova/sim
  /** Lance un combat en direct (Lancer le combat, adresse directe) ; graine tiree si absente. */
  start(setup: Omit<CombatSetup, 'commands' | 'seed'> & { seed?: number }): void;
  /** Rejoue des entrees completes (Revoir le combat, resolution automatique). */
  replay(setup: CombatSetup): void;
  pause(): void;                                    // ecran quitte
  resume(): void;                                   // ecran affiche ; repart de l'instant present
  /** Active une competence ; ciblee : ouvre la designation. Ignore en replay et apres la fin. */
  activateSkill(rank: number): void;
  /** Cible designee dans la scene ; la commande vaut pour le pas suivant. */
  designate(target: Target): void;
  cancelDesignation(): void;
  readonly designation: Designation | undefined;
  /** Interpolation : 0 a 1, temps accumule depuis le dernier pas sur 50 ms. */
  alpha(now: number): number;
  previousPosition(id: number): { x: number; y: number } | undefined;
  /** Abonnements : apres chaque pas (et au lancement, avec les evenements du pas 0), puis a chaque
   *  changement de phase, de mode ou de designation. */
  onStep(listener: (events: readonly SimEvent[], combat: Combat) => void): () => void;
  onChange(listener: () => void): () => void;
}
/** Environnement injecte (images, visibilite de l'onglet, graine) : une fausse horloge en test. */
export function createRuntime(env: RuntimeEnv): CombatRuntime;
export const combatRuntime: CombatRuntime;          // instance unique de la page
```

### Horloge

| Regle | Exigence |
|---|---|
| `requestAnimationFrame` ; un pas par tranche de 50 ms ecoulee ; au plus 4 pas par image, le reste du retard est abandonne | FR-011, FR-032 |
| independante de Pixi : le combat avance meme sans rendu ou avec les animations reduites | spec, cas limites |
| arretee par `pause()` et quand l'onglet est masque ; au retour, l'origine du temps est l'instant present | FR-032 |
| les cadences d'affichage ne changent que le nombre de pas par image, jamais les pas eux-memes | SC-004 |

## Module `src/state/combat.svelte.ts` (projection reactive)

```ts
export const combatHud: {
  readonly hud: HudSnapshot;             // a chaque pas (data-model.md §4.3)
  readonly forces: readonly ForceRow[];  // tous les 5 pas
  readonly log: readonly LogLine[];      // 11 lignes au plus, la plus recente en premier
  readonly end: CombatResult | null;
  readonly replay: boolean;
};
```

`src/state/combat-log.ts` : fonction pure `(lignes, evenements, contexte) -> lignes` ; textes de la
maquette (FR-029), messages ajoutes : competence sans cible valide, bonus de Pillage obtenu.

## Module `src/state/deployment.svelte.ts`

```ts
export const deployment: {
  autoDeploy: boolean;                                   // interrupteur du Briefing
  placementFor(squad, theatre, formation): Placement;    // cree a la premiere demande (FR-041)
  pick(unit: string | null): void;                       // choix dans la liste
  placeOn(slot: number): void;                           // unite choisie -> emplacement
  drop(unit: string, from: 'list' | number, to: number | null): void; // glisser-deposer
  remove(unit: string): void;
  auto(): void;                                          // "Deploiement automatique"
  clear(): void;                                         // "Tout retirer"
  readonly picked: string | null;
};
```

Toutes les operations passent par `validatePlacement` de la sim : un placement invalide n'est jamais
enregistre (FR-044).

## Ecrans concernes

| Ecran | Changement |
|---|---|
| Escouades, Carte, Briefing | valeurs lues dans `@nova/sim` (R9) au lieu de `derivedValues` |
| Briefing | interrupteur "Deploiement automatique" et "Resoudre automatiquement" actifs (fenetre `AutoResolveModal`, FR-030a) |
| Deploiement | plateau (scene `deploiement`), boutons d'emplacements en DOM, liste "Unites a placer" active, "Deploiement automatique", "Tout retirer", legende des types ; "Lancer le combat" demarre le moteur puis navigue |
| Combat | HUD branche sur `combatHud`, barre d'actions active, fenetre de fin (`EndModal`), mention "REPLAY", releve de mesures dans le badge de diagnostic |

## Parametres de l'equipe (`location.search`)

| Parametre | Effet | Exigence |
|---|---|---|
| `graine=<entier>` | graine des combats lances et des resolutions automatiques ; sans lui, graine tiree par `crypto.getRandomValues` | FR-022 |
| `diag=1` | badge de diagnostic de la phase P0 ; sur l'ecran Combat : images par seconde, entites, pas, empreinte, mode de rendu ; un clic le replie ou le deplie ; l'empreinte s'affiche aussi dans la fenetre de resolution automatique | FR-035, R10 |
| `charge=1` | l'ecran Combat lance le scenario de charge (`loadScenario`) | FR-036 |
| `rendu=webgl` | inchange (phase P0 de la feuille de route) | - |

Toute autre valeur est ignoree ; sans parametre, aucun de ces outils n'est visible.

## Fenetres (`src/ui/Modal.svelte`, R17)

| Fenetre | Contenu | Commandes |
|---|---|---|
| Fin de combat | titre "Relique sécurisée" ou "Relique perdue", texte de la maquette, vagues apparues/total, unites restantes/engagees, butin estime (majore par Pillage, 0 en defaite) | "Redéployer", "Retour à la carte", "Revoir le combat" |
| Resolution automatique | en-tete "Résolution automatique", "Opération réussie" ou "Opération échouée", unites perdues, butin estime, territoire | "Fermer", "Rejouer en manuel", "Revoir le combat" |

Focus place sur la premiere commande a l'ouverture et rendu a l'element d'origine a la fermeture ;
Echap ferme la fenetre de resolution automatique.
