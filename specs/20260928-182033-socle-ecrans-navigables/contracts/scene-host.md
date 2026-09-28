# Contrat : zone de scene (`SceneHost`) et moteur de rendu

Couvre FR-020 a FR-028, la story 3, SC-004 a SC-006, SC-008 et SC-009 (`research.md` R10 et
R11).

## Composant

```svelte
<SceneHost scene="carte" />   <!-- ou "deploiement", "combat" -->
```

Il remplit la zone de grille ou il est place, sous les panneaux de l'ecran. Il produit :

```html
<div class="scene-host" data-scene-host="carte" data-render-mode="webgl2">
  <canvas>...</canvas>              <!-- modes webgpu, webgl2, webgl1 -->
  <div role="alert">...</div>       <!-- mode indisponible : message -->
</div>
```

Les panneaux et commandes de l'ecran restent au-dessus, dans le DOM (FR-021). Le voile de grain
recouvre tout (FR-009).

## Module `src/scene/renderer.ts`

```ts
export type SceneId = 'carte' | 'deploiement' | 'combat';
export type RenderMode =
  | 'initialisation' | 'webgpu' | 'webgl2' | 'webgl1' | 'perdu' | 'indisponible';

export interface SceneHandle {
  readonly mode: RenderMode;
  onModeChange(listener: (mode: RenderMode) => void): () => void; // renvoie la desinscription
}

/** Rattache la scene a `host` et la demarre. Cree l'application a la premiere demande. */
export function acquireScene(id: SceneId, host: HTMLElement): Promise<SceneHandle>;

/** Arrete l'animation et detache le canvas ; l'application est conservee. */
export function releaseScene(id: SceneId): void;
```

## Contenu d'une scene

Le contenu branche dans une application passe par ce contrat, que les scenes des phases P1 de la feuille de route et
P2 de la feuille de route reutiliseront :

```ts
export interface SceneModule {
  create(app: import('pixi.js').Application): SceneInstance;
}
export interface SceneInstance {
  start(): void;                    // reprend l'animation
  stop(): void;                     // la met en pause
  resize(width: number, height: number): void; // taille CSS de la zone
  destroy(): void;
}
```

En phase P0 de la feuille de route, les trois scenes utilisent `scenes/placeholder.ts` : le degrade du fond de la
maquette et environ 300 etoiles placees par un generateur a graine, qui derivent lentement
(FR-022).

## Garanties

| Garantie | Regle | Exigence |
|---|---|---|
| Chargement | PixiJS est importe dynamiquement a la premiere ouverture d'un ecran a scene, jamais au demarrage | SC-003 |
| Choix du rendu | `preference: ['webgpu', 'webgl']`. WebGPU sans adaptateur ou sans peripherique mene a WebGL. Aucun des deux : mode `indisponible`. Jamais le rendu Canvas 2D | FR-023, FR-024 |
| Mode | `renderer.type` donne `webgpu` ou `webgl2`/`webgl1` (version du contexte), publie dans `data-render-mode` | FR-028 |
| Instances | une application par `SceneId` pour toute la vie de la page, jamais recreee sauf apres un mode `indisponible` du a une perte ; `releaseScene` n'en detruit aucune | FR-027, SC-009 |
| Retour | `acquireScene` sur une scene existante rattache le canvas et reprend l'animation en moins de 300 ms | FR-027 |
| Premiere ouverture | scene visible en moins d'une seconde sur le poste de reference | SC-004 |
| Densite | `resolution` = min(densite de l'ecran, 2), `autoDensity` ; changement de densite suivi par `matchMedia` | FR-025, SC-008 |
| Taille | `ResizeObserver` sur la zone, puis `renderer.resize(largeur, hauteur, resolution)` : le canvas occupe toute la zone, sans deformation | FR-026, SC-008 |
| Animation | seulement si l'ecran est affiche et l'onglet visible ; une image fixe si les animations sont reduites | FR-027, FR-035 |
| Perte du contexte | mode `perdu` a la perte du contexte WebGL ou du peripherique WebGPU. Retour au mode precedent quand Pixi le retablit. Mode `indisponible` si rien n'est retabli en 3 s | FR-024 |
| Polices | `document.fonts.ready` attendu avant la creation | `plan.md` §2 |

## Message du mode `indisponible`

Rendu dans la charte : panneau a coins coupes, titre phosphore, texte en `--muted`.
L'interface porte les accents. Titre : "Affichage de la scene indisponible". Texte : "Ce
navigateur ne propose pas d'acceleration graphique. Activez-la dans ses reglages, ou utilisez
une version recente de Chrome, Edge, Firefox ou Safari." Le reste de l'ecran reste utilisable
(SC-006).

## Diagnostic (`?diag=1`)

Badge discret en bas a droite, absent sans le parametre. Il affiche le mode de chaque scene
ouverte, la cadence d'images de la scene visible (moyenne sur 1 s) et la duree du dernier
changement d'ecran, en millisecondes. Il sert aux mesures manuelles de SC-004, SC-005 et
SC-009 (`quickstart.md`).

## Rendu de repli force (`?rendu=webgl`)

Reglage de diagnostic, sans effet s'il est absent : la preference devient `['webgl']`, ce qui
force le rendu de repli. Il sert a verifier ce mode dans Chrome et Edge, qui n'offrent aucun
reglage simple pour couper WebGPU. Les commutateurs `--disable-features=WebGPU` et
`--disable-webgpu` ont ete essayes sans effet sur Chromium 141. La bascule automatique
elle-meme est verifiee sans ce reglage : dans Chromium sans ecran, qui n'a pas d'adaptateur
WebGPU par defaut, et avec les reglages natifs de Firefox et Safari (`quickstart.md`). Toute
autre valeur est ignoree.
