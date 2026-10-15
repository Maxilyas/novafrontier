---

description: "Liste des taches de la feature simulation-combat (phase P1 de la feuille de route)"
---

# Tasks: Simulation du combat, plateau de deploiement et scene de combat

**Input**: Design documents from `/specs/20261014-231011-simulation-combat/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: inclus. Le principe V de la constitution et la section Verification du plan en font la
preuve des criteres de succes. Dans chaque story, les tests s'ecrivent d'abord et doivent echouer
avant l'implementation.

**Organization**: une phase par user story de `spec.md` (US1 a US5), precedee d'une preparation et
d'un socle bloquant, suivie des finitions. "Phase N" designe une etape de ce fichier, jamais une
phase de la feuille de route (`CLAUDE.md`).

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallelisable (fichiers differents, aucune dependance sur une tache non terminee)
- **[Story]** : story servie (US1 a US5)
- Les numeros de ligne renvoient a `nova-frontier-v2.html` (la maquette, a la racine).
- Rn renvoie a `research.md`, §n a `data-model.md`, les contrats a `contracts/`.
- Les textes a afficher sont ceux de la maquette, accents compris ; les litteraux de code entre
  accents graves sont exacts.
- Sur un poste ou pnpm n'est pas dans le PATH : `corepack pnpm ...`.

## Path Conventions

Arborescence de `plan.md` (section Project Structure) : `packages/data/`, `packages/sim/`,
`apps/web/`, fichiers de configuration a la racine.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependances et scripts de la sim, lien entre paquets (R1, R10)

- [X] T001 Mettre a jour `packages/sim/package.json` :
  - `"@nova/data": "workspace:*"` passe dans `dependencies` (valeurs importees a l'execution, `contracts/sim-package.md`) ;
  - devDependencies : ajouter `@vitest/browser-playwright@5.0.2` et `playwright@1.63.0` ;
  - scripts : `"test": "vitest run --project node --passWithNoTests"`, `"test:browsers": "vitest run --project navigateurs --passWithNoTests"`, `"golden:update": "vitest run --project golden"`, `"trig:generate": "node scripts/trig-table.mjs"` ; `lint` et `typecheck` inchanges.
- [X] T002 [P] Ajouter `"@nova/sim": "workspace:*"` aux `dependencies` de `apps/web/package.json`
- [X] T003 Creer `packages/sim/vitest.config.ts` avec deux projets (R10) :
  - `node` : environnement Node, `include: ['tests/**/*.test.ts']` ;
  - `navigateurs` : mode navigateur, fournisseur `playwright()` de `@vitest/browser-playwright`, `headless: true`, instances `chromium`, `firefox`, `webkit`, `include: ['tests/golden.test.ts']` ; pour `chromium`, `launchOptions.executablePath` = `process.env.PW_CHROMIUM_EXECUTABLE` quand la variable existe (conteneur Claude Code), comme `apps/web/playwright.config.ts` ;
  - `golden` : environnement Node, `include: ['scripts/golden-update.test.ts']`, lance seulement par `golden:update` (les sources de la sim importent sans extension, ce que Node seul ne resout pas : Vitest sert d'executeur).
- [X] T004 Installer avec `pnpm install` (jamais npm), commiter `pnpm-lock.yaml`, puis verifier que `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` et `pnpm -r build` passent toujours

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: donnees de combat, arithmetique deterministe, types, emplacements, vagues, valeurs de planete, et changements du moteur de scenes dont toutes les stories dependent

**⚠️ CRITICAL**: aucune story ne commence avant la fin de cette phase

### `@nova/data` : reglages, archetypes, competences (§2, `contracts/data-package.md`)

- [X] T005 [P] Creer `packages/data/src/schemas/combat.ts` et l'exporter depuis `schemas/index.ts` :
  - `threatSchema = z.enum(['l', 'm', 'h', 'b'])`, `slotKindSchema = z.enum(['ship', 'mech'])`, `lineSchema` (`'front' | 'back'`) ;
  - `combatTuningSchema` avec exactement les champs de §2.1 (`relicHp`, `arena`, `relicPosition` par formation, `board` et son objectif par formation, `boardToArena`, `slots.ring` et `slots.arc` par ligne : nombre, rayon, angle de depart et etendue en radians, `slotTypes`, `spawn`, `cooldownMs`, `waveIntervalMs`, `relicStrikeRadius` et part d'attaque, `defenseConstant`, `minDamage`, `maxDurationMs`, `advantageLogMs`), nombres strictement positifs sauf angles ;
  - `enemyArchetypeSchema` : `threat`, `composition` (chaine non vide), `count`, `hp`, `attack`, `defense`, `range` (entiers positifs), `speed` (positif, unites d'arene par seconde), `color` (hexadecimal), `size` (entier positif).
- [X] T006 [P] Etendre `packages/data/src/schemas/unit.ts` : `skillTargetSchema = z.enum(['none', 'point', 'unit', 'enemy', 'unit-slot'])` ; `skillEffectSchema`, union discriminee sur `kind` avec les 14 variantes et parametres de §2.3 (`strike-point` {damage, radius}, `strike-nearest-relic` {damage}, `strike-enemy` {damage}, `charge` {damage, radius}, `defense-buff` {multiplier, durationMs}, `front-damage-cut` {multiplier, durationMs}, `heal-unit` {share}, `heal-all` {share}, `heal-point` {share, radius}, `freeze` {threats, durationMs}, `attack-buff-unit` {multiplier, until: 'next-wave'}, `enemy-miss` {chance, durationMs}, `loot-bonus` {share}, `relocate` {}) ; `skillSchema` gagne `target` et `effect`, avec un `refine` de coherence : "`point` pour `strike-point` et `heal-point`, `unit` pour `heal-unit` et `attack-buff-unit`, `enemy` pour `strike-enemy`, `unit-slot` pour `relocate`, `none` sinon"
- [X] T007 Creer `packages/data/src/game/combat.ts` (`combatTuning`, `enemyArchetypes`) avec les valeurs exactes de §2.1 et §2.2 (libelles corriges "Intercepteurs ×12", "Intercepteurs lourds ×9", "Frégates de raid ×5", "Croiseur porte-nef"), exporte depuis `game/index.ts` (depend de T005)
- [X] T008 Completer les 15 competences de `packages/data/src/game/units.ts` avec `target` et `effect` selon la table FR-014 de `spec.md` et §2.3 ; description de Bouclier de flotte : "+70% DÉF pendant 7 s" ; les autres descriptions sont inchangees (depend de T006)
- [X] T009 Etendre `packages/data/tests/schemas.test.ts` (validation de `combatTuning`, de chaque archetype et de chaque unite par les nouveaux schemas) et `packages/data/tests/invariants.test.ts` (coherence `target`/`effect`, archetypes a valeurs positives, une competence au plus par `effect.kind` `relocate`) (depend de T007, T008)

### `@nova/sim` : arithmetique et outils deterministes (R2 a R4, R7)

- [X] T010 [P] Etendre `packages/sim/tests/purity.test.ts` a la liste complete de `contracts/sim-package.md` (`Math.pow`, `Math.exp`, `Math.log`, `Math.log2`, `Math.log10`, `Math.log1p`, `Math.expm1`, `Math.tan`, `Math.asin`, `Math.acos`, `Math.atan`, `Math.sinh`, `Math.cosh`, `Math.tanh`, `Math.cbrt`, operateur `**` en plus des interdits de la phase P0)
- [X] T011 [P] Ecrire `packages/sim/tests/fixed.test.ts` : `toFixed(1.35) === 88474`, `toFixed(0.72) === 47186` ; `fmul` et `fdiv` tronquent vers zero ; `isqrt(n)` egal a `floor(sqrt(n))` pour 0 a 10^6 et pour des carres parfaits jusqu'a 2^52 ; comparaison de distance au 1/256 correcte sur la diagonale de l'arene
- [X] T012 [P] Ecrire `packages/sim/tests/trig.test.ts` : la table de `src/trig-table.ts` vaut `Math.round(Math.sin(i * PI / 512) * 65536)` pour i de 0 a 256 (Math.sin permis dans les tests) ; `sin`/`cos` de 0, 256, 512, 768 et de valeurs quelconques par symetrie
- [X] T013 [P] Ecrire `packages/sim/tests/rng.test.ts` : `xoshiro128**` initialise par `splitmix32` donne la meme suite qu'une implementation de reference en `BigInt` ecrite dans le test, pour 3 graines et 1 000 tirages ; `nextInt(n)` reste dans [0, n)
- [X] T014 [P] Ecrire `packages/sim/tests/fingerprint.test.ts` : 16 chiffres hexadecimaux ; meme suite de mots, meme empreinte ; un mot change, empreinte differente ; refuse un mot non entier ou hors de l'intervalle des entiers signes sur 32 bits
- [X] T015 [P] Creer `packages/sim/src/fixed.ts` (R2) : `FIXED_ONE = 65536`, `toFixed`, `fromFixed`, `fmul(a, b)` et `fdiv(a, b)` a troncature explicite, `isqrt` (Newton entier), `distSq256(ax, ay, bx, by)` sur des coordonnees ramenees au 1/256, `rangeSq256(range)` (depend de T011)
- [X] T016 [P] Creer `packages/sim/scripts/trig-table.mjs` qui ecrit `packages/sim/src/trig-table.ts` (257 valeurs 16.16 d'un quart de tour, en-tete "fichier genere, ne pas modifier"), l'executer, puis creer `packages/sim/src/trig.ts` (`sin(angle)`, `cos(angle)` en 1/1024 de tour, par symetrie ; `radiansToAngle` deterministe pour les reglages de la maquette, R3) (depend de T012)
- [X] T017 [P] Creer `packages/sim/src/rng.ts` : `splitmix32`, `createRng(seed)` (`xoshiro128**`, etat de 4 mots lisible pour l'empreinte), `nextU32`, `nextInt(n)` = `Math.floor(u32 * n / 2**32)` ecrit sans l'operateur `**` (constante `4294967296`) (depend de T013)
- [X] T018 [P] Creer `packages/sim/src/fingerprint.ts` : FNV-1a sur deux voies de 32 bits (bases `0x811c9dc5` et `0x01000193 ^ 0x9e3779b9`, multiplication par `Math.imul`), `fingerprint(words: Iterable<number>): string` (depend de T014)
- [X] T019 Creer `packages/sim/src/types.ts` et `packages/sim/src/events.ts` avec les types de §3 (`Slot`, `Placement`, `CombatSetup`, `Command`, `Target`, `CombatState`, `CombatUnit`, `CombatEnemy`, `WaveSpec`, `SimEvent` et ses 8 variantes avec leurs donnees, `CombatResult`), et remplacer les types provisoires de la phase P0 dans `packages/sim/src/index.ts` par ces exports
- [X] T020 Creer `packages/sim/src/tuning.ts` : conversion unique de `combatTuning` et `enemyArchetypes` (`@nova/data`) en pas et en 16.16, selon la table de R5 (recharges 11, 14 et 16 pas ; vagues 240 ; durees de competence par `round(ms / 50)` ; duree maximale 12 000 ; vitesses `toFixed(v / 20)` par pas) ; test `packages/sim/tests/tuning.test.ts` qui verifie chaque valeur de la table de R5 (depend de T015, T019)

### `@nova/sim` : emplacements, placement, planetes, vagues

- [X] T021 [P] Ecrire `packages/sim/tests/formation.test.ts` :
  - 360 degres : 16 emplacements, 8 `front` puis 8 `back`, types alternes en commencant par `ship` ; arc : 7 + 6 ; en `orbital`, seuls les emplacements `ship` ;
  - positions de plateau et d'arene a moins d'une unite de celles de `buildSlots` et `startCombat` (lignes 1960-1975, 2172), recalculees dans le test avec `Math.cos`/`Math.sin` ;
  - `autoPlacement` : chaque unite sur un emplacement de son type ; pour Alpha, Bravo et Charlie et chaque theatre, lignes egales a `derivedValues.deployment` (SC-012) ;
  - `validatePlacement` refuse : unite hors escouade, meca en `orbital`, unite placee deux fois, emplacement inexistant, de l'autre type ou occupe deux fois.
- [X] T022 Creer `packages/sim/src/formation.ts` (R18, §3.1-3.2) : `formationSlots(formation, theatre)`, `engagedUnits(squad, theatre)` (vaisseaux en `orbital`, vaisseaux et mecas en `sol`, dans l'ordre de l'escouade), `autoPlacement` (regle `autoPlace` des lignes 1979-1991 appliquee par type : par DEF decroissante, blindage `Moyen`/`Lourd` en `front`, `Léger` en `back`, a defaut l'autre ligne du meme type), `validatePlacement` (depend de T016, T020)
- [X] T023 [P] Ecrire `packages/sim/tests/planet.test.ts` : pour Gemenon, distance 681, carburant 681, difficulte 3, butin 2 511, temps de trajet "7h 06", vitesse 96 (valeurs de `derivedValues.route`) ; difficulte 0 pour la base
- [X] T024 Creer `packages/sim/src/planet.ts` : `planetDistance` (`floor(hypot * 1.1)` en racine entiere sur `floor(121 * S / 100)`, depuis la planete au statut `BASE`, lignes 1641 et 1676), `difficulty` (ligne 1677, arrondi d'un rationnel exact), `lootOf` (ligne 1678), `fuelOf` (ligne 1679, `fuelRate` 1), `travel` (vitesse `[96, 60, 88][index de la planete % 3]` et temps "Hh MM", lignes 1737-1741 ; particularite de la maquette conservee) (depend de T015)
- [X] T025 [P] Ecrire `packages/sim/tests/waves.test.ts` : pour Gemenon, 6 vagues dont la derniere `boss`, armements et menaces egaux a `derivedValues.mission.waves`, compositions egales aux libelles corriges de `enemyArchetypes`
- [X] T026 Creer `packages/sim/src/waves.ts` : `wavesFor(planet)` (lignes 1806-1814 : `diff * 2` vagues, `boss` a la derniere, armement `nuc` pour le boss sinon `las` aux rangs impairs et `art` aux pairs, menace `b`, puis `h` si rang multiple de 3, `m` si pair, `l` sinon ; composition = `enemyArchetypes[menace].composition`) ; exporter `wavesFor`, `formationSlots`, `engagedUnits`, `autoPlacement`, `validatePlacement` et `planet.ts` depuis `src/index.ts` (depend de T024)

### `apps/web` : moteur de scenes et outils communs

- [X] T027 Modifier `apps/web/src/scene/types.ts` et `apps/web/src/scene/renderer.ts` (`contracts/scenes.md`) : `SceneModule` gagne `animateWhenReducedMotion?` et `init?: { antialias?: boolean }` ; table `MODULES` par `SceneId` importee dynamiquement (les trois pointent encore sur `scenes/placeholder`) ; `creer()` utilise le module de la scene et ses options ; `animer()` ne s'arrete pas pour les animations reduites si le module le demande. Les tests Playwright de scene de la phase P0 restent verts
- [X] T028 [P] Creer `apps/web/src/scene/scenes/fit.ts` (mise a l'echelle uniforme d'un espace logique dans la zone, centree ; conversions logique vers zone et zone vers logique) et `apps/web/tests/unit/fit.test.ts` (aller-retour exact, centrage, rapport conserve)
- [X] T029 [P] Creer `apps/web/src/state/team-params.ts` (`graine` : entier non signe de 32 bits ou absent ; `diag` ; `charge`) lu dans `location.search`, et `apps/web/tests/unit/team-params.test.ts` (valeurs invalides ignorees, `contracts/combat-runtime.md`)
- [X] T030 [P] Creer `apps/web/src/ui/Modal.svelte` (R17) : panneau a coins coupes de la maquette (`showModal`), fond assombri, `role="dialog"`, `aria-modal`, titre en en-tete ; focus sur la premiere commande a l'ouverture, rendu a l'element d'origine a la fermeture ; Echap ferme seulement si une commande de fermeture est fournie

**Checkpoint**: donnees, outils deterministes, emplacements, vagues et moteur de scenes prets ; `pnpm -r test` vert

---

## Phase 3: User Story 1 - Mener un combat de defense de la relique (Priority: P1) 🎯 MVP

**Goal**: le combat se deroule a l'ecran Combat, avec le placement automatique, les competences du commandant et la fenetre de fin

**Independent Test**: Escouades, Alpha, Carte, Preparer l'assaut, Passer au deploiement (placement automatique), Lancer le combat, utiliser une competence non ciblee et Frappe orbitale, suivre jusqu'a la fenetre de fin (scenario 1 de `quickstart.md`)

### Tests for User Story 1 ⚠️

- [X] T031 [P] [US1] Ecrire `packages/sim/tests/rules/deroulement.test.ts` (FR-001 a FR-011, R5, R6) :
  - vague 1 au pas 0, vague suivante 240 pas plus tard, minuteur ;
  - apparition : 12/9/5/1 ennemis selon la menace, distance 520 a 660 (boss 620), secteur de l'arc, tirages issus de la graine ;
  - ennemi : vise l'unite vivante la plus proche (egalite : plus petit identifiant), avance s'il est hors de portee, s'arrete a portee et tire tous les 14 pas ; sans unite, avance vers la relique et s'arrete a 70 ; frappe la relique tous les 16 pas pour la moitie de son attaque ; immobilise, ne bouge pas mais tire ;
  - unite : tire sur l'ennemi le plus proche a portee tous les 11 pas, ne bouge pas ;
  - degats : `max(1, ATQ x matrice x (1 - DEF / (DEF + 130)))` en 16.16, contre une valeur attendue calculee dans le test ;
  - entite a PV <= 0 : n'agit plus ; ennemi retire en fin de pas ; unite gardee a PV 0 ;
  - fin : defaite si la relique tombe (prioritaire, meme pas que le dernier ennemi), victoire si toutes les vagues sont apparues sans ennemi restant, defaite au pas 12 000 ; `step()` apres la fin rend `[]`.
- [X] T032 [P] [US1] Ecrire `packages/sim/tests/rules/competences.test.ts` (FR-012 a FR-015, FR-014b) : une suite par competence de la table FR-014, sur des escouades construites dans le test pour Odin Braak, T. Halven et P. Andar ; consommation d'un point, competence depensee, refus sans point ; cible invalide au pas d'application : non appliquee, point non consomme, evenement `skill` avec `applied: false` ; Surcharge et Pillage jusqu'a la vague suivante ; Fumigene : tirages de reussite issus de la graine ; Repli tactique : emplacement libre de son type seulement
- [X] T033 [P] [US1] Ecrire `packages/sim/tests/rules/entrees.test.ts` : `createCombat` leve une erreur explicite pour un placement invalide, un placement vide, une commande au rang de competence inexistant, une cible de mauvaise forme, des pas non croissants ; `issue` refuse un pas deja calcule
- [X] T034 [P] [US1] Ecrire `packages/sim/tests/properties.test.ts` (SC-007) : 10 000 combats a graine, escouade (Alpha ou Bravo), theatre et formation tires par un generateur fixe du test, avec commandes aleatoires valides ; a chaque pas, PV dans [0, maximum], relique dans [0, 1000 x 65536], champs entiers sous 2^31 ; fin avant 12 000 pas
- [X] T035 [P] [US1] Ecrire `apps/web/tests/unit/combat-log.test.ts` : messages de la maquette (deploiement, formation, vague avec " · BOSS", "<nom> détruit", "Avantage LASER ▸ ARTILLERIE <b>×1.35</b>" au plus une fois par 30 pas, "BOSS DÉTRUIT", competence en majuscules avec sa description, competence sans cible, bonus de Pillage), 11 lignes au plus, la plus recente en premier
- [X] T036 [P] [US1] Ecrire `apps/web/tests/unit/combat-runtime.test.ts` avec une fausse horloge (`requestAnimationFrame` et temps injectes) : un pas par 50 ms ; 4 pas au plus par image, retard abandonne ; `pause()` puis `resume()` sans rattrapage ; competence non ciblee datee du pas suivant ; designation ouverte, confirmee (commande au pas suivant) ou annulee (rien de consomme) ; designation annulee par la fin, la pause ou une autre competence
- [X] T037 [P] [US1] Ecrire `apps/web/tests/e2e/combat.spec.ts` (horloge de page, `contracts/ui-testing.md`) : lancement depuis le Deploiement, vague 1 annoncee et minuteur a 12 s ; apres avance de l'horloge, PV et `data-relic-percent` changent ; Bouclier de flotte consomme un point et devient inactif ; Frappe orbitale : `data-designating`, clic sur la scene, application ; Echap annule sans consommer ; l'ultime affiche "Capacité ultime — débloquée au niveau 50, réservée aux boss" ; fenetre de fin (`data-modal="end"`, `data-outcome`) dont vagues, unites restantes et relique sont egales a celles du HUD et de l'etat final (SC-009) ; "Redéployer" et "Retour à la carte"
- [X] T038 [P] [US1] Ecrire `apps/web/tests/e2e/combat-lifecycle.spec.ts` : quitter l'ecran Combat puis revenir reprend au meme `data-tick` ; onglet masque, meme effet ; adresse directe `#/combat` lance un combat avec la selection courante ; Charlie : message "aucune unité engagée", aucun combat ; projet `sans-gpu` : le combat avance et la fenetre de fin s'affiche (FR-024 de la phase P0 et cas limite de la spec) ; animations reduites (`page.emulateMedia({ reducedMotion: 'reduce' })`) : le combat avance et la scene suit les ennemis
- [X] T039 [US1] Mettre a jour `apps/web/tests/e2e/later-phase.spec.ts` : retirer `commander-action` de l'inventaire ; `ultimate` attend le message de la maquette au lieu de "Pas encore disponible"

### Implementation for User Story 1

- [X] T040 [US1] Creer `packages/sim/src/skills.ts` : application de chaque `effect.kind` selon la table FR-014 (degats sans reduction ni matrice, soins plafonnes, effets dures en pas, Surcharge et Pillage indexes sur le rang de vague, Charge lourde depuis l'unite `front` de plus forte DEF a defaut `back`, Repli tactique vers un emplacement libre du type de l'unite), resultat `applied` et cible pour l'evenement `skill` (depend de T020, T022)
- [X] T041 [US1] Creer `packages/sim/src/combat.ts` : `createCombat(setup)` (validation de T033, unites dans l'ordre des emplacements avec PV max = PV x effectif, relique, vague 1 au pas 0), `step()` dans l'ordre de R6, apparition par la graine (angle puis distance par ennemi), Fumigene, Pillage, fin et `endReason`, `issue()`, `result()` (§3.7, butin majore par Pillage via `lootOf`), `runCombat(setup)` ; `state` en lecture seule ; exporter depuis `src/index.ts` (depend de T026, T040)
- [X] T042 [US1] Creer `apps/web/src/state/combat-log.ts` (fonction pure de T035) (depend de T041)
- [X] T043 [US1] Creer `apps/web/src/state/combat-runtime.ts` selon `contracts/combat-runtime.md` : instance unique, horloge de R12, `start`, `pause`, `resume` (pause aussi a `visibilitychange`), `activateSkill`, `designate`, `cancelDesignation`, positions precedentes et `alpha`, abonnements `onStep`/`onPhase` ; graine de `team-params` ou `crypto.getRandomValues` ; `replay()` ecrit ici mais sans bouton (US3) (depend de T029, T041)
- [X] T044 [US1] Creer `apps/web/src/state/combat.svelte.ts` : projection `combatHud` de §4.3 (`hud` a chaque pas, `forces` tous les 5 pas, `log` via `combat-log.ts`, `end`, `replay`) en `$state.raw` (depend de T042, T043)
- [X] T045 [P] [US1] Creer `apps/web/src/scene/scenes/combat/draw.ts` : formes de `contracts/scenes.md` (fond spatial ou terrestre, relique, fleche d'unite et ses barres, pointe d'ennemi orientee vers la relique par vecteur normalise, anneaux de bouclier et d'immobilisation), couleurs des archetypes et des lignes
- [X] T046 [P] [US1] Creer `apps/web/src/scene/scenes/combat/effects.ts` : pools de `Graphics` pour tirs (0,15 s, tir manque en pointilles), destructions (0,27 s, x5 pour le boss) et effets de competence (0,5 s, couleur par effet), declenches par les evenements ; figes ou supprimes quand les animations sont reduites
- [X] T047 [US1] Creer `apps/web/src/scene/scenes/combat/designation.ts` et `index.ts` : `combatScene` (`SceneModule`, `antialias: true`, `animateWhenReducedMotion: true`) qui lit `combatRuntime` a chaque image, interpole les ennemis, met l'arene a l'echelle par `fit.ts`, gere la designation (surbrillance, zone sous le pointeur, conversion en 16.16, clic droit et Echap) ; brancher `combat` dans `MODULES` de `renderer.ts` (depend de T027, T028, T043, T045, T046)
- [X] T048 [P] [US1] Brancher `apps/web/src/app/combat/WaveBar.svelte` sur `combatHud.hud` : "VAGUE nn / nn", "RELIQUE nn%" et largeur de barre, "PROCHAINE 0:ss" ; attributs `data-wave-current`, `data-wave-total`, `data-relic-percent`, `data-next-wave-seconds`
- [X] T049 [P] [US1] Brancher `apps/web/src/app/combat/Forces.svelte` sur `combatHud.forces` : vivants/engages, ligne estompee si detruite, PV arrondis ; `data-unit`, `data-hp`, `data-destroyed`
- [X] T050 [P] [US1] Brancher `apps/web/src/app/combat/CombatLog.svelte` sur `combatHud.log` (tons `ok`, `crit`, `gold`)
- [X] T051 [US1] Rendre actif `apps/web/src/app/combat/ActionBar.svelte` : pastilles `data-action-points`, competences `data-skill` qui appellent `activateSkill`, depensees estompees et `aria-disabled`, competence en designation mise en evidence ; ultime : message de la maquette ; retirer les `data-later-phase="commander-action"` (depend de T043)
- [X] T052 [US1] Creer `apps/web/src/app/combat/EndModal.svelte` sur `Modal.svelte` (FR-030, textes des lignes 2359-2375) : titre et couleur selon l'issue, texte, vagues apparues/total, unites restantes/engagees, butin estime (0 en defaite), "Redéployer" (vers le Deploiement), "Retour à la carte" ; `data-modal="end"`, `data-outcome` (depend de T030, T044)
- [X] T053 [US1] Mettre a jour `apps/web/src/app/combat/Combat.svelte` : au montage, `resume()` du combat en cours ou `start()` d'un nouveau combat avec la selection courante et `autoPlacement` ; au demontage, `pause()` ; message "Aucune unité engagée" sans combat pour une escouade vide ; `data-combat-phase`, `data-combat-mode` ; `EndModal` a la fin (depend de T047 a T052)
- [X] T054 [US1] Mettre a jour `apps/web/src/app/deploiement/Deploiement.svelte` : "Lancer le combat" appelle `combatRuntime.start()` (selection courante, `autoPlacement`) puis navigue vers `#/combat` ; remplace tout combat en cours (FR-031) (depend de T043)

**Checkpoint**: un combat complet se joue a l'ecran avec le placement automatique ; T031 a T039 verts

---

## Phase 4: User Story 2 - Placer ses unites avant le combat (Priority: P2)

**Goal**: plateau de deploiement avec emplacements de vaisseaux (bleus) et de mecas (verts), placement automatique ou manuel, a la souris, au glisser-deposer et au clavier

**Independent Test**: Deploiement d'Alpha en combat terrestre, "Tout retirer", placer deux vaisseaux et deux mecas, laisser la cinquieme unite, lancer le combat, verifier positions et force engagee (scenario 2 de `quickstart.md`)

### Tests for User Story 2 ⚠️

- [X] T055 [P] [US2] Ecrire `apps/web/tests/unit/deployment.test.ts` : placement cree a la premiere demande (automatique si `autoDeploy`, vide sinon) et memorise par escouade, theatre et formation ; `pick` puis `placeOn` ; emplacement de l'autre type refuse ; `drop` sur un emplacement occupe de meme type echange les unites, ailleurs l'unite revient ; `remove`, `auto`, `clear` ; tout passe par `validatePlacement`
- [X] T056 [P] [US2] Ecrire `apps/web/tests/e2e/deploiement.spec.ts` (scenarios 1 a 7 de la story 2, SC-011) : emplacements `data-slot-kind` bleus et verts en terrestre, bleus seuls en spatial ; placement a la souris, au glisser-deposer et au clavier en 10 actions au plus pour 5 unites ; refus du mauvais type ; `data-placed` ; "Tout retirer" desactive "Lancer le combat" ; "Déploiement automatique" ; interrupteur du Briefing coupe : plateau vide a l'arrivee ; changement de formation et de theatre ; combat lance avec 4 unites a leurs emplacements (positions lues dans la force engagee et l'etat) ; "Redéployer" garde le placement
- [X] T057 [US2] Mettre a jour `apps/web/tests/e2e/later-phase.spec.ts` : retirer `pick-unit`, `auto-deploy`, `clear-deploy` et `auto-deploy-toggle` de l'inventaire

### Implementation for User Story 2

- [X] T058 [P] [US2] Ajouter a `apps/web/src/styles/tokens.css` les jetons `--slot-ship` (bleu, provisoire) et `--slot-mech` (vert, provisoire), lisibles sur les deux fonds du plateau
- [X] T059 [US2] Creer `apps/web/src/state/deployment.svelte.ts` selon `contracts/combat-runtime.md` et §4.1 (session seulement) (depend de T022)
- [X] T060 [US2] Creer `apps/web/src/scene/scenes/deploy/draw.ts` et `index.ts` : `deployScene` selon `contracts/scenes.md` (fond du theatre, lignes en pointilles, fleches d'arrivee, relique, hexagones colores par type, surbrillance des emplacements valides pendant un choix), sans aucun texte ; brancher `deploiement` dans `MODULES` (depend de T027, T028, T058, T059)
- [X] T061 [US2] Creer `apps/web/src/app/deploiement/SlotButtons.svelte` : un `<button>` par emplacement propose, positionne par `fit.ts` et suivi au redimensionnement ; contenu de l'unite placee (nom court en couleur de rarete, trait d'armement, effectif et PV, pastille de ligne, lignes 2047-2068) ; `data-slot`, `data-slot-kind`, `data-slot-line`, `data-slot-unit`, `aria-label` ; clic, Entree, Espace, Tab et fleches (FR-039, FR-043) ; glisser-deposer en Pointer Events, seuil de 4 px (R18) ; textes "ARRIVÉES ENNEMIES — 360°" ou "— BORD OUEST" et "RELIQUE — OBJECTIF" en DOM (depend de T059, T060)
- [X] T062 [US2] Rendre actif `apps/web/src/app/deploiement/UnitPool.svelte` : choix d'une unite (`pick`), unite placee retiree par un clic, source de glisser-deposer, en-tete "n/total" avec `data-placed`, place de chaque unite ; retirer `data-later-phase="pick-unit"` (depend de T059)
- [X] T063 [P] [US2] Rendre actifs "Déploiement automatique" et "Tout retirer" dans `apps/web/src/app/deploiement/Assistance.svelte`, et ajouter a la legende du panneau "Emplacement libre — vaisseau" (bleu) et "Emplacement libre — méca" (vert) ; retirer `auto-deploy` et `clear-deploy` (depend de T059)
- [X] T064 [P] [US2] Rendre actif l'interrupteur "Déploiement automatique" de `apps/web/src/app/briefing/DeployPrefs.svelte` (`deployment.autoDeploy`) ; retirer `auto-deploy-toggle` (depend de T059)
- [X] T065 [US2] Mettre a jour `apps/web/src/app/deploiement/Deploiement.svelte` et `Combat.svelte` : "Lancer le combat" inactif sans unite placee et lance avec `deployment.placementFor(...)` ; l'adresse directe du Combat utilise le placement existant, sinon `autoPlacement` (FR-031) (depend de T054, T059)

**Checkpoint**: le plateau fonctionne seul ; les combats partent du placement du joueur ; T055 a T057 verts, US1 toujours verte

---

## Phase 5: User Story 3 - Rejouer un combat a l'identique, partout (Priority: P3)

**Goal**: "Revoir le combat", graine dans l'adresse, empreinte lisible, combats de reference sous Node et dans trois moteurs, resolution automatique

**Independent Test**: lancer `?graine=7` avec deux competences, noter l'empreinte, revoir le combat, rejouer les memes entrees sous Node et dans les navigateurs (scenarios 4, 5 et 13 de `quickstart.md`)

### Tests for User Story 3 ⚠️

- [X] T066 [P] [US3] Ecrire `packages/sim/scripts/golden-update.test.ts`, execute seulement par `pnpm --filter @nova/sim golden:update` (projet `golden`, R11) : au moins 120 combats (Alpha et Bravo, deux theatres, deux formations, 20 graines pour Alpha et 10 pour Bravo ; un tiers avec un journal de commandes couvrant toutes les competences de Vell et de Tallow, ciblees comprises ; un tiers avec un placement manuel), noms `<escouade>-<theatre>-<formation>-<graine>[-commandes|-placement]`, ecriture triee de `packages/sim/tests/golden/combats.json` ; l'executer une fois
- [X] T067 [P] [US3] Ecrire `packages/sim/tests/golden.test.ts` : chaque combat de reference donne l'issue, le dernier pas et l'empreinte attendus ; tourne sous Node et dans le projet `navigateurs` (le JSON est importe, sans `node:fs`) (depend de T066)
- [X] T068 [P] [US3] Ecrire `packages/sim/tests/replay.test.ts` (SC-003) : pour chaque combat de reference avec commandes, un combat joue en direct (`issue` au fil des pas) et `runCombat` sur le journal complet donnent la meme empreinte a chaque pas ; 10 executions identiques
- [X] T069 [P] [US3] Ecrire `apps/web/tests/unit/clock-rates.test.ts` (SC-004) : le meme combat, avec les memes commandes datees, pilote par des images a 60, 120 et 144 Hz simulees et par des pauses, aboutit a la meme empreinte finale
- [X] T070 [P] [US3] Ecrire `apps/web/tests/e2e/replay.spec.ts` : combat avec competences jusqu'a la fin, empreinte notee, "Revoir le combat" : `data-combat-mode="replay"`, mention "REPLAY", competences inactives, meme issue et meme empreinte
- [X] T071 [P] [US3] Ecrire `apps/web/tests/e2e/determinism.spec.ts` (R10) : `?diag=1&graine=1#/combat` avec le placement automatique, horloge avancee jusqu'a la fin, `data-fingerprint` egal a l'entree `alpha-orbital-ring-1` de `combats.json` ; meme verification en rendu de repli (`?rendu=webgl`) et a 1280x720 puis 2560x1440 (SC-004) ; realise : en repli et aux trois tailles, pas et empreinte compares apres 1 s d'horloge arretee (projet `repli`), le combat complet contre la reference dans le projet `sans-gpu` (`contracts/ui-testing.md`)
- [X] T072 [P] [US3] Ecrire `apps/web/tests/e2e/auto-resolve.spec.ts` (FR-030a) : "Résoudre automatiquement" ouvre `data-modal="auto-resolve"` avec l'issue calculee ; avec `?diag=1&graine=1`, `data-fingerprint` egal a la reference ; "Revoir le combat" ouvre le Combat en replay et aboutit a la meme issue ; "Rejouer en manuel" mene au Deploiement ; retirer `auto-resolve` de `later-phase.spec.ts`

### Implementation for User Story 3

- [X] T073 [US3] Completer `apps/web/src/state/combat-runtime.ts` : `replay(setup)` (mode `replay`, commandes du joueur ignorees), et graine de `?graine=` pour `start()` (depend de T043)
- [X] T074 [US3] Ajouter "Revoir le combat" a `apps/web/src/app/combat/EndModal.svelte` et la mention "REPLAY" au HUD de `apps/web/src/app/combat/WaveBar.svelte` quand `combatHud.replay` (depend de T052, T073)
- [X] T075 [US3] Ajouter a `apps/web/src/app/DiagBadge.svelte`, sur l'ecran Combat, l'empreinte courante (`data-fingerprint`) et le pas (`data-tick`), seulement avec `?diag=1` (FR-022) (depend de T043)
- [X] T076 [US3] Creer `apps/web/src/app/briefing/AutoResolveModal.svelte` (lignes 1936-1954, FR-030a) et rendre actif "Résoudre automatiquement" dans `apps/web/src/app/briefing/Simulation.svelte` : `runCombat` avec la graine (`?graine=` ou tiree), le placement courant ou automatique, sans commande ; "Opération réussie"/"Opération échouée", unites perdues, butin estime, territoire ("+1 planète" ou "inchangé") ; `data-fingerprint` avec `?diag=1` ; "Fermer", "Rejouer en manuel", "Revoir le combat" (`replay` puis `#/combat`) (depend de T030, T073)
- [X] T077 [US3] Mettre a jour `.github/workflows/tests.yml` (installation `playwright install --with-deps chromium firefox webkit`, nouvelle etape "Determinisme dans les navigateurs" : `pnpm --filter @nova/sim test:browsers`, avant les tests Playwright) et la liste des commandes de `CLAUDE.md` (`pnpm --filter @nova/sim test:browsers`, prefixe `PW_CHROMIUM_EXECUTABLE` dans le conteneur)

**Checkpoint**: replay, graine, empreinte et resolution automatique fonctionnent ; combats de reference verts sous Node, Chromium, Firefox et WebKit

---

## Phase 6: User Story 4 - Des valeurs de briefing issues des regles (Priority: P4)

**Goal**: les ecrans lisent puissance, synthese, trajet, chances de victoire et vagues dans `@nova/sim`, egaux a la maquette

**Independent Test**: `pnpm -r test` (sim contre `derived.generated.json`) puis `test:e2e` (oracle et consultations) (scenario 10 de `quickstart.md`)

### Tests for User Story 4 ⚠️

- [X] T078 [P] [US4] Ecrire `packages/sim/tests/briefing.test.ts` (R9, SC-008) : pour Alpha, Bravo et Charlie, `squadSummary` = `derivedValues.squads`, `briefing` = `derivedValues.briefing`, `route(gemenon)` = `derivedValues.route`, `wavesFor` = `derivedValues.mission.waves`, `ultimateStatus(47)` = `derivedValues.combat.ultimate`, aux seuls ecarts admis listes dans le test (compositions de vagues, delai "0:12" au lieu de "0:03")
- [X] T079 [P] [US4] Ecrire `apps/web/tests/unit/no-derived-values.test.ts` : aucun import de `derivedValues` dans `apps/web/src` (les valeurs viennent de la sim)

### Implementation for User Story 4

- [X] T080 [US4] Creer `packages/sim/src/briefing.ts` en arithmetique entiere exacte : `squadSummary` (lignes 1079-1085 et 1180-1235 : emplacements remplis, unites, `power`, armement dominant, repartition avec pourcentage arrondi, PV et attaque totaux, defense moyenne), `route(planet)` (planet.ts), `briefing(squad, planet)` (`winChance`, lignes 1815-1820 ; `null` sans unite ; contrainte "au moins 2 unités de blindage moyen ou lourd", lignes 1849-1851), `ultimateStatus(level)` (lignes 2163-2164 et 2331-2332) ; exporter depuis `src/index.ts` (depend de T024, T026)
- [X] T081 [P] [US4] Lire les valeurs dans `@nova/sim` dans `apps/web/src/app/escouades/Board.svelte`, `SquadTabs.svelte` et `Summary.svelte` (depend de T080)
- [X] T082 [P] [US4] Lire les valeurs dans `@nova/sim` dans `apps/web/src/app/carte/Holo.svelte` (depend de T080)
- [X] T083 [P] [US4] Lire les valeurs dans `@nova/sim` dans `apps/web/src/app/briefing/Composition.svelte`, `Simulation.svelte` et `Objectives.svelte` (depend de T080)
- [X] T084 [P] [US4] Lire les valeurs dans `@nova/sim` dans `apps/web/src/app/deploiement/ObjectivePanel.svelte`, `apps/web/src/app/combat/Trinity.svelte`, `WaveBar.svelte` et `ActionBar.svelte` (ultime) (depend de T080)

**Checkpoint**: plus aucun ecran ne lit `derivedValues` ; oracle de la maquette et T078 verts

---

## Phase 7: User Story 5 - Tenir la fluidite avec 60 entites (Priority: P5)

**Goal**: releve de mesures complet et scenario de charge ; sim assez rapide pour le serveur

**Independent Test**: `/?diag=1&charge=1#/combat` sur le poste de reference, cadence relevee une minute (scenario 7 de `quickstart.md`) ; `pnpm -r test` (performance)

### Tests for User Story 5 ⚠️

- [X] T085 [P] [US5] Ecrire `packages/sim/tests/performance.test.ts` (SC-006) : `loadScenario()` pousse a 1 200 pas avec au moins 60 entites vivantes au pic ; mediane de 5 executions apres 2 d'echauffement sous 50 ms (`performance.now` permis dans les tests)
- [X] T086 [P] [US5] Ecrire `apps/web/tests/e2e/load.spec.ts` : `?diag=1&charge=1#/combat`, horloge avancee, `data-entities` atteint au moins 60 ; releve replie puis deplie par un clic ; sans `?diag=1`, aucun releve

### Implementation for User Story 5

- [X] T087 [US5] Ajouter `loadScenario()` a `packages/sim/src/combat.ts` (R14) : Alpha en `sol`, formation `ring`, placement automatique, graine 1, cinq vagues legeres a `waveIntervalTicks: 1` (60 ennemis, 5 unites, la relique) (depend de T041) ; realise : contre la planete hostile la plus difficile (10 vagues, 79 ennemis, pic de 84 entites), seul le delai entre vagues restant une entree du scenario (R14)
- [X] T088 [US5] Lancer le scenario de charge depuis `apps/web/src/app/combat/Combat.svelte` avec `?charge=1` (depend de T053, T087) ; relance a chaque fin, sans fenetre de fin
- [X] T089 [US5] Completer `apps/web/src/app/DiagBadge.svelte` sur l'ecran Combat : images par seconde, `data-entities`, pas, empreinte, mode de rendu ; repli et depli par un clic (FR-035) (depend de T075)
- [X] T090 [US5] Mesurer `?charge=1` avec le releve dans Chromium sans ecran et sur le poste de reference ; si la scene descend sous 60 images/s, reduire les redessins (barres de PV seulement quand les PV changent, aucun `Graphics` cree par image) dans `apps/web/src/scene/scenes/combat/*` (depend de T089) ; mesure : 144 images/s (frequence de l'ecran) en WebGPU et en WebGL2 materiels a 1920x1080 sur une minute, 27 a 32 images/s en Chromium sans ecran (rendu logiciel, 33 pour un combat ordinaire) ; la scene suivait deja ces regles, rien a reduire

**Checkpoint**: toutes les stories fonctionnent ; SC-005 se mesure, SC-006 est teste

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: documents, captures, validation complete

- [X] T091 [P] Mettre a jour `plan.md` §10 (versions de `@vitest/browser-playwright` et `playwright` dans la sim) et `WORKFLOW.md` §1 (la sim contient les regles ; plateau et combat jouables) et §5 (prochaine etape : phase P2 de la feuille de route, sans le plateau) (R16)
- [X] T092 [P] Etendre `apps/web/scripts/captures.mjs` : Deploiement avec placement automatique (360 degres et arc, spatial et terrestre) et Combat en cours a un pas fixe (`?graine=1`, horloge avancee), a cote des captures de la maquette (SC-010) ; realise : 13 planches, dont 3 variantes du Deploiement et le combat a 5 s
- [X] T093 Lancer `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @nova/sim test:browsers`, `pnpm -r build`, `pnpm --filter @nova/web test:e2e`, `pnpm --filter @nova/web perf` (score > 90 maintenu) et corriger jusqu'au vert
- [X] T094 Derouler `quickstart.md` a la main : empreintes sur Edge et Safari, matrice des modes de rendu pour Deploiement et Combat, cadence du scenario de charge, essai des 15 competences ; reporter les resultats dans la description de la PR ; realise : Edge 155 et Chrome 154 egaux a la reference sur 4 combats ; Safari indisponible sous Windows (WebKit 26.6 verifie par `test:browsers`) ; competences essayees a l'ecran pour Vell et Tallow (8 sur 15) ; les 7 de Braak, Halven et Andar, sans escouade engageable dans l'etat de demonstration, sont verifiees par les tests de la sim

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : aucune dependance.
- **Foundational (Phase 2)** : apres le Setup ; bloque toutes les stories.
- **US1 (Phase 3)** : apres le Foundational. C'est le MVP.
- **US2 (Phase 4)** : apres le Foundational pour le plateau ; T065 attend T054 (US1) pour brancher le placement sur le lancement.
- **US3 (Phase 5)** : apres US1 (le replay rejoue un combat ; la fenetre de fin existe).
- **US4 (Phase 6)** : apres le Foundational ; independante de US1 a US3, sauf T084 qui touche des composants de combat modifies en US1.
- **US5 (Phase 7)** : apres US1 ; T089 apres T075 (US3).
- **Polish (Phase 8)** : apres les stories voulues.

### User Story Dependencies

- **US1 (P1)** : socle seulement.
- **US2 (P2)** : socle ; s'integre a US1 par T065.
- **US3 (P3)** : US1.
- **US4 (P4)** : socle (fichiers de combat partages avec US1 en T084).
- **US5 (P5)** : US1, et US3 pour le badge.

### Within Each User Story

- Les tests d'abord, en echec avant l'implementation.
- Sim avant client : regles, puis moteur, puis projection, puis scene et composants.
- La story se termine a son point de controle avant de passer a la suivante en priorite.

### Parallel Opportunities

- Setup : T002 en parallele de T001 ; T003 apres T001.
- Foundational : T005 et T006 ; T010 a T014 ; T015 a T018 (chacun apres son test) ; T021, T023, T025 ; T028 a T030.
- US1 : tests T031 a T038 ; puis T045 et T046 ; T048 a T050.
- US2 : tests T055 et T056 ; T058 ; puis T063 et T064 apres T059.
- US3 : tests T066 a T072 (T067 apres T066).
- US4 : T078 et T079 ; puis T081 a T084.
- US5 : T085 et T086.
- Polish : T091 et T092.

---

## Parallel Example: User Story 1

```bash
# Tests de la story 1, en parallele :
Task: "Ecrire packages/sim/tests/rules/deroulement.test.ts"
Task: "Ecrire packages/sim/tests/rules/competences.test.ts"
Task: "Ecrire packages/sim/tests/rules/entrees.test.ts"
Task: "Ecrire packages/sim/tests/properties.test.ts"
Task: "Ecrire apps/web/tests/unit/combat-log.test.ts"
Task: "Ecrire apps/web/tests/unit/combat-runtime.test.ts"
Task: "Ecrire apps/web/tests/e2e/combat.spec.ts"
Task: "Ecrire apps/web/tests/e2e/combat-lifecycle.spec.ts"

# Une fois T043 et T044 faits :
Task: "Creer apps/web/src/scene/scenes/combat/draw.ts"
Task: "Creer apps/web/src/scene/scenes/combat/effects.ts"
Task: "Brancher apps/web/src/app/combat/WaveBar.svelte"
Task: "Brancher apps/web/src/app/combat/Forces.svelte"
Task: "Brancher apps/web/src/app/combat/CombatLog.svelte"
```

## Parallel Example: User Story 4

```bash
# Une fois T080 fait, les ecrans en parallele :
Task: "Escouades : apps/web/src/app/escouades/{Board,SquadTabs,Summary}.svelte"
Task: "Carte : apps/web/src/app/carte/Holo.svelte"
Task: "Briefing : apps/web/src/app/briefing/{Composition,Simulation,Objectives}.svelte"
Task: "Deploiement et Combat : ObjectivePanel, Trinity, WaveBar, ActionBar"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Setup), puis Phase 2 (Foundational), qui bloque tout le reste.
2. Phase 3 (US1) : un combat complet a l'ecran, placement automatique, competences, fenetre de fin.
3. **STOP and VALIDATE** : T031 a T039 verts, et scenario 1 de `quickstart.md` a la main.
4. Pousser sur la PR en brouillon si l'equipe veut juger le combat tot (CI verte : lint, typecheck,
   test, build, Playwright).

### Incremental Delivery

1. Setup et Foundational : regles deterministes de base, emplacements, vagues.
2. US1 : combat jouable (MVP).
3. US2 : plateau de deploiement, placement manuel.
4. US3 : replay, graine, empreinte, combats de reference dans trois moteurs, resolution automatique.
5. US4 : valeurs de briefing calculees par la sim.
6. US5 : releve de mesures et scenario de charge.
7. Polish : documents, captures, validation manuelle (Edge, Safari, poste de reference).

Chaque etape garde les tests des precedentes verts, y compris ceux de la phase P0 de la feuille de
route (oracle, scenes, mise en page, Lighthouse).

### Parallel Team Strategy

1. Ensemble sur Setup et Foundational.
2. Puis un developpeur sur US1 (sim puis client), l'autre sur US2 (plateau) et US4 (briefing), qui
   touchent d'autres fichiers ; T065 et T084 se font une fois US1 integree.
3. US3, US5 et Polish ensuite.

---

## Notes

- [P] : fichiers differents, aucune dependance ; [USn] : tracabilite vers la story.
- Chaque story se verifie seule, a son point de controle.
- Ne jamais regenerer `packages/sim/tests/golden/combats.json` pour faire passer un test : `golden:update` sert a assumer un changement de regle, visible dans le diff (FR-023).
- Apres `/speckit-implement`, lancer `/speckit-converge` jusqu'a ce qu'il ne signale plus d'ecart (`WORKFLOW.md` §3).
- A eviter : taches vagues, conflits dans un meme fichier, dependances entre stories qui en casseraient l'independance.
- `.specify/feature.json` est local et ignore par git : dans une nouvelle session, le faire pointer vers `specs/20261014-231011-simulation-combat` avant `/speckit-implement` (piege 8 de `WORKFLOW.md`).
