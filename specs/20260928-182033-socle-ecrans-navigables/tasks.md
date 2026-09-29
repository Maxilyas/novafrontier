---

description: "Liste des taches de la feature socle-ecrans-navigables (phase P0 de la feuille de route)"
---

# Tasks: Socle de l'application : les 9 ecrans navigables et la scene

**Input**: Design documents from `/specs/20260928-182033-socle-ecrans-navigables/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: inclus. Le principe V de la constitution et la section Verification du plan en font
la preuve des criteres de succes. Dans chaque story, les tests s'ecrivent d'abord et doivent
echouer avant l'implementation.

**Organization**: une phase par user story de `spec.md` (US1 a US4), precedee d'une
preparation et d'un socle bloquant, suivie des finitions. "Phase N" designe une etape de ce
fichier, jamais une phase de la feuille de route (`CLAUDE.md`).

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallelisable (fichiers differents, aucune dependance sur une tache non terminee)
- **[Story]** : story servie (US1 a US4)
- Les numeros de ligne renvoient a `nova-frontier-v2.html` (la maquette, a la racine).
- Les textes et valeurs a reproduire sont ceux de la maquette, accents compris ; les litteraux
  de code entre accents graves sont exacts.

## Path Conventions

Arborescence de `plan.md` (section Project Structure) : `apps/web/`, `packages/data/`,
`packages/sim/`, fichiers de configuration a la racine.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: monorepo pnpm, outillage et CI qui tourne pour de vrai (research R1, R2, R14, R15)

- [X] T001 Creer `package.json` a la racine (`"name": "novafrontier"`, `"private": true`, `"type": "module"`, `"packageManager": "pnpm@10.34.6"`, `"engines": { "node": ">=22.19" }`, script `"dev": "pnpm --filter @nova/web dev"`) et `pnpm-workspace.yaml` (`packages: ['apps/*', 'packages/*']`)
- [X] T002 [P] Creer `tsconfig.base.json` a la racine : `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`, `isolatedModules`, `module: "ESNext"`, `moduleResolution: "bundler"`, `target: "ES2023"`, `lib: ["ES2023"]`, `resolveJsonModule`, `skipLibCheck`, `noEmit`
- [X] T003 [P] Creer `biome.json` a la racine :
  - formateur en espaces, indentation 2, largeur 100, guillemets simples en JS et TS ;
  - linter `recommended` ;
  - `"html": { "experimentalFullSupportEnabled": true }` (research R14) ;
  - `vcs.useIgnoreFile: true` ;
  - fichiers exclus : `nova-frontier-v2.html`, `**/*.generated.json`, `**/dist`, `apps/web/captures`, `**/test-results`, `**/playwright-report`.
- [X] T004 [P] Creer le paquet `packages/data/` :
  - `package.json` : `"name": "@nova/data"`, `"type": "module"`, `"sideEffects": false`, `"exports": { ".": "./src/index.ts" }`. Dependance `zod@4.6.5` ; devDependencies `typescript@6.0.3`, `vitest@5.0.2`, `@biomejs/biome@2.5.14`. Scripts `"lint": "biome check ."`, `"typecheck": "tsc --noEmit -p tsconfig.json"`, `"test": "vitest run --passWithNoTests"` ;
  - `tsconfig.json` : etend `../../tsconfig.base.json`, `include: ["src", "tests"]` ;
  - `src/index.ts` avec `export {}`.
- [X] T005 [P] Creer le paquet `packages/sim/` :
  - `package.json` : `"name": "@nova/sim"`, memes scripts et devDependencies que T004, plus `"@nova/data": "workspace:*"` pour les imports de types ;
  - `tsconfig.json` : etend la base, `lib: ["ES2023"]` sans `DOM`, `types: []` ;
  - `src/index.ts` avec `export {}` ;
  - voir `contracts/sim-package.md`.
- [X] T006 Creer l'application `apps/web/`.
  - `package.json` : `"name": "@nova/web"`, `"type": "module"`.
    - Dependances : `svelte@5.57.1`, `pixi.js@8.21.0`, `@fontsource/oswald@5.3.0`, `@fontsource/share-tech-mono@5.3.0`, `"@nova/data": "workspace:*"`.
    - devDependencies : `vite@8.3.1`, `@sveltejs/vite-plugin-svelte@7.3.1`, `svelte-check@4.7.6`, `typescript@6.0.3`, `vitest@5.0.2`, `@playwright/test@1.63.0`, `lighthouse@13.5.0`, `chrome-launcher` (version requise par lighthouse 13), `@biomejs/biome@2.5.14`.
    - Scripts : `"dev": "vite"`, `"build": "vite build"`, `"preview": "vite preview --port 4173 --strictPort"`, `"lint": "biome check ."`, `"typecheck": "svelte-check --fail-on-warnings --tsconfig ./tsconfig.json"`, `"test": "vitest run --passWithNoTests"`, `"test:e2e": "playwright test"`, `"perf": "node scripts/lighthouse.mjs"`, `"captures": "node scripts/captures.mjs"`, `"mockup:extract": "node scripts/extract-mockup.mjs"`.
  - `vite.config.ts` : plugin `svelte()`.
  - `svelte.config.js` : `compilerOptions.runes: true`.
  - `tsconfig.json` : etend la base, `lib: ["ES2023", "DOM", "DOM.Iterable"]`, `include: ["src", "tests"]`.
  - `src/vite-env.d.ts` : references `svelte` et `vite/client`.
  - `index.html` : `lang="fr"`, titre "NOVA FRONTIER", `<div id="app">`.
  - `src/main.ts` et `src/App.svelte` minimaux.
- [X] T007 Installer les dependances avec `pnpm install`, commiter `pnpm-lock.yaml` (jamais de `package-lock.json`), puis verifier que `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` et `pnpm -r build` passent sur ce squelette
- [X] T008 [P] Completer `.gitignore` avec `test-results/`, `playwright-report/`, `apps/web/captures/` et `apps/web/.lighthouse/`
- [X] T009 Mettre a jour `.github/workflows/tests.yml` :
  - supprimer l'etape "Detecte le projet" et toutes les conditions `if: steps.detect.outputs.found == 'true'` ;
  - retirer `with: version: 10` de `pnpm/action-setup`, la version venant de `packageManager` (research R15) ;
  - garder le nom du job "Tests & Lint", exige par le ruleset de `main` (piege 3 de `WORKFLOW.md`).

  Les etapes Playwright et Lighthouse viennent en T087.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: donnees de jeu, types de la sim, charte graphique, routeur, etat et outillage de test dont toutes les stories dependent

**⚠️ CRITICAL**: aucune story ne commence avant la fin de cette phase

### `@nova/data` : schemas (data-model.md §1 et §2)

- [X] T010 Creer `packages/data/src/schemas/common.ts` : enumerations zod de data-model.md §1, avec les valeurs exactes de la maquette :
  - `RarityId` : `'com' | 'rare' | 'epic' | 'leg' | 'div'` ;
  - `WeaponId` : `'las' | 'art' | 'nuc' | 'ion' | 'cin'` ; `ActiveWeaponId` : `'las' | 'art' | 'nuc'` ;
  - `UnitFamily` : `'cmd' | 'ship' | 'mech'` ;
  - `Armor` : `'Léger' | 'Moyen' | 'Lourd'` ; `Engine` : `'Standard' | 'Léger' | 'Subspatial'`, nullable ;
  - `Formation` : `'ring' | 'arc'` ; `Theatre` : `'orbital' | 'sol'` ; `ActionPointsMode` : `'fixe' | 'achat'` ;
  - `ResearchTreeId` : `'arm' | 'flotte' | 'cmdt'` ; `ResearchState` : `'done' | 'active' | 'lock'` ;
  - `PlanetStatus` : `'BASE' | 'CONTRÔLE' | 'HOSTILE' | 'NEUTRE' | 'MARCHAND' | 'INEXPLORÉ'` ;
  - `IconId` : les 37 ids `ic-*` des lignes 632-668 ;
  - `ScreenId` : les 9 ecrans de `contracts/routes.md` ;
  - un schema de couleur `#rrggbb`.
- [X] T011 [P] Creer `packages/data/src/schemas/rarity.ts` et `packages/data/src/schemas/weapon.ts` :
  - `raritySchema` : "`maxStars` entier 2 a 6", "`actionPoints` entier 2 a 5", `legendarySlot` booleen ;
  - `weaponSchema` : `symbol` d'un caractere, `status` `'active' | 'planned'` ;
  - `damageMatrixSchema` : "les 9 cases remplies, multiplicateurs strictement positifs" ;
  - `enemySchema` : `{ weapon, armor, siteDefense }`.
- [X] T012 [P] Creer `packages/data/src/schemas/unit.ts` : union discriminee `unitSchema` sur `family`.
  - Champs communs : `id`, `visual` entier >= 0, `rarity`, `name`, `role`, `code`, `level` entier >= 1, `stars` entier >= 1.
  - `commanderSchema` : `squadBonuses` (au moins 1), `skills` (1 a 5 `{ name, icon, description }`), `legendarySkill?`.
  - `combatantSchema` : `formation` `'unite' | 'escadrille'`, `count` et `maxCount` entiers >= 1, `weapon` actif, `armor`, `engine`, `tier` 1 a 4, `carrier` booleen, `stats { hp, attack, defense, range, speed }` entiers > 0.
  - Raffinements : "`unite` implique `count = maxCount = 1`", "`count <= maxCount`", "`engine` nul si et seulement si `family = 'mech'`".
- [X] T013 [P] Creer les schemas `packages/data/src/schemas/building.ts`, `research.ts`, `planet.ts` et `crate.ts`, d'apres data-model.md §2 :
  - `buildingSchema` : `position { x, y, width }`, `upgrade { alloy, credits, duration, effect }` ;
  - `researchNodeSchema` : `level { current, max }` avec `current <= max` ; `cost.artefacts` present si et seulement si `legendary` ;
  - `researchTreeSchema`, `planetSchema`, `planetIncomeSchema` ;
  - `crateSchema` : `odds` de somme 100, a 0,01 pres.
- [X] T014 Creer `packages/data/src/schemas/squad.ts` et `packages/data/src/schemas/player.ts`, d'apres data-model.md §3 ; depend de T011 pour `enemySchema` :
  - `squadSchema` : `commander` id ou `null`, `ships` tuple de 3 id ou `null`, `mechs` tuple de 2, `defaultFormation`, `lockedUntilRank?` ;
  - `demoStateSchema` : `profile`, `resources`, `pendingIncome`, 5 `squads`, `researchQueue` de 3 emplacements (2 en cours `{ label, icon, progress, remaining }` et 1 libre `{ label }`), `mission`, `defaults`.
- [X] T015 Creer `packages/data/src/schemas/index.ts` : re-exporter schemas et types (`z.infer`) sous les noms de `contracts/data-package.md`
- [X] T016 Ecrire les tests `packages/data/tests/schemas.test.ts` (chaque constante exportee passe son schema) et `packages/data/tests/invariants.test.ts` (invariants 1 a 5 de data-model.md §7). Ils doivent echouer tant que T017-T024 manquent.

### `@nova/data` : donnees portees de la maquette

- [X] T017 [P] Creer `packages/data/src/game/rarities.ts` (`RAR`, lignes 868-874) et `packages/data/src/game/weapons.ts` (`WEP` lignes 879-885, `MATRIX` ligne 887, `ENEMY` ligne 1805)
- [X] T018 [P] Creer `packages/data/src/game/units.ts` : les 11 unites de `POOL` (lignes 1017-1066).
  - Correspondance des champs :
    - `k`→`family`, `i`→`visual`, `r`→`rarity`, `n`→`name`, `lv`→`level`, `s`→`stars` ;
    - `bonus`→`squadBonuses`, `sk`→`skills`, `leg`→`legendarySkill` ;
    - `form`→`formation` (`'unité'` devient `'unite'`), `qty`→`count`, `qmax`→`maxCount`, `w`→`weapon`, `arm`→`armor` ;
    - `eng`→`engine` (`'—'` devient `null`), `carrier`→booleen ;
    - `st`→`stats` (`pv`→`hp`, `atk`→`attack`, `def`→`defense`, `rng`→`range`, `spd`→`speed`).
  - Les commandants n'ont pas de `stats`.
- [X] T019 [P] Creer `packages/data/src/game/buildings.ts` : `BUILDINGS` (lignes 1439-1458) et `buildingSlots = { used: 9, total: 12 }`. Pour chaque rang i, `upgrade` vaut : alliage `28000 + i*4200`, credits `1800 + i*260`, duree `'04:12:30'`, effet `'+14% rendement'`.
- [X] T020 [P] Creer `packages/data/src/game/research.ts` : les 3 arbres de `TREES` (lignes 1523-1566).
  - `lv: '2/4'` devient `level: { current: 2, max: 4 }` ; `s`→`state`, `pr`→`prerequisites`, `open`→`openDecision`, `leg`→`legendary`.
  - Couts, d'apres l'abscisse x : alliage `18000 + x*22`, credits `2200 + x*3`, `artefacts: 3` si legendaire, duree `` `0${1 + (x % 5)}:24:00` ``, `labLevel = 4 + 2*prerequisites.length`, effet `'+8% rendement'`.
- [X] T021 [P] Creer `packages/data/src/game/planets.ts` :
  - les 16 planetes de `PLANETS` (lignes 1644-1661) ; `id` = nom en minuscules, sans accent ni apostrophe, espaces en tirets (`gemenon`, `ruines-d-erebe`, `lune-de-tauron`...) ;
  - `planetIncome` d'apres `INCOME` (lignes 1459-1463).
- [X] T022 Creer `packages/data/src/game/crates.ts` : `CRATES` (lignes 2380-2390) et `launchPool` (unites groupees en `com`, `rare`, `div`, plus 4 cases verrouillees : 2 `epic`, 2 `leg`) ; depend de T018
- [X] T023 Creer `packages/data/src/demo/state.ts` : `demoState` d'apres data-model.md §3.
  - Profil (lignes 673-697) : "CDR. A. GOMÈS", "Commodore · Escadre de Caprica", badge "G4", niveau 47, progression 0.64, prochain ultime 50.
  - Ressources (lignes 699-711) et cumul : 14280 sur 27300, "3 j 16 h avant plafond", jauge 52 %.
  - Escouades : `SQUADS` (lignes 1070-1076), ids `alpha` a `echo`, "Grade 5" et "Grade 6" pour Delta et Echo.
  - File de recherche : lignes 1625-1635.
  - Mission : cible `gemenon`, `enemy`, relique 1000, portee 900, moteur `'Standard'` a 1,0 u/UA.
  - `defaults` : escouade `alpha`, filtre `cmd`, points d'action `fixe`, theatre `orbital`, Atlas `{ unit: 's1', tier: 2, weapon: 'las' }`, batiment `hq`, arbre `arm`, noeud `a2`.
- [X] T024 Creer `packages/data/src/lookup.ts` (`unitById`, `rarityById`, `weaponById`, `planetById`, `nodeById` : lectures pures, sans regle de jeu) et completer `packages/data/src/index.ts` avec les exports de `contracts/data-package.md`, sauf `derivedValues` (ajoute en T054). Faire passer T016.

### `@nova/sim` : types et purete (contracts/sim-package.md)

- [X] T025 [P] Ecrire `packages/sim/tests/purity.test.ts` :
  - parcourir `packages/sim/src/**/*.ts` et echouer sur `Math.random`, `Math.sin`, `Math.cos`, `Math.atan2`, `Math.hypot`, `Date.now`, `new Date`, `performance.now`, `window`, `document` ou `navigator` ;
  - verifier que `packages/sim/tsconfig.json` n'inclut pas `DOM`.
- [X] T026 [P] Ecrire `packages/sim/src/index.ts` : types `Tick`, `Fixed`, `Angle`, `SimInput`, `WaveSpec`, `SimCommand`, `SimEventType`, `SimEvent`, `SimSnapshot` de `contracts/sim-package.md`, avec des `import type` depuis `@nova/data`, sans code execute

### `apps/web` : charte, routeur, etat, outillage

- [X] T027 [P] Creer les feuilles de style de la charte (sans `#stage` ni mise a l'echelle) :
  - `apps/web/src/styles/tokens.css` : bloc `:root` des lignes 17-48, a l'identique ;
  - `apps/web/src/styles/base.css` : lignes 49-58 (remise a zero, `body`, `::selection`, `button`, `:focus-visible`), primitives des lignes 74-146 et regle `prefers-reduced-motion` des lignes 622-624 ;
  - `apps/web/src/styles/overlay.css` : grain des lignes 68-72 applique a un element fixe couvrant toute la fenetre, `pointer-events: none`, au-dessus des scenes (FR-009).
- [X] T028 [P] Mettre en place les polices (research R13) :
  - `apps/web/src/styles/fonts.css` importe `@fontsource/oswald/300.css`, `400.css`, `500.css`, `600.css` et `@fontsource/share-tech-mono/400.css` ;
  - `apps/web/index.html` precharge `oswald-latin-400-normal.woff2` et `share-tech-mono-latin-400-normal.woff2` (`<link rel="preload" as="font" type="font/woff2" crossorigin>`) ;
  - verifier dans `apps/web/dist/` que ces liens pointent vers les fichiers produits ; sinon copier les deux WOFF2 dans `apps/web/src/assets/fonts/` et y pointer ;
  - aucune reference a `fonts.googleapis.com`.
- [X] T029 [P] Creer `apps/web/src/ui/IconSprite.svelte` (les 37 `<symbol>` des lignes 632-668 dans un `<svg>` masque, `aria-hidden="true"`) et `apps/web/src/ui/Icon.svelte` (props `icon: IconId`, `size`, `stroke` ; `<svg aria-hidden="true"><use href="#..." /></svg>`)
- [X] T030 Creer le message bref :
  - `apps/web/src/state/toast.svelte.ts` : `showToast(text)`, un seul message a la fois, 2,6 s ;
  - `apps/web/src/ui/Toast.svelte` : `role="status"`, `aria-live="polite"`, style de `toast()` des lignes 2430-2434 ;
  - texte des commandes d'une phase ulterieure : `'Pas encore disponible'`.
- [X] T031 [P] Creer les primitives de mise en forme, d'apres les lignes 74-146 :
  - `apps/web/src/ui/Panel.svelte` : `.panel.notched`, en-tete `.hd` (point, titre, texte de droite `.rt`), attribut `data-panel` ;
  - `apps/web/src/ui/Bar.svelte` : variantes `k`, `r`, `g`, largeur en % ;
  - `apps/web/src/ui/StatLine.svelte` : libelle, barre, valeur ;
  - `apps/web/src/ui/KeyValue.svelte`, `apps/web/src/ui/Pill.svelte` (variantes `s`, `g`, `w`, `k`), `apps/web/src/ui/Stars.svelte` (n sur max, couleur de rarete), `apps/web/src/ui/OpenBadge.svelte` (badge `.open`).
- [X] T032 Creer les primitives d'action, qui dependent de T030 :
  - `apps/web/src/ui/Btn.svelte` : variantes `solid`, `ghost`, `gold` ; `href` pour un lien `<a>` (commandes de parcours) ; `disabled` ; prop `laterPhase: { code, label }` qui pose `data-later-phase={code}` et affiche le message bref au clic (research R12) ;
  - `apps/web/src/ui/Seg.svelte` : boutons `aria-pressed`, `onchange` ;
  - `apps/web/src/ui/Switch.svelte` : `role="switch"`, `aria-checked`, prop `laterPhase`.
- [X] T033 [P] Porter les illustrations generees en composants (research R7) :
  - `apps/web/src/ui/art/CommanderArt.svelte`, `ShipArt.svelte` et `MechArt.svelte` : `cmdArt`, `shipArt`, `mechArt` des lignes 897-1009 ; props `visual`, `color`, `tier`, `weapon` ;
  - `apps/web/src/ui/art/BuildingArt.svelte` : `bldgSVG`, lignes 1386-1438 ;
  - `apps/web/src/ui/art/WeaponGlyph.svelte` : `weaponGlyph`, lignes 1375-1382 ;
  - tous les identifiants de degrade sont suffixes par `$props.id()`, et tout SVG porte `aria-hidden="true"` ;
  - `apps/web/src/ui/art/registry.ts` : ensemble des cles de visuels deja rendus (famille, visuel, couleur, palier, arme, comme `art()` ligne 894) et compteur reactif.
- [X] T034 Creer `apps/web/src/ui/UnitCard.svelte` (depend de T033) : portage de `cardHTML` (lignes 1090-1097) et de son CSS (lignes 213-251).
  - Tailles `mini`, `mid`, `big` ; cadre `--rc` de la rarete ; rarete, niveau, nom, etoiles, effectif ; etat `sel`.
  - La carte est un `<button>` quand elle porte une action.
  - Prop `onFiche` : bouton "Fiche" visible au survol et au focus (research R16).
- [X] T035 Creer le routeur `apps/web/src/state/router.svelte.ts` d'apres `contracts/routes.md`, ses tests `apps/web/tests/unit/router.test.ts` (analyse, redirections, sections) et `apps/web/vitest.config.ts` (environnement `node`, `include: ['tests/unit/**/*.test.ts']`). Le routeur porte :
  - la table des 9 ecrans et le parametre d'unite de l'Atlas ;
  - la section de navigation de chaque ecran ;
  - `navigate()` ;
  - le remplacement, sans entree d'historique, des adresses vides ou inconnues et des unites inconnues ;
  - l'ecoute de `hashchange` et la lecture de `diag` et `rendu` dans `location.search`.
- [X] T036 Creer l'etat de consultation `apps/web/src/state/selection.svelte.ts` et ses tests `apps/web/tests/unit/selection.test.ts`, d'apres data-model.md §5 :
  - valeurs initiales tirees de `demoState.defaults` ;
  - regles : "choisir une escouade verrouillee ne change rien", "choisir un emplacement vide fixe `rosterFilter` a sa famille", ouvrir l'Atlas sur un vaisseau ou un meca aligne `atlas.tier` et `atlas.weapon` sur l'unite ;
  - formation propre a chaque escouade, partagee entre les ecrans.
- [X] T037 Assembler la coquille : `apps/web/src/App.svelte` (sprite d'icones, emplacement du bandeau, zone d'ecran, voile de grain, message bref) et `apps/web/src/main.ts` (styles, montage). Mise en page racine (research R5) : bandeau en haut, zone d'ecran en dessous, `min-width: 1280px`, `min-height: 720px`, la page defilant en dessous de ces dimensions.
- [X] T038 Configurer Playwright dans `apps/web/playwright.config.ts` et ecrire les aides `apps/web/tests/e2e/helpers.ts` (`gotoScreen`, `expectScreen`, `laterPhaseControls`, journal des requetes).
  - `webServer` : `pnpm build && pnpm preview` ; `baseURL` `http://localhost:4173`.
  - `launchOptions.executablePath` = `process.env.PW_CHROMIUM_EXECUTABLE` quand elle est definie.
  - Projets :
    - `repli` : argument `--js-flags=--expose-gc`, tous les tests ;
    - `webgpu` : `--enable-unsafe-webgpu` ;
    - `sans-gpu` : `--disable-gpu`, `--disable-software-rasterizer`.

    Les deux derniers sont limites a `tests/e2e/scene-modes.spec.ts`.

**Checkpoint**: socle pret ; les stories peuvent commencer

---

## Phase 3: User Story 1 - Parcourir les 9 ecrans (Priority: P1) 🎯 MVP

**Goal**: les 9 ecrans existent et se rejoignent par les chemins du jeu (bandeau, fiche Atlas, parcours de mission), avec une adresse par ecran

**Independent Test**: depuis l'ouverture, atteindre chacun des 9 ecrans sans barre d'adresse ; verifier le titre de l'ecran et l'entree mise en evidence ; rouvrir chaque ecran par son adresse (story 1 de `spec.md`)

### Tests for User Story 1 ⚠️

> **Ecrire ces tests d'abord ; ils doivent echouer avant l'implementation**

- [X] T039 [P] [US1] Ecrire `apps/web/tests/e2e/navigation.spec.ts` :
  - scenarios 1 a 6 de la story 1 ;
  - SC-001 : nombre d'actions par ecran, soit Escouades 0, Atlas, Base, Recherche, Carte et Butin 1, Briefing 2, Deploiement 3, Combat 4 ;
  - `aria-current="page"` selon FR-003 ;
  - redirections : `#/inconnu` vers `#/escouades` sans nouvelle entree d'historique, `#/atlas/zz` vers `#/atlas/s1`.
- [X] T040 [P] [US1] Ecrire `apps/web/tests/e2e/keyboard.spec.ts` : les 9 ecrans atteints au clavier seul (Tab, Entree), contour de `:focus-visible` present a chaque etape (SC-013, partie navigation)

### Implementation for User Story 1

- [X] T041 [US1] Creer le bandeau `apps/web/src/app/TopBar.svelte`, d'apres les lignes 671-713 et le CSS des lignes 148-188, avec les valeurs de `demoState` :
  - portrait SVG et badge de grade, nom, grade, barre d'experience, niveaux ;
  - 4 ressources avec icones et couleurs ;
  - "Collecter" avec montant et jauge, en `laterPhase` `collect`.
- [X] T042 [US1] Creer `apps/web/src/app/MainNav.svelte` : `<nav aria-label="Navigation principale">`, les 5 liens de `MAIN` (ligne 2469) avec leurs icones, `aria-current="page"` et classe `on` pour la section courante du routeur (CSS lignes 172-181)
- [X] T043 [US1] Creer les coquilles des 9 ecrans :
  - fichiers : `apps/web/src/app/escouades/Escouades.svelte`, `apps/web/src/app/atlas/Atlas.svelte`, `apps/web/src/app/base/Base.svelte`, `apps/web/src/app/recherche/Recherche.svelte`, `apps/web/src/app/carte/Carte.svelte`, `apps/web/src/app/briefing/Briefing.svelte`, `apps/web/src/app/deploiement/Deploiement.svelte`, `apps/web/src/app/combat/Combat.svelte` et `apps/web/src/app/butin/Butin.svelte` ;
  - chacune : `<section data-screen="..." aria-label="...">`, ligne de titre `.tag` et pied `.foot` de la maquette (CSS lignes 189-212) ;
  - les titres qui citent des donnees (planete de la Base, cible du Briefing, intitule du Combat) sont construits depuis `@nova/data`.
- [X] T044 [US1] Creer `apps/web/src/app/ScreenView.svelte` : un seul ecran monte, `{#key}` sur l'ecran, fondu de 220 ms supprime si `prefers-reduced-motion`. Brancher `TopBar`, `MainNav` et `ScreenView` dans `apps/web/src/App.svelte`.
- [X] T045 [US1] Creer l'acces a l'Atlas :
  - `apps/web/src/app/escouades/Roster.svelte` (panneau "Effectifs disponibles", lignes 719-728 et 1172-1178) :
    - filtre Commandants, Vaisseaux, Mecas, et cartes `mini` de la famille filtree ;
    - marque `sel` des unites de l'escouade courante ;
    - clic sur une carte : `laterPhase` `assign-unit` ;
    - bouton "Fiche" : `navigate` vers `#/atlas/<id>` ;
  - `apps/web/src/app/atlas/Atlas.svelte` place l'unite de l'adresse dans `selection.atlas`.
- [X] T046 [US1] Creer les commandes de parcours, avec le style `.btn.solid` de la maquette :
  - dans `apps/web/src/app/carte/Holo.svelte` : en-tete (planete visee, "À PORTÉE") et liens "Préparer l'assaut", "Espionner" et operation proposee vers `#/briefing` ;
  - dans `apps/web/src/app/briefing/Briefing.svelte` : lien "Passer au déploiement" vers `#/deploiement` ;
  - dans `apps/web/src/app/deploiement/Deploiement.svelte` : lien "Lancer le combat" vers `#/combat`.

**Checkpoint**: la story 1 est complete et verifiable seule (T039, T040 verts)

---

## Phase 4: User Story 2 - Retrouver la maquette dans chaque ecran (Priority: P2)

**Goal**: chaque ecran reproduit la maquette (zones, textes, valeurs, charte, illustrations) ; les consultations marchent ; les commandes d'une phase ulterieure affichent le message bref

**Independent Test**: comparaison cote a cote avec la maquette a 1600x900 pour chaque ecran, puis consultations et activation d'une commande d'une phase ulterieure (story 2 de `spec.md`)

### Tests for User Story 2 ⚠️

- [X] T047 [P] [US2] Ecrire l'oracle `apps/web/tests/oracle/derived-values.spec.ts` (FR-013) : importer `extractDerivedValues` de `apps/web/scripts/mockup-oracle.mjs` (T053), ouvrir la maquette et comparer l'extraction au contenu de `packages/data/src/demo/derived.generated.json`, lu par `fs`
- [X] T048 [P] [US2] Ecrire `apps/web/tests/e2e/consultation.spec.ts` :
  - scenarios 2 a 4 et 7 a 9 de la story 2 ;
  - valeurs affichees egales a `derivedValues` : "PUISSANCE 2 566 · ARMEMENT DOMINANT LASER" sur Escouades, 38 % au Briefing, 681 UA sur la Carte ;
  - consultations au clavier (SC-013).
- [X] T049 [P] [US2] Ecrire `apps/web/tests/e2e/later-phase.spec.ts` (SC-012) : sur chaque ecran, chaque element `[data-later-phase]` affiche "Pas encore disponible" et le texte de l'ecran reste identique ; tous les codes de `contracts/ui-testing.md` sont presents
- [X] T050 [P] [US2] Ecrire `apps/web/tests/e2e/requests.spec.ts` (SC-010) : aucune requete hors de `localhost` pendant le parcours des 9 ecrans
- [X] T051 [P] [US2] Ecrire `apps/web/tests/unit/no-hardcoded-data.test.ts` (SC-011) : aucun nom d'unite, de batiment, de planete ni de noeud de recherche de `@nova/data` dans `apps/web/src/**/*.{svelte,ts}`

### Implementation for User Story 2

- [X] T052 [US2] Creer `packages/data/src/schemas/derived.ts` : `derivedValuesSchema` de data-model.md §4, avec `squads`, `route`, `briefing`, `mission`, `deployment` et `combatStart`, pour les escouades `alpha`, `bravo`, `charlie` et les theatres `orbital`, `sol`. Le re-exporter dans `schemas/index.ts`.
- [X] T053 [US2] Ecrire l'extraction, en JavaScript pur (research R9).
  - `apps/web/scripts/mockup-oracle.mjs`, fonction `openMockup(browser)` : ouvre `nova-frontier-v2.html` en `file://` depuis la racine, requetes externes bloquees.
  - Meme fichier, fonction `extractDerivedValues(page)`, pour chaque escouade et chaque theatre :
    - fixe `curSquad` et `theatre` ;
    - appelle `power`, `dominantWeapon`, `squadWeapons`, `winChance`, `wavesFor(diffOf(...))`, `dist`, `fuelOf` et `lootOf` ;
    - appelle `buildSlots()` puis `autoPlace()` et lit `DEP.placed` ;
    - appelle `startCombat()` puis fixe `CB.run = false`, et lit `CB.units`, `CB.maxpts`, `#combatname`, `#loglines`, `#wv`, `#wvmax` et `#wtimer` ;
    - lit dans le DOM la synthese (`#sumry`), la contrainte (`#bc2`) et le trajet (`#holo`).
  - `apps/web/scripts/extract-mockup.mjs` : lance Chromium (`executablePath` depuis `PW_CHROMIUM_EXECUTABLE` si definie) et ecrit `packages/data/src/demo/derived.generated.json`, en JSON indente de 2 espaces.
- [X] T054 [US2] Generer `packages/data/src/demo/derived.generated.json` (`pnpm --filter @nova/web mockup:extract`) et l'exposer par `packages/data/src/demo/derived.ts` (`derivedValues`, type `DerivedValues`) et par `packages/data/src/index.ts`. Ajouter sa validation a `packages/data/tests/schemas.test.ts`. Faire passer T047.
- [X] T055 [P] [US2] Creer `apps/web/src/app/escouades/SquadTabs.svelte` (lignes 1102-1111, CSS lignes 252-301) :
  - numero, nom, puis "n/6 · puissance PUISS.", ou "Verrouillé" et le grade ;
  - clic : `selection.selectSquad`, sans effet sur une escouade verrouillee.
- [X] T056 [P] [US2] Creer `apps/web/src/app/escouades/Board.svelte` (lignes 1117-1161) :
  - en-tete : puissance et armement dominant ;
  - rangee Commandant :
    - 6 points d'action, carte ou emplacement vide ;
    - competences grisees au-dela des points d'action, slot legendaire, pastilles de bonus ;
    - texte de l'escouade sans commandant ;
  - rangees Flotte (3) et Force meca (2) ;
  - carte : `laterPhase` `unassign-unit` ; emplacement vide : filtre des effectifs sur sa famille.
- [X] T057 [P] [US2] Creer `apps/web/src/app/escouades/Summary.svelte` et `apps/web/src/app/escouades/MiniFormation.svelte` (lignes 1180-1259) :
  - PV totaux, attaque et defense moyenne, avec les echelles de barre de la maquette : `min(100, pv/90)`, `min(100, atk/16)`, `def` % ;
  - composition d'armement en %, dominante et profil ;
  - points d'action "Fixes"/"Achetables", avec leurs textes et le badge "À trancher · point 3 du CR" ;
  - apercu de formation en SVG (portage de `drawMiniForm`, lignes 1236-1258) et selecteur 360 degres/Arc ;
  - texte final.
- [X] T058 [US2] Assembler la grille de `apps/web/src/app/escouades/Escouades.svelte` (depend de T055-T057) : zones titre, onglets, plateau, effectifs, synthese et pied, colonnes en `rem` (research R5)
- [X] T059 [P] [US2] Creer les colonnes gauche et centrale de l'Atlas : `apps/web/src/app/atlas/AtlasRoster.svelte`, `Characteristics.svelte` et `Tiers.svelte` (lignes 1269-1323, CSS lignes 302-332) :
  - 11 cartes ;
  - caracteristiques d'un commandant ou d'un combattant, note de progression visuelle, note du porte-nefs ;
  - grande carte ; paliers 1 a 4, masques pour un commandant ;
  - pastille "ATLAS — N VISUELS EN CACHE", alimentee par le registre de T033.
- [X] T060 [US2] Creer la colonne droite de l'Atlas (depend de T059) : `apps/web/src/app/atlas/WeaponSkins.svelte`, `DamageMatrix.svelte` et `Engines.svelte` (lignes 1325-1373) :
  - 3 armements actifs selectionnables, 2 prevus grises, case "extension trinité → 5" ;
  - matrice de degrats et son texte ;
  - motorisations. Assembler `Atlas.svelte`.
- [X] T061 [P] [US2] Creer la Base : `apps/web/src/app/base/BuildingField.svelte`, `BuildingList.svelte`, `BuildingDetail.svelte` et `Income.svelte` (lignes 748-760 et 1465-1512, CSS lignes 333-369) :
  - terrain et grille iso ; 9 batiments places selon `position`, etiquettes "nom · NIV n", selection ;
  - liste "Bâtiments 9 / 12" ;
  - detail : couts, duree, effet, "Améliorer" et "File" en `laterPhase` `upgrade-building` et `queue-building` ;
  - revenu : 3 planetes, total, cumul a 52 %, "Tout collecter — 14 280 crédits" en `laterPhase` `collect-all`.
- [X] T062 [P] [US2] Creer la Recherche : `apps/web/src/app/recherche/TreeTabs.svelte`, `Tree.svelte`, `NodeDossier.svelte` et `ResearchQueue.svelte` (lignes 762-775 et 1569-1635, CSS lignes 370-413) :
  - 3 onglets ; noeuds positionnes, etats `done`, `active` et `lock`, noeuds legendaires, selection ;
  - liaisons en SVG, en portage du canvas : trait plein phosphore vers un noeud non verrouille, pointille gris sinon, trace en coude ;
  - dossier :
    - badge "Dépend d'un arbitrage — points 2 et 3 du CR" ;
    - prerequis et niveau de laboratoire, couts, duree, effet ;
    - bouton selon l'etat, en `laterPhase` `start-research`, legende ;
  - file de recherche.
- [X] T063 [P] [US2] Creer la Carte : `apps/web/src/app/carte/MapInfo.svelte`, `NavPad.svelte`, `Zoomer.svelte` et le contenu de `Holo.svelte` (lignes 777-795 et 1682-1788, CSS lignes 414-466) :
  - titre "BRAS DE CYRANNUS · SECTEUR 04-07" ; puces echelle, flotte et carburant ;
  - fleches et coordonnees "X:24 Y:12" en `laterPhase` `map-move` ; niveaux de zoom en `laterPhase` `map-zoom` ;
  - hologramme de la planete visee, alimente par `derivedValues.route` ;
  - zone de scene laissee vide (fond `--ink`) pour la story 3.
- [X] T064 [P] [US2] Creer le Briefing : `apps/web/src/app/briefing/SpyReport.svelte`, `TheatrePanel.svelte`, `Composition.svelte`, `Objectives.svelte`, `Simulation.svelte` et `DeployPrefs.svelte` (lignes 797-803 et 1821-1934, CSS lignes 467-502) :
  - titre "ASSAUT SUR <planete>" ;
  - rapport non effectue, avec "Espionner la planète" en `laterPhase` `spy-planet` ;
  - selecteur du theatre et ses textes ;
  - composition envoyee, tiree de `derivedValues.briefing[escouade]` ;
  - objectifs ;
  - jauge de simulation : `--ok` au-dessus de 60, `--gold` au-dessus de 35, `--warn` sinon ; "Résoudre automatiquement" en `laterPhase` `auto-resolve` ;
  - interrupteur en `laterPhase` `auto-deploy-toggle`, formation, badge "Objectif et disposition à trancher — point 2 du CR".
- [X] T065 [P] [US2] Creer le Deploiement : `apps/web/src/app/deploiement/UnitPool.svelte`, `Disposition.svelte`, `ObjectivePanel.svelte` et `Assistance.svelte` (lignes 805-811 et 2072-2144, CSS lignes 503-528) :
  - unites de `derivedValues.deployment[escouade][theatre]`, toutes placees ; clic en `laterPhase` `pick-unit` ;
  - legende ; disposition et son badge ;
  - objectif : relique, 1 000 PV, vagues, condition ;
  - "Déploiement automatique" et "Tout retirer" en `laterPhase` ;
  - "Lancer le combat" inactif si aucune unite n'est engagee (FR-019) ;
  - zone centrale laissee vide pour la story 3.
- [X] T066 [P] [US2] Creer le Combat : `apps/web/src/app/combat/WaveBar.svelte`, `Forces.svelte`, `Trinity.svelte`, `CombatLog.svelte` et `ActionBar.svelte` (lignes 813-828 et 2299-2335, CSS lignes 529-573), a partir de `derivedValues.combatStart[escouade][theatre]` :
  - intitule ; vague 01 sur le nombre de vagues, relique a 100 % ;
  - forces a pleine sante ;
  - trinite, avec les multiplicateurs lus dans `damageMatrix` contre l'arme adverse ;
  - journal initial ; points d'action ;
  - competences limitees aux points d'action, en `laterPhase` `commander-action` ;
  - ultime verrouille "NIV 50", en `laterPhase` `ultimate` ;
  - arene laissee vide pour la story 3.
- [X] T067 [P] [US2] Creer le Butin : `apps/web/src/app/butin/Crate.svelte` et `LaunchPool.svelte` (lignes 830-839 et 2391-2422, CSS lignes 574-603) :
  - 3 coffres : couleurs par type, taux par rarete, delai, appel a l'action en `laterPhase` `open-crate` ;
  - pool de lancement : groupes et compteurs, cartes `mini`, 4 cases "?".
- [X] T068 [US2] Verifier le contexte de mission dans `apps/web/src/app/briefing/Briefing.svelte`, `apps/web/src/app/deploiement/Deploiement.svelte` et `apps/web/src/app/combat/Combat.svelte` : ils lisent `selection.squad`, `selection.theatre` et `selection.formation` (story 2, scenarios 7 a 9). Faire passer T047-T051.

**Checkpoint**: les stories 1 et 2 sont completes ; les 9 ecrans sont fideles a 1600x900

---

## Phase 5: User Story 3 - Voir la scene s'afficher avec ou sans WebGPU (Priority: P3)

**Goal**: zones de scene de la Carte, du Deploiement et du Combat, en WebGPU avec repli WebGL, message sans acceleration, nettes et a la taille de leur zone, sans accumulation

**Independent Test**: ouvrir un ecran a scene avec WebGPU, sans WebGPU, puis sans acceleration ; verifier le mode, l'image et le message (story 3 de `spec.md`)

### Tests for User Story 3 ⚠️

- [X] T069 [P] [US3] Ecrire `apps/web/tests/unit/render-mode.test.ts` : correspondance du type de rendu vers le mode (`webgpu`, `webgl2`, `webgl1`) ; lecture de `?rendu=webgl`, seule valeur acceptee
- [X] T070 [P] [US3] Ecrire `apps/web/tests/e2e/scene-modes.spec.ts`, joue dans les projets `repli`, `webgpu` et `sans-gpu`, sur la Carte, le Deploiement et le Combat :
  - `data-render-mode` vaut `webgl2`, `webgpu` ou `indisponible` selon le projet ;
  - en `sans-gpu`, message `role="alert"` visible et navigation intacte (SC-006) ;
  - en `repli`, la capture de la zone n'est pas uniforme (etoiles) ;
  - dans le projet `webgpu`, `?rendu=webgl` donne `webgl2`.
- [X] T071 [P] [US3] Ecrire `apps/web/tests/e2e/scene-lifecycle.spec.ts`, projet `repli` :
  - 50 allers-retours Carte et Escouades avec `?diag=1` : le badge compte toujours une application par scene ouverte, et le tas JavaScript, apres `gc()`, ne croit pas de plus de 10 % (SC-009) ;
  - retour sur la Carte en moins de 300 ms (FR-027) ;
  - perte puis restauration du contexte par `WEBGL_lose_context` : `perdu` puis `webgl2` ;
  - perte sans restauration : `indisponible` apres 3 s (FR-024) ;
  - avec `reducedMotion: 'reduce'`, deux captures successives identiques (FR-035).
- [X] T072 [P] [US3] Ecrire `apps/web/tests/e2e/scene-resize.spec.ts` (SC-008) :
  - avec `deviceScaleFactor` 2, la taille du canvas vaut celle de la zone fois 2, avant et apres redimensionnement de la fenetre ;
  - avec `deviceScaleFactor` 3, le facteur est plafonne a 2 ;
  - la taille CSS du canvas vaut celle de la zone.

### Implementation for User Story 3

- [X] T073 [US3] Creer `apps/web/src/scene/types.ts` (types `SceneId`, `RenderMode`, `SceneHandle`, `SceneModule` et `SceneInstance` de `contracts/scene-host.md`) et `apps/web/src/scene/render-mode.ts` (correspondance de `renderer.type` vers le mode ; preference `['webgl']` si `?rendu=webgl`, `['webgpu', 'webgl']` sinon)
- [X] T074 [P] [US3] Creer `apps/web/src/scene/scenes/placeholder.ts`, qui implemente `SceneModule` de `apps/web/src/scene/types.ts` (T073) :
  - degrade du fond `#0a1720`, `#050b10`, `#020405` (lignes 1997-1999) ;
  - environ 300 etoiles `rgba(200,220,255,a)`, placees par un generateur mulberry32 a graine, en derive lente ;
  - `resize` repartit les etoiles sur la nouvelle surface.
- [X] T075 [US3] Creer `apps/web/src/scene/renderer.ts`, avec `acquireScene`, `releaseScene` et `SceneHandle` de `contracts/scene-host.md` :
  - import dynamique de `pixi.js`, apres `document.fonts.ready` ;
  - `Application.init({ preference, resolution: Math.min(devicePixelRatio, 2), autoDensity: true, antialias: false })` (sans multi-echantillonnage, voir `research.md` R10) ; l'erreur "No available renderer" donne le mode `indisponible` ;
  - une application par scene, gardee dans un registre ;
  - `ResizeObserver` et `matchMedia` de la densite, qui appellent `renderer.resize` ;
  - `visibilitychange`, et une image fixe si les animations sont reduites ;
  - pertes de contexte : WebGL par `webglcontextlost` et `webglcontextrestored`, WebGPU par `device.lost` et `runners.contextChange`, avec un delai de 3 s.
- [X] T076 [US3] Creer `apps/web/src/scene/SceneHost.svelte` :
  - `data-scene-host` et `data-render-mode` ;
  - `acquireScene` au montage, `releaseScene` au demontage ;
  - dans le mode `indisponible`, message dans un panneau de la charte, `role="alert"`, avec les textes de `contracts/scene-host.md`.
- [X] T077 [US3] Brancher `SceneHost`, les panneaux restant au-dessus et cliquables (FR-021). Depend de T063, T065 et T066.
  - Dans `apps/web/src/app/carte/Carte.svelte` : zone de la galaxie, sous les panneaux.
  - Dans `apps/web/src/app/deploiement/Deploiement.svelte` : zone centrale.
  - Dans `apps/web/src/app/combat/Combat.svelte` : arene, sous le HUD.
- [X] T078 [US3] Creer le diagnostic `apps/web/src/app/DiagBadge.svelte`, affiche seulement avec `?diag=1` :
  - mode de chaque scene ouverte, nombre d'applications, cadence de la scene visible sur 1 s ;
  - duree du dernier changement d'ecran, mesuree dans `apps/web/src/state/router.svelte.ts` entre `navigate` et le montage de l'ecran ;
  - branche dans `apps/web/src/App.svelte`.

**Checkpoint**: la story 3 est complete ; T069-T072 verts dans les trois projets

---

## Phase 6: User Story 4 - Utiliser l'application a la taille de sa fenetre (Priority: P4)

**Goal**: interface fluide de 1280x720 a 2560x1440, sans chevauchement ni defilement horizontal ; page defilable en dessous

**Independent Test**: passer chaque ecran par 1280x720, 1600x900, 1920x1080 et 2560x1440 (story 4 de `spec.md`)

### Tests for User Story 4 ⚠️

- [X] T079 [P] [US4] Ecrire `apps/web/tests/e2e/layout.spec.ts` (SC-007) :
  - pour chacun des 9 ecrans, a 1280x720, 1600x900, 1920x1080 et 2560x1440 :
    - pas de defilement horizontal ni vertical de la page ;
    - aucun chevauchement entre elements `[data-panel]` pris deux a deux ;
    - racine a la taille de la fenetre ;
  - a 1100x650 : page defilable, aucun chevauchement.

### Implementation for User Story 4

- [X] T080 [P] [US4] Ajuster les grilles de `apps/web/src/app/escouades/Escouades.svelte`, `apps/web/src/app/atlas/Atlas.svelte` et `apps/web/src/app/base/Base.svelte` : colonnes en `clamp()` de 1280 a 2560 px, defilement interne des listes, plan de la base a proportions constantes
- [X] T081 [P] [US4] Ajuster les grilles de `apps/web/src/app/recherche/Recherche.svelte`, `apps/web/src/app/carte/Carte.svelte` et `apps/web/src/app/briefing/Briefing.svelte` : arbre defilable dans son panneau a 1280x720 ; hologramme et colonnes du Briefing
- [X] T082 [US4] Ajuster les grilles de `apps/web/src/app/deploiement/Deploiement.svelte`, `apps/web/src/app/combat/Combat.svelte`, `apps/web/src/app/butin/Butin.svelte`, et le bandeau `apps/web/src/app/TopBar.svelte` a 1280 px. Faire passer T079, une fois T080 et T081 faits.

**Checkpoint**: les quatre stories sont completes

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: outils de validation de SC-002 a SC-004, CI complete, documents de reference

- [ ] T083 [P] Ecrire `apps/web/scripts/captures.mjs` (SC-002) :
  - serveur par l'API `preview` de Vite ;
  - pour chacun des 9 ecrans :
    - capture de l'application a 1600x900 ;
    - capture de la maquette : fenetre 1600x998, `#pager` et `#notes` masques ;
    - ecran ouvert par `go()`, par `startDeploy()`, ou par `startDeploy()` puis `startCombat()` et `CB.run = false` ;
    - decoupe sur `#stage` ;
  - assemblage cote a cote dans une page, puis capture vers `apps/web/captures/NN-<ecran>.png`.
- [ ] T084 [P] Ecrire `apps/web/scripts/lighthouse.mjs` (SC-003) :
  - serveur `preview` sur `dist/` ;
  - Chromium de Playwright (`chromium.executablePath()` ou `PW_CHROMIUM_EXECUTABLE`), lance par `chrome-launcher` avec `--headless=new --no-sandbox` ;
  - Lighthouse 13, configuration `lighthouse/core/config/desktop-config.js`, categorie performance seule, sur `/#/escouades` ;
  - affiche les metriques, et sort en erreur si le score n'est pas superieur a 0,90.
- [ ] T085 [P] Ecrire `apps/web/tests/e2e/performance.spec.ts` (SC-004, partie automatique) :
  - avec `reducedMotion: 'reduce'`, chaque changement d'ecran se termine en moins de 300 ms ;
  - a la premiere ouverture de la Carte, `data-render-mode` atteint son mode final en moins d'une seconde.
- [ ] T086 Verifier dans `apps/web/dist/` que `pixi.js` forme un morceau separe, absent du HTML d'entree et charge seulement a l'ouverture d'un ecran a scene (research R10). Ajuster `apps/web/vite.config.ts` si besoin.
- [ ] T087 Completer `.github/workflows/tests.yml` apres le build, avec trois etapes :
  - installation de Chromium : `pnpm --filter @nova/web exec playwright install --with-deps chromium` ;
  - `pnpm --filter @nova/web test:e2e` ;
  - `pnpm --filter @nova/web perf`.
- [ ] T088 [P] Mettre a jour les documents de reference (research R17) :
  - `plan.md` §10 : versions installees, et raison de TypeScript 6 plutot que 7 ;
  - `WORKFLOW.md` §1 : etat du depot, les fichiers de la phase P0 de la feuille de route etant crees ;
  - `WORKFLOW.md`, piege 4 : garde-fou de `tests.yml` retire, celui de `deploy.yml` maintenu ;
  - `WORKFLOW.md` §5 : prochaine etape, la phase P1 de la feuille de route ;
  - `CLAUDE.md`, section "Commandes du projet" : `test:e2e`, `perf` et `captures`.
- [ ] T089 Derouler `quickstart.md` : les commandes, puis les scenarios automatiques 1 a 14. Reporter les resultats dans la description de la PR.
- [ ] T090 Preparer, pour l'equipe, la validation manuelle, qu'aucun agent ne peut faire :
  - captures de SC-002 ;
  - matrice des navigateurs de `quickstart.md` (SC-005, SC-006) ;
  - mesures au badge sur le poste de reference (SC-004, SC-009).

  Laisser dans la description de la PR une liste a cocher pour chaque resultat attendu.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : aucune dependance. T002 a T006 suivent T001 ; T007 suit T001-T006 ; T009 suit T007.
- **Foundational (Phase 2)** : suit la phase 1 et bloque toutes les stories.
  - Donnees : T010 → T011-T013, puis T014 (apres T011) → T015 → T016 → T017-T021, puis T022 (apres T018) → T023 → T024.
  - Sim : T025 et T026 suivent T015.
  - Web : T030 → T032 ; T033 → T034 ; T036 suit T024 ; T037 suit T027-T030.
- **US1 (Phase 3)** : suit la phase 2.
- **US2 (Phase 4)** : suit US1, dont elle complete les coquilles d'ecrans (T043) et les composants `Roster`, `Holo`, `Briefing` et `Deploiement`.
- **US3 (Phase 5)** : suit US1. Elle peut avancer en parallele de US2, sauf T077, qui attend T063, T065 et T066 (memes fichiers d'ecran).
- **US4 (Phase 6)** : suit US2 et US3, car elle ajuste les grilles finales.
- **Polish (Phase 7)** : suit les stories voulues. T087 suppose que T039-T085 passent.

### User Story Dependencies

- **US1 (P1)** : aucune autre story. C'est le MVP.
- **US2 (P2)** : s'appuie sur les ecrans de US1, mais se teste seule, ecran par ecran, par adresse.
- **US3 (P3)** : se teste sur un ecran a scene ouvert par son adresse ; independante de US2, hormis le branchement T077.
- **US4 (P4)** : se teste sur tous les ecrans ; suppose leur contenu (US2) et leurs scenes (US3).

### Within Each User Story

- Tests d'abord ; ils echouent avant l'implementation.
- Donnees et schemas avant les ecrans ; composants avant leur assemblage.
- Commiter apres chaque tache ou groupe logique ; la story est complete avant la suivante.

### Parallel Opportunities

- Phase 1 : T002, T003, T004, T005 et T008.
- Phase 2 :
  - schemas T011-T013 ;
  - donnees T017-T021 ;
  - sim T025-T026 ;
  - web T027-T029, T031 et T033.
- US1 : tests T039 et T040.
- US2 : tests T047-T051 ; ecrans T055-T057, T059 et T061-T067, chacun dans ses fichiers (T060 suit T059).
- US3 : tests T069-T072 ; T074 une fois T073 fait.
- US4 : le test T079 ; T080 et T081, qui touchent des ecrans differents.
- Polish : T083, T084, T085 et T088.

---

## Parallel Example: User Story 2

```bash
# Tests de la story 2, en parallele :
Task: "Ecrire l'oracle apps/web/tests/oracle/derived-values.spec.ts"
Task: "Ecrire apps/web/tests/e2e/consultation.spec.ts"
Task: "Ecrire apps/web/tests/e2e/later-phase.spec.ts"
Task: "Ecrire apps/web/tests/e2e/requests.spec.ts"
Task: "Ecrire apps/web/tests/unit/no-hardcoded-data.test.ts"

# Une fois T054 fait, les ecrans en parallele :
Task: "Creer la Base (apps/web/src/app/base/*)"
Task: "Creer la Recherche (apps/web/src/app/recherche/*)"
Task: "Creer le Butin (apps/web/src/app/butin/*)"
Task: "Creer le Briefing (apps/web/src/app/briefing/*)"
```

## Parallel Example: User Story 3

```bash
Task: "Ecrire apps/web/tests/e2e/scene-modes.spec.ts"
Task: "Ecrire apps/web/tests/e2e/scene-lifecycle.spec.ts"
Task: "Ecrire apps/web/tests/e2e/scene-resize.spec.ts"
Task: "Creer apps/web/src/scene/scenes/placeholder.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Setup), puis Phase 2 (Foundational), qui bloque tout le reste.
2. Phase 3 (US1) : les 9 ecrans navigables, avec bandeau, fiche Atlas et parcours de mission.
3. **STOP and VALIDATE** : T039 et T040 verts, et parcours a la main (scenario 1 de `quickstart.md`).
4. Pousser sur la PR (CI verte : lint, typecheck, test, build).

### Incremental Delivery

1. Setup et Foundational : socle pret, CI reelle.
2. US1 : squelette navigable, demontrable (MVP).
3. US2 : fidelite a la maquette, 9 ecrans valides en captures.
4. US3 : scenes provisoires, dans les trois modes de rendu.
5. US4 : toutes les tailles de fenetre d'ordinateur.
6. Polish : captures, Lighthouse et Playwright dans la CI, documents, validation manuelle.

Chaque etape garde les tests des precedentes verts.

### Parallel Team Strategy

1. Toute l'equipe sur Setup et Foundational.
2. Ensuite, US1, puis US2 repartie par ecran (T055-T067) et US3 en parallele. T077 attend les ecrans.
3. US4 et Polish en fin de parcours.

---

## Notes

- [P] : fichiers differents, aucune dependance ; [USn] : tracabilite vers la story.
- Chaque story se verifie seule, a son point de controle.
- Apres `/speckit-implement`, lancer `/speckit-converge` jusqu'a ce qu'il ne signale plus d'ecart (`WORKFLOW.md` §3).
- A eviter : taches vagues, conflits dans un meme fichier, et dependances entre stories qui en casseraient l'independance.
- `.specify/feature.json` est local et ignore par git : dans une nouvelle session, le faire pointer vers `specs/20260928-182033-socle-ecrans-navigables` avant `/speckit-implement` (piege 8 de `WORKFLOW.md`).
