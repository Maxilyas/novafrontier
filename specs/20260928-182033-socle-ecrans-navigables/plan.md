# Implementation Plan: Socle de l'application : les 9 ecrans navigables et la scene

**Branch**: `ccr-ab1d36f1-5j9ozs` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/20260928-182033-socle-ecrans-navigables/spec.md`

## Summary

Cette feature realise la phase P0 de la feuille de route (`plan.md` §9, "P0 Socle"). Elle rend
les 9 ecrans de la maquette navigables et fideles, et installe une zone de scene qui s'affiche
avec ou sans WebGPU. Approche technique, detaillee dans `research.md` :

- monorepo pnpm limite a `apps/web`, `packages/data` et `packages/sim` (`plan.md` §8) ;
- application monopage Svelte 5 + Vite 8, une adresse par ecran par le fragment d'URL ;
- charte graphique portee du CSS de la maquette, illustrations generees portees en composants
  SVG, grille fluide avec un minimum de 1280x720 ;
- donnees de jeu et etat de demonstration dans `@nova/data`, en schemas zod. Les valeurs que
  la maquette calcule sont extraites d'elle et verifiees par un test oracle ;
  `@nova/sim` reste sans regle ;
- une application PixiJS 8.21 par scene, chargee a la demande, en WebGPU avec repli WebGL, un
  message si aucun des deux n'est disponible, et un contenu provisoire (fond etoile) ;
- verifications : Biome, `svelte-check`, Vitest, Playwright (trois modes de rendu), Lighthouse.
  La CI perd son garde-fou et tourne pour de vrai.

## Technical Context

**Language/Version**: TypeScript 6.0.3 en mode strict, sur Node 22 (22.19 ou plus).
TypeScript 7 est ecarte, car `svelte-check` ne l'accepte pas (R1).

**Primary Dependencies**: Svelte 5.57, Vite 8.3, @sveltejs/vite-plugin-svelte 7.3,
PixiJS 8.21, zod 4.6, @fontsource/oswald et @fontsource/share-tech-mono 5.3.

**Storage**: N/A. L'etat de demonstration vit en memoire, sans sauvegarde (FR-014).

**Testing**: Vitest 5 pour les tests unitaires ; Playwright 1.63 de bout en bout, avec trois
projets Chromium : repli, WebGPU, sans GPU. Lighthouse 13 pour SC-003, `svelte-check` 4.7 et
Biome 2.5 pour le reste.

**Target Platform**: navigateurs d'ordinateur, dernieres versions stables de Chrome, Edge,
Firefox et Safari, en WebGPU avec repli WebGL2, dans une fenetre d'au moins 1280x720.

**Project Type**: application web monopage, dans un monorepo pnpm : une application et deux
paquets.

**Performance Goals**:

- score Lighthouse superieur a 90 sur Escouades, profil ordinateur ;
- changement d'ecran en moins de 300 ms ;
- premiere scene en moins d'une seconde, retour sur une scene en moins de 300 ms ;
- 60 images/s, resolution de rendu plafonnee a 2.

**Constraints**:

- aucune requete vers un domaine tiers ;
- polices auto-hebergees ;
- PixiJS absent du chargement initial ;
- aucune regle de jeu hors de `packages/sim` ;
- mise en page fluide avec un minimum de 1280x720 ;
- respect de la preference "reduire les animations".

**Scale/Scope**: 9 ecrans, une quinzaine de primitives, 5 generateurs d'illustrations,
11 unites, 9 batiments, 32 noeuds de recherche, 16 planetes, 3 coffres, 3 scenes provisoires.
Pas de serveur.

Toutes les inconnues sont resolues dans `research.md` ; aucune "NEEDS CLARIFICATION" ne reste.

**Risques connus** :

- Chromium sans ecran choisit bien WebGPU, mais n'en restitue pas l'image. Les tests
  automatiques verifient donc le choix du mode ; l'image WebGPU se verifie a la main (R10).
- Le support Svelte de Biome est marque experimental (R14).
- Il faut verifier a l'implementation que Vite reecrit les liens de prechargement des polices
  (R13).
- Le Chromium du conteneur cloud (revision 1194) differe de celui de Playwright 1.63 (R15).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Application a cette feature | Avant recherche | Apres conception |
|---|---|---|---|
| I. `plan.md` fait autorite | Pile de §7 et arborescence de §8, en sous-ensemble. La phase P0 de la feuille de route est citee et ses criteres de §9 sont repris (section Verification). Trois precisions reportees dans `plan.md` et `WORKFLOW.md` par ce plan (R17) : hauteur minimale, routage par fragment, contenu des paquets en P0 | OK | OK |
| II. Simulation deterministe | `@nova/sim` ne contient que des types, et un test de purete le protege des maintenant. Aucune regle hors de la sim : les valeurs calculees sont des donnees extraites de la maquette (R9) | OK | OK |
| III. Interface en DOM, scenes en GPU | Interface en Svelte. Scenes Pixi pour la Carte, le Deploiement et le Combat, avec repli WebGL2 verifie. Les dessins d'interface que la maquette faisait en canvas 2D (arbre de recherche, apercu de formation) passent en SVG. La Base reste en DOM, la decision revenant a la phase P2 de la feuille de route | OK | OK |
| IV. Le serveur fait foi | Aucune economie cote client : les commandes d'une phase ulterieure n'ont aucun effet (R12). Les schemas zod sont dans `packages/data` | OK | OK |
| V. Verifier, ne pas supposer | Scripts `lint`, `typecheck`, `test` et `build` dans chaque paquet ; garde-fou de la CI retire. TypeScript strict, Biome, pnpm seul. Chaque critere de succes a sa verification (section Verification) | OK | OK |
| Budget de rendu | Resolution plafonnee a 2 sur ordinateur (`plan.md` §5) ; une image fixe si les animations sont reduites ; pas encore d'effets | OK | OK |
| Mise en page | Grille fluide, sans scene fixe mise a l'echelle ; minimum 1280x720 | OK | OK |
| Assets | Polices auto-hebergees ; pas de visuels definitifs ; la rarete reste une couleur | OK | OK |
| Configuration | Rien ne varie par environnement en phase P0 de la feuille de route (pas d'API) | N/A | N/A |
| Secrets | Aucun | OK | OK |

Verdict : porte franchie, avant la recherche comme apres la conception, sans ecart a
justifier.

## Verification

Principe V : comment chaque critere sera verifie. Les commandes sont detaillees dans
`quickstart.md`.

Criteres de la phase P0 de la feuille de route (`plan.md` §9) :

| Critere de `plan.md` §9 | Verification |
|---|---|
| `pnpm build` et CI verts | `tests.yml` sans garde-fou, vert sur la PR : lint, typecheck, test, build, Playwright, Lighthouse |
| 9 ecrans rendus en composants | `apps/web/src/app/*` ; parcours Playwright (SC-001) |
| Captures Playwright comparees a la maquette | script `captures` (application et maquette cote a cote), puis validation en equipe (SC-002) |
| Lighthouse performance > 90 sur Escouades | script `perf`, dans la CI (SC-003) |

Criteres de succes de la spec :

| Critere | Automatique | Manuel |
|---|---|---|
| SC-001 | parcours Playwright, en comptant les actions | - |
| SC-002 | captures produites par script | validation des 9 ecrans en equipe |
| SC-003 | Lighthouse dans la CI | - |
| SC-004 | changement d'ecran mesure dans Playwright, animations reduites | badge `?diag=1` sur le poste de reference, fondu compris |
| SC-005 | projets `repli` et `webgpu` : mode choisi ; image en repli | matrice des quatre navigateurs, dans les deux modes |
| SC-006 | projet `sans-gpu` : message dans chaque scene, navigation intacte | Chrome sans acceleration materielle |
| SC-007 | 9 ecrans a 4 tailles : chevauchements, defilement, remplissage | - |
| SC-008 | taille du canvas comparee a la zone et a la densite, apres redimensionnement | changement d'ecran de densite |
| SC-009 | 50 allers-retours : nombre d'applications, memoire | cadence au badge |
| SC-010 | journal des requetes pendant le parcours | - |
| SC-011 | test : aucune donnee de jeu en dur dans `apps/web/src` | renommer une unite et parcourir les ecrans |
| SC-012 | activation de chaque element `data-later-phase` | - |
| SC-013 | parcours au clavier ; avertissements d'accessibilite bloquants | - |
| FR-013 | test oracle contre la maquette | - |

## Project Structure

### Documentation (this feature)

```text
specs/20260928-182033-socle-ecrans-navigables/
├── spec.md              # /speckit-specify, puis /speckit-clarify
├── plan.md              # ce fichier
├── research.md          # phase 0
├── data-model.md        # phase 1
├── quickstart.md        # phase 1
├── contracts/           # phase 1 : routes, scene-host, data-package, sim-package, ui-testing
├── checklists/          # requirements.md (/speckit-specify)
└── tasks.md             # /speckit-tasks (pas encore cree)
```

### Source Code (repository root)

```text
package.json               # scripts racine (dev) ; packageManager pnpm@10.34.6 ; engines node >= 22.19
pnpm-workspace.yaml        # apps/*, packages/*
tsconfig.base.json         # strict, moduleResolution bundler, ES2023
biome.json                 # lint et format ; html.experimentalFullSupportEnabled (Svelte)
.github/workflows/tests.yml  # sans garde-fou ; pnpm lu dans packageManager ; + Playwright et Lighthouse

apps/web/                  # @nova/web (plan.md §8)
├── index.html             # point d'entree ; prechargement des polices
├── vite.config.ts  svelte.config.js  tsconfig.json  playwright.config.ts
├── src/
│   ├── main.ts
│   ├── App.svelte         # bandeau, ecran courant, voile de grain, message bref, badge de diagnostic
│   ├── app/               # ecrans : TopBar et MainNav, escouades/, atlas/, base/, recherche/,
│   │                      #   carte/, briefing/, deploiement/, combat/, butin/
│   ├── ui/                # design system : Panel, Btn, Bar, StatLine, KeyValue, Pill, Seg,
│   │   │                  #   Switch, Stars, OpenBadge, Toast, Icon, IconSprite, UnitCard
│   │   └── art/           # CommanderArt, ShipArt, MechArt, BuildingArt, WeaponGlyph, registry.ts
│   ├── scene/             # SceneHost.svelte, renderer.ts, render-mode.ts, scenes/placeholder.ts
│   ├── state/             # router.svelte.ts, selection.svelte.ts, toast.svelte.ts
│   └── styles/            # tokens.css, base.css, overlay.css, fonts.css
├── tests/
│   ├── unit/              # Vitest : routeur, correspondances, absence de donnees en dur
│   ├── e2e/               # Playwright : parcours, consultation, commandes a venir, tailles,
│   │                      #   scenes, cycle de vie, requetes, clavier
│   └── oracle/            # Playwright : valeurs de la maquette = valeurs derivees
└── scripts/               # captures.ts, lighthouse.mjs, extract-mockup.ts

packages/data/             # @nova/data (sideEffects: false)
├── src/
│   ├── index.ts  lookup.ts
│   ├── schemas/           # zod : rarete, armement, unite, escouade, batiment, recherche,
│   │                      #   planete, coffre, joueur, derive
│   ├── game/              # donnees portees de la maquette
│   └── demo/              # etat de demonstration ; derived.generated.json
└── tests/                 # schemas et invariants (data-model.md §7)

packages/sim/              # @nova/sim : types seulement en phase P0 de la feuille de route
├── src/index.ts
├── tsconfig.json          # sans la bibliotheque DOM
└── tests/purity.test.ts   # garde-fou du principe II
```

**Structure Decision** : l'arborescence est celle de `plan.md` §8, limitee a ce que la phase
P0 de la feuille de route demande. `apps/server` arrive en phase P5 de la feuille de route,
`packages/assets-src` en phase P3 de la feuille de route. `public/assets/`, produit par
AssetPack, n'existe pas encore : les illustrations restent les SVG generes de la maquette. Les
sous-dossiers d'ecrans de `src/app/` regroupent chaque ecran et ses sous-composants.

## Complexity Tracking

Aucun ecart a la constitution : section sans objet.
