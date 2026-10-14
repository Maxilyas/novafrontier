# Contrat : scenes de combat et de deploiement

Prolonge `specs/20260928-182033-socle-ecrans-navigables/contracts/scene-host.md`, dont toutes les
garanties restent valables (chargement differe de Pixi, modes de rendu, densite, taille, perte du
contexte, message `indisponible`). Couvre FR-024 a FR-026, FR-037, FR-038 et la designation de
FR-013 (`research.md` R13, R18).

## Changements de `src/scene/renderer.ts` et `types.ts`

```ts
export interface SceneModule {
  create(app: Application): SceneInstance;
  /** Reste anime quand les animations sont reduites (la scene fige elle-meme ses decorations). */
  readonly animateWhenReducedMotion?: boolean;
  /** Options d'initialisation propres a la scene (par defaut : celles de la phase P0). */
  readonly init?: { antialias?: boolean };
}

/** Module par scene, importe dynamiquement a la premiere ouverture. */
const MODULES: Record<SceneId, () => Promise<SceneModule>> = {
  carte: () => import('./scenes/placeholder').then((m) => m.placeholder),
  deploiement: () => import('./scenes/deploy').then((m) => m.deployScene),
  combat: () => import('./scenes/combat').then((m) => m.combatScene),
};
```

`animer()` consulte `animateWhenReducedMotion` ; le reste du cycle de vie est inchange.

## Mise a l'echelle commune (`scenes/fit.ts`)

L'espace logique (arene 1 600 x 816, plateau 988 x 752) est mis a l'echelle uniformement pour tenir
dans la zone, centre ; le fond couvre toute la zone. `fit.ts` expose la conversion dans les deux
sens (logique vers pixels CSS de la zone, et inverse) : la scene l'utilise pour dessiner, le DOM pour
placer les boutons d'emplacements, la designation pour convertir le pointeur.

## Scene de combat (`scenes/combat/`)

Lit `combatRuntime` (contrat `combat-runtime.md`) a chaque image ; ne modifie jamais le combat.

| Element | Rendu provisoire (maquette, `combatLoop`) | Exigence |
|---|---|---|
| Fond | spatial : degrade radial `#0a1620` > `#050a10` > `#010203` centre sur la relique et 300 etoiles fixes ; terrestre : degrade vertical `#111a15` > `#1a1b11` | FR-024 |
| Relique | hexagone de rayon 30, remplissage `rgba(245,166,35,.16)`, contour `#f5a623` ; anneau de rayon 58 dont l'opacite pulse (figee si animations reduites) | FR-024 |
| Unite | fleche (0,-13) (10,8) (0,4) (-10,8), contour de la couleur de ligne (`#e8543f` premiere, `#63d6bc` seconde) ; barre de PV 32 x 3,5 au-dessus (verte au-dessus de 40 %, rouge sinon) ; trait de la couleur de l'armement dessous ; cercle de portee a 5 % d'opacite ; anneau de bouclier de rayon 19 pendant Bouclier de flotte ou Garde serree | FR-024 |
| Ennemi | pointe orientee vers la relique, taille et couleur de l'archetype (data-model.md §2.2) ; barre de PV pour `m`, `h`, `b` ; anneau violet `#b479ff` si immobilise | FR-024 |
| Tir | trait de 1,8 px de la couleur de l'armement (rouge `#e8543f` vers la relique), qui s'estompe en 0,15 s ; tir manque : trait en pointilles qui devie et s'arrete court | FR-024 |
| Destruction | anneau `rgba(245,166,35,a)` qui s'elargit en 0,27 s, cinq fois plus grand pour le boss | FR-024 |
| Effet de competence | anneau de 0,5 s, couleur par effet : degats `#f5a623`, protection `#63d6bc`, soin `#9fd15a`, immobilisation `#b479ff`, renforcement `#e8543f` | FR-024 |
| Designation | cibles valides en surbrillance ; zone d'effet sous le pointeur pour un point ; emplacements libres du type de l'unite pour Repli tactique | FR-013 |

- **Interpolation** : position affichee = precedente + (courante - precedente) x `alpha`, pour les
  ennemis (seules entites mobiles, hors Repli tactique qui est instantane).
- **Pools** : tirs, destructions et effets reutilisent des `Graphics` ; aucune creation par image
  en regime etabli.
- **Designation** : `pointerdown` sur la scene converti en coordonnees d'arene (`fit.ts`), puis
  `combatRuntime.designate()` ; clic droit et Echap appellent `cancelDesignation()`. Le curseur
  change pendant la designation.
- **Options** : `antialias: true` ; `animateWhenReducedMotion: true`.

## Scene du plateau (`scenes/deploy/`)

| Element | Rendu provisoire (maquette, `drawDeploy`) | Exigence |
|---|---|---|
| Fond | spatial : degrade radial `#0a1720` > `#050b10` > `#020405` et 260 etoiles fixes ; terrestre : degrade `#131b16` > `#1b1c12` et quadrillage de 44 unites | FR-037 |
| Lignes | pointilles 5/7 : premiere ligne `rgba(232,84,63,.28)`, seconde `rgba(99,214,188,.24)` ; cercles en 360 degres, polyligne en arc | FR-037 |
| Arrivees ennemies | 8 fleches (360 degres) ou 3 (arc, bord ouest), `rgba(232,84,63,.5)` | FR-037 |
| Relique | comme en combat, rayon 28, noyau plein de rayon 11 ; anneau pulse (fige si animations reduites) | FR-037 |
| Emplacement libre | hexagone 27 x 24, contour et remplissage leger de son type : bleu (vaisseau), vert (meca), valeurs provisoires en jetons CSS `--slot-ship` et `--slot-mech` | FR-038 |
| Emplacement occupe | hexagone `rgba(10,16,15,.92)`, contour de la couleur de ligne | FR-038 |
| Emplacement valide pendant un choix | contour epaissi et lueur du type | FR-039 |

Textes en DOM, par-dessus le canvas, dans `app/deploiement/` : "ARRIVÉES ENNEMIES — 360°" ou
"— BORD OUEST", "RELIQUE — OBJECTIF", et, dans chaque bouton d'emplacement occupe, nom court
(couleur de rarete), trait d'armement, effectif et PV, pastille de ligne, comme la maquette.

### Boutons d'emplacements (`app/deploiement/SlotButtons.svelte`)

Un `<button>` par emplacement propose, positionne par `fit.ts`, au-dessus du canvas :
`data-slot="<rang>"`, `data-slot-kind="ship|mech"`, `data-slot-line="front|back"`,
`aria-label` ("Emplacement vaisseau, première ligne, libre" ou "... occupé par <nom>"). Clic, Entree
et Espace suivent FR-039 ; Tab et les fleches parcourent les emplacements valides (FR-043). Le
glisser-deposer (Pointer Events, seuil de 4 px) part d'une ligne de la liste ou d'un bouton
d'emplacement et se depose sur un bouton (R18). Ils restent alignes sur la scene apres un
redimensionnement (meme `ResizeObserver` que la zone).

## Budget

60 entites, quelques dizaines de tirs et d'effets simultanes ; aucun filtre ni particule (phase P4
de la feuille de route) ; resolution = min(densite, 2) comme en phase P0 (`plan.md` §5).
