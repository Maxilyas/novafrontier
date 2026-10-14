# Implementation Plan: Simulation du combat, plateau de deploiement et scene de combat

**Branch**: `feature/p1-simulation-combat` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/20261014-231011-simulation-combat/spec.md`

## Summary

Cette feature realise la phase P1 de la feuille de route (`plan.md` §9, "P1 Sim + combat"),
augmentee du plateau de deploiement que l'equipe a avance de la phase P2 (Clarifications de la
spec). Le joueur place sa flotte et sa force meca, lance un combat de defense de la relique qui se
deroule a l'ecran, joue les competences de son commandant, et peut revoir le combat a l'identique.
Approche technique, detaillee dans `research.md` :

- `@nova/sim` porte les regles de la maquette en entiers (virgule fixe 16.16, angles en 1/1024 de
  tour sur une table commitee, `xoshiro128**`, racine entiere), a pas fixe de 50 ms, avec une
  empreinte FNV-1a de 64 bits ; il calcule aussi les valeurs de briefing que la phase P0 avait
  figees ;
- `@nova/data` recoit les reglages du combat, les archetypes d'ennemis et l'effet type de chaque
  competence, arretes avec l'equipe ;
- cote client, un moteur sans Svelte possede l'horloge (independante de Pixi), le journal de
  commandes et le replay ; une projection en runes alimente le HUD ;
- deux scenes Pixi en formes provisoires : le combat (interpolation, designation des cibles) et le
  plateau, dont les emplacements sont des boutons DOM (clavier, texte, glisser-deposer) ;
- verification du determinisme sous Node et, par le mode navigateur de Vitest, dans Chromium,
  Firefox et WebKit ; Edge et Safari a la main par l'empreinte affichee ; combats de reference
  versionnes.

## Technical Context

**Language/Version**: TypeScript 6.0.3 strict, Node 22.19 ou plus (inchange depuis la phase P0).

**Primary Dependencies**: Svelte 5.57, Vite 8.3, PixiJS 8.21, zod 4.6 (inchanges). Ajouts de
developpement dans `packages/sim` : `@vitest/browser-playwright` 5.0.2 et `playwright` 1.63.0
(R1). Aucune nouvelle dependance d'execution ; `@nova/web` depend de `@nova/sim`, `@nova/sim` de
`@nova/data`.

**Storage**: N/A. Placement et combat en memoire pour la session ; rien n'est sauvegarde.

**Testing**: Vitest 5 sous Node (sim, data, web) et en mode navigateur pour le determinisme
(Chromium, Firefox, WebKit) ; Playwright 1.63 (projets `repli`, `webgpu`, `sans-gpu`) avec l'horloge
de page ; Lighthouse 13 ; `svelte-check` 4.7 ; Biome 2.5.

**Target Platform**: navigateurs d'ordinateur (Chrome, Edge, Firefox, Safari, dernieres versions),
WebGPU avec repli WebGL2, fenetre d'au moins 1280x720 ; Node 22 pour la sim (serveur en phase P5).

**Project Type**: application web monopage dans un monorepo pnpm (une application, deux paquets).

**Performance Goals**:

- scene de combat a 60 images/s avec 60 entites sur le poste de reference (SC-005) ;
- 1 200 pas a 60 entites en moins de 50 ms hors navigateur (SC-006) ;
- score Lighthouse > 90 sur Escouades maintenu (la sim entre dans le chargement initial pour les
  valeurs d'escouade ; elle reste petite et sans effet de bord).

**Constraints**:

- principe II : entiers seulement dans la sim, aucune fonction transcendante, aucune horloge,
  aucun tirage hors graine ; purete verifiee par test ;
- la scene ne modifie jamais le combat ; les actions passent par le journal de commandes ;
- aucun texte d'interface dans le canvas (textes du plateau en DOM) ;
- combat qui avance sans acceleration graphique et sous "reduire les animations" ;
- aucune requete vers un domaine tiers (inchange).

**Scale/Scope**: 1 regle de combat, 15 competences, 4 archetypes d'ennemis, 2 formations
(16 et 13 emplacements), 2 theatres, 2 scenes Pixi, 6 ecrans touches (Escouades, Carte, Briefing,
Deploiement, Combat, plus le badge de diagnostic), au moins 120 combats de reference.

Aucune "NEEDS CLARIFICATION" ne reste : les inconnues sont tranchees dans `research.md`.

**Risques connus** :

- precision des formules de briefing : les arrondis flottants de la maquette sont reproduits en
  rationnels exacts ; un cas limite d'arrondi peut apparaitre au test de R9 et se traite alors
  explicitement ;
- performance de la sim en Node sur les machines de la CI (seuil de 50 ms) : mediane apres
  echauffement ; si la CI s'averait plus lente que le poste de reference, le seuil de la CI serait
  documente a part ;
- Safari reel n'est verifie qu'a la main (R10) ;
- l'horloge de page de Playwright doit aussi piloter le ticker de Pixi ; a verifier des la premiere
  tache de bout en bout, sinon le test avance l'horloge du moteur seul et laisse la scene hors du
  test de duree.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Application a cette feature | Avant recherche | Apres conception |
|---|---|---|---|
| I. `plan.md` fait autorite | Pile de §7 et arborescence de §8 (`packages/sim`, `packages/data`, `apps/web/src/{scene,state,ui,app}`). La phase P1 est citee et ses criteres de §9 repris (section Verification). Le plateau de deploiement passe de P2 a P1 et les precisions de mise en oeuvre de §6 sont reportees dans `plan.md` par ce plan (R16) | OK | OK |
| II. Simulation deterministe | Regles dans `@nova/sim` seulement, en entiers ; pas fixe de 50 ms ; RNG seede ; table trigonometrique commitee ; purete etendue (R2) ; tests : meme graine meme empreinte, combats de reference, proprietes, performance, et cross-moteurs (R10, R11, R15) | OK | OK |
| III. Interface en DOM, scenes en GPU | HUD, fenetres, liste et boutons d'emplacements en DOM ; scenes Pixi pour le plateau et le combat, repli WebGL2 garde ; la scene lit l'etat et les evenements, la designation passe par le journal ; aucun texte d'interface dans le canvas | OK | OK |
| IV. Le serveur fait foi | Rien n'est credite ; graine tiree par le client faute de serveur (P5 la fournira) ; `createCombat` valide placement et commandes, pret pour la re-simulation serveur ; reglages et competences valides par les schemas zod de `@nova/data` | OK | OK |
| V. Verifier, ne pas supposer | Scripts `lint`, `typecheck`, `test`, `build` ; nouveau `test:browsers` ajoute a la CI et a `CLAUDE.md` ; chaque critere de succes a sa verification | OK | OK |
| Budget de rendu | 60 entites, aucun filtre ni particule, resolution min(densite, 2) (`plan.md` §5) ; animations decoratives figees si reduites | OK | OK |
| Mise en page | ecrans existants ; scenes mises a l'echelle uniformement dans leur zone, boutons DOM alignes | OK | OK |
| Assets | formes provisoires ; couleurs des emplacements en jetons CSS ; rarete en couleur | OK | OK |
| Configuration | aucune valeur par environnement (pas d'API) | N/A | N/A |
| Secrets | aucun | OK | OK |

Verdict : porte franchie avant la recherche comme apres la conception, sans ecart a justifier.

## Verification

Principe V : comment chaque critere sera verifie. Commandes et gestes : `quickstart.md`.

Criteres de la phase P1 de la feuille de route (`plan.md` §9) :

| Critere de `plan.md` §9 | Verification |
|---|---|
| Meme seed -> meme hash sur Chrome, Firefox, Safari et Node | combats de reference sous Node (`test`) et Chromium, Firefox, WebKit (`test:browsers`, CI) ; Edge et Safari a la main par l'empreinte de la resolution automatique (`quickstart.md`) |
| 60 fps avec 60 entites (overlay de stats) | `?diag=1&charge=1#/combat` sur le poste de reference ; Playwright verifie seulement que 60 entites sont atteintes |
| Un replay se rejoue a l'identique | tests de replay de la sim ; "Revoir le combat" en Playwright, empreintes comparees |

Criteres de succes de la spec :

| Critere | Automatique | Manuel |
|---|---|---|
| SC-001 | Playwright : parcours complet jusqu'a la fenetre de fin, horloge de page | parcours a la souris |
| SC-002 | Vitest Node et navigateurs sur au moins 120 combats de reference | Edge et Safari, 3 empreintes chacun |
| SC-003 | Vitest : replay de chaque combat de reference ; Playwright : "Revoir le combat" | - |
| SC-004 | Vitest : horloge a 60, 120 et 144 Hz simulees ; Playwright : repli, tailles, onglet masque | - |
| SC-005 | Playwright : au moins 60 entites atteintes | cadence au releve, poste de reference |
| SC-006 | Vitest : mediane de 5 executions sous 50 ms | - |
| SC-007 | Vitest : 10 000 combats tires au hasard | - |
| SC-008 | Vitest : sim = `derived.generated.json` (ecarts admis) ; Playwright : oracle de la maquette | - |
| SC-009 | Playwright : HUD, fenetre de fin et releve egaux a l'etat final | - |
| SC-010 | captures de Deploiement et de Combat | relecture en equipe, essai des 15 competences (3 commandants hors demonstration par un test de regles) |
| SC-011 | Playwright : placement a la souris, au glisser-deposer et au clavier, nombre d'actions, positions en combat | - |
| SC-012 | Vitest : placement automatique pour chaque escouade et theatre | - |

## Project Structure

### Documentation (this feature)

```text
specs/20261014-231011-simulation-combat/
├── spec.md              # /speckit-specify, puis /speckit-clarify et ajout du plateau
├── plan.md              # ce fichier
├── research.md          # phase 0 : R1 a R18
├── data-model.md        # phase 1
├── quickstart.md        # phase 1
├── contracts/           # sim-package, combat-runtime, scenes, data-package, ui-testing
├── checklists/          # requirements.md (/speckit-specify)
└── tasks.md             # /speckit-tasks (pas encore cree)
```

### Source Code (repository root)

```text
plan.md                      # §6 precise, §9 : plateau de deploiement en P1 (R16)
CLAUDE.md                    # + pnpm --filter @nova/sim test:browsers
WORKFLOW.md                  # §1 et §5 a jour a l'implementation
.github/workflows/tests.yml  # installe chromium, firefox, webkit ; lance test:browsers

packages/data/src/
├── schemas/combat.ts        # reglages, archetypes, menaces, types d'emplacement
├── schemas/unit.ts          # skillSchema : target, effect
├── game/combat.ts           # combatTuning, enemyArchetypes
└── game/units.ts            # 15 competences completees ; description de Bouclier de flotte

packages/sim/
├── package.json             # dependance @nova/data ; scripts test:browsers, golden:update, trig:generate
├── vitest.config.ts         # projets node et navigateurs (Chromium, Firefox, WebKit)
├── scripts/                 # trig-table.mjs, golden-update.test.ts (lance par golden:update)
├── src/
│   ├── index.ts
│   ├── fixed.ts             # 16.16, fmul, fdiv, isqrt, distances au 1/256
│   ├── trig.ts  trig-table.ts
│   ├── rng.ts               # xoshiro128**, splitmix32
│   ├── fingerprint.ts       # FNV-1a, deux voies
│   ├── tuning.ts            # conversion des reglages de @nova/data en pas et en 16.16
│   ├── formation.ts         # formationSlots, engagedUnits, autoPlacement, validatePlacement
│   ├── waves.ts             # wavesFor, apparition
│   ├── skills.ts            # effets des competences
│   ├── combat.ts            # createCombat, step, runCombat, loadScenario
│   ├── events.ts  types.ts
│   └── briefing.ts          # squadSummary, route, briefing, ultimateStatus
└── tests/
    ├── purity.test.ts       # etendu (R2)
    ├── fixed.test.ts  trig.test.ts  rng.test.ts  fingerprint.test.ts
    ├── formation.test.ts    # SC-012
    ├── rules/               # une suite par regle du deroulement et par competence
    ├── briefing.test.ts     # sim = derived.generated.json (SC-008)
    ├── golden.test.ts       # combats de reference (SC-002), aussi en navigateurs
    ├── replay.test.ts       # SC-003
    ├── properties.test.ts   # SC-007
    ├── performance.test.ts  # SC-006
    └── golden/combats.json

apps/web/src/
├── scene/
│   ├── renderer.ts  types.ts          # module par scene, animateWhenReducedMotion, options
│   └── scenes/
│       ├── fit.ts                     # mise a l'echelle commune
│       ├── combat/                    # index.ts, draw.ts, effects.ts, designation.ts
│       └── deploy/                    # index.ts, draw.ts
├── state/
│   ├── combat-runtime.ts              # horloge, session, commandes, replay, designation
│   ├── combat.svelte.ts               # projection pour le HUD
│   ├── combat-log.ts                  # evenements -> lignes du journal
│   ├── deployment.svelte.ts           # placements, interrupteur, choix, glisser-deposer
│   └── team-params.ts                 # graine, diag, charge
├── ui/Modal.svelte
├── app/
│   ├── combat/                        # WaveBar, Forces, CombatLog, ActionBar branches ; EndModal ; Combat.svelte
│   ├── deploiement/                   # SlotButtons, UnitPool, Assistance, Disposition, ObjectivePanel, Legend
│   ├── briefing/                      # Simulation (resolution), DeployPrefs (interrupteur), AutoResolveModal
│   ├── escouades/  carte/             # valeurs lues dans @nova/sim
│   └── DiagBadge.svelte               # releve de mesures du combat
└── styles/tokens.css                  # --slot-ship, --slot-mech

apps/web/tests/
├── unit/                    # combat-log, horloge du moteur, fit, deployment
└── e2e/                     # deploiement.spec, combat.spec, replay.spec, auto-resolve.spec,
                             #   combat-lifecycle.spec, determinism.spec, load.spec ; later-phase.spec ajuste
```

**Structure Decision** : celle de `plan.md` §8, sans nouveau paquet. Les regles et leurs tests vont
dans `packages/sim`, les valeurs dans `packages/data`, l'horloge et l'etat dans
`apps/web/src/state`, les scenes dans `apps/web/src/scene/scenes`. `apps/server` reste pour la phase
P5 de la feuille de route.

## Complexity Tracking

Aucun ecart a la constitution : section sans objet.
