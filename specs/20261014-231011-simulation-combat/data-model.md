# Data Model: Simulation du combat, plateau de deploiement et scene de combat

Entites de la feature, de la donnee de jeu (`@nova/data`) a l'etat du client (`apps/web`), en
passant par la simulation (`@nova/sim`). Les choix techniques sont justifies dans `research.md`
(references Rn) ; les exigences dans `spec.md` (FR-xxx, SC-xxx).

## 1. Conventions

| Notion | Representation | Reference |
|---|---|---|
| `Fixed` | entier = valeur x 65 536 (16.16), sous 2^31 en valeur absolue | R2 |
| Distance comparee | carre des ecarts en 1/256 d'unite d'arene, entier exact | R2 |
| `Angle` | entier en 1/1024 de tour, modulo 1 024 | R3 |
| `Tick` | entier, pas de 50 ms ; le pas 0 est l'etat initial | R5 |
| Identifiant d'entite | entier : unites de 1 a n dans l'ordre des emplacements, puis ennemis dans l'ordre d'apparition ; jamais reutilise | R6 |
| Graine | entier non signe de 32 bits | R4 |
| Empreinte | 16 chiffres hexadecimaux minuscules | R7 |

Arene : 1 600 x 816 unites. Plateau de deploiement : 988 x 752 unites (maquette).

## 2. Donnees de jeu (`@nova/data`)

### 2.1 Reglages du combat (`game/combat.ts`, schema `combatTuningSchema`)

| Champ | Valeur | Origine |
|---|---|---|
| `relicHp` | 1 000 | maquette, `startCombat` |
| `arena` | `{ width: 1600, height: 816 }` | maquette, `#arena` |
| `relicPosition` | `ring: {x: 800, y: 408}`, `arc: {x: 1200, y: 408}` | maquette, `startCombat` |
| `board` | `{ width: 988, height: 752 }` ; objectif `ring: {494, 376}`, `arc: {818, 376}` | maquette, `buildSlots` |
| `boardToArena` | `{ x: 1.04, y: 0.98 }` | maquette, `startCombat` |
| `slots.ring` | premiere ligne : 8, rayon 132, depart -90 degres ; seconde : 8, rayon 236, decalage d'un demi-pas | maquette, `buildSlots` |
| `slots.arc` | premiere ligne : 7, rayon 340, de pi - 0,95 sur 1,9 rad ; seconde : 6, rayon 225, de pi - 0,8 sur 1,6 rad | maquette, `buildSlots` |
| `slotTypes` | alternance par ligne, `ship` en premier | Clarifications |
| `spawn` | `ring` : tour complet ; `arc` : pi +/- 0,75 rad ; distance 520 + [0, 140), boss 620 ; aplatissement vertical 0,72 | maquette, `spawnWave` |
| `cooldownMs` | unite 550 ; ennemi contre unite 700 ; ennemi contre relique 800 | R5 |
| `waveIntervalMs` | 12 000 | Clarifications |
| `relicStrikeRadius` | 70 ; part de l'attaque 0,5 | maquette, `combatLoop` |
| `defenseConstant` | 130 | maquette, `dmg` |
| `minDamage` | 1 | maquette, `dmg` |
| `maxDurationMs` | 600 000 | spec, Assumptions |
| `advantageLogMs` | 1 500 | maquette (`CB.t % 90`) |

### 2.2 Archetypes d'ennemis (`game/combat.ts`, schema `enemyArchetypeSchema`)

Un archetype par menace. `composition` est le libelle corrige (FR-004).

| `threat` | `composition` | `count` | `hp` | `attack` | `defense` | `range` | `speed` (unites/s) | `color` | `size` |
|---|---|---|---|---|---|---|---|---|---|
| `l` | Intercepteurs ×12 | 12 | 120 | 11 | 22 | 110 | 76,5 | `#8fd6ff` | 7 |
| `m` | Intercepteurs lourds ×9 | 9 | 230 | 18 | 22 | 110 | 54 | `#ffd07a` | 10 |
| `h` | Frégates de raid ×5 | 5 | 520 | 34 | 46 | 110 | 37,8 | `#ff7a5c` | 14 |
| `b` | Croiseur porte-nef | 1 | 2 600 | 90 | 70 | 150 | 21,6 | `#ff5fc0` | 22 |

Les barres de PV de la scene s'affichent pour `m`, `h` et `b` (maquette : `f.max > 200`).

### 2.3 Competences (`schemas/unit.ts`, `skillSchema` etendu)

```ts
skillSchema = z.object({
  name, icon, description,                       // existants
  target: z.enum(['none', 'point', 'unit', 'enemy', 'unit-slot']),
  effect: skillEffectSchema,                     // union discriminee sur `kind`
});
```

| `kind` | Parametres | Competences |
|---|---|---|
| `strike-point` | `damage`, `radius` | Frappe orbitale (420, 150) |
| `strike-nearest-relic` | `damage` | Abordage eclair (420) |
| `strike-enemy` | `damage` | Tir de soutien (200) |
| `charge` | `damage`, `radius` | Charge lourde (420, 150) |
| `defense-buff` | `multiplier`, `durationMs` | Bouclier de flotte (1,7 ; 7 000), Garde serree (1,15 ; 8 000) |
| `front-damage-cut` | `multiplier`, `durationMs` | Mur d'acier (0,5 ; 7 000) |
| `heal-unit` | `share` | Reparation (0,25) |
| `heal-all` | `share` | Ralliement (0,10) |
| `heal-point` | `share`, `radius` | Reparation de zone (0,12 ; 150) |
| `freeze` | `threats`, `durationMs` | Impulsion EM (`['l']` ; 4 000) |
| `attack-buff-unit` | `multiplier`, `until: 'next-wave'` | Surcharge (1,5) |
| `enemy-miss` | `chance`, `durationMs` | Fumigene (0,3 ; 6 000) |
| `loot-bonus` | `share` | Pillage (0,15) |
| `relocate` | - | Repli tactique |

Invariant teste : `target` est coherent avec `kind` (`point` pour `strike-point` et `heal-point`,
`unit` pour `heal-unit` et `attack-buff-unit`, `enemy` pour `strike-enemy`, `unit-slot` pour
`relocate`, `none` sinon). Description de Bouclier de flotte : "+70% DÉF pendant 7 s" (FR-014a).

### 2.4 Valeurs derivees

`derived.generated.json` et `derivedValuesSchema` ne changent pas : c'est l'instantane des valeurs
de la maquette (R9). L'application ne les importe plus ; seul le test de la sim (R9) et l'oracle
Playwright les lisent.

## 3. Simulation (`@nova/sim`)

### 3.1 Emplacement (`Slot`)

| Champ | Type | Regle |
|---|---|---|
| `index` | entier | rang dans la formation : premiere ligne, puis seconde, dans l'ordre de la maquette |
| `line` | `'front' \| 'back'` | |
| `kind` | `'ship' \| 'mech'` | alterne dans la ligne, `ship` en premier |
| `board` | `{ x: Fixed, y: Fixed }` | position sur le plateau |
| `arena` | `{ x: Fixed, y: Fixed }` | position dans l'arene (transposition `boardToArena`) |

`formationSlots(formation, theatre)` : en `orbital`, seuls les emplacements `ship`.

### 3.2 Placement

`Placement = ReadonlyArray<{ unit: string; slot: number }>` (identifiant d'unite de `@nova/data`,
rang d'emplacement). `validatePlacement(squad, theatre, formation, placement)` verifie (FR-044) :
unite de l'escouade, engageable dans le theatre (vaisseau, ou meca en `sol`), placee une fois ;
emplacement existant, de son type, occupe une fois. `autoPlacement(squad, theatre, formation)`
applique FR-040.

### 3.3 Entrees (`CombatSetup`)

| Champ | Type | Regle |
|---|---|---|
| `seed` | entier 32 bits non signe | R4 |
| `squad` | `Squad` (`@nova/data`) | escouade complete : les tests en construisent d'autres que celles de la demonstration |
| `theatre` | `Theatre` | |
| `formation` | `Formation` | |
| `placement` | `Placement` | valide (3.2), au moins une unite |
| `planet` | identifiant de planete | donne la difficulte, donc les vagues |
| `commands` | `readonly Command[]` | tries par `tick` croissant ; ordre conserve a pas egal |
| `waveIntervalTicks` | entier, facultatif | scenario de charge seulement (R14) ; par defaut, `waveIntervalMs / 50` |

### 3.4 Commande

```ts
type Command = { tick: Tick; skill: number; target?: Target };   // `skill` : rang dans la barre
type Target =
  | { kind: 'point'; x: Fixed; y: Fixed }                        // coordonnees d'arene
  | { kind: 'unit'; id: number }
  | { kind: 'enemy'; id: number }
  | { kind: 'unit-slot'; id: number; slot: number };
```

Regles : la competence existe dans la barre (rang < points d'action de la rarete) ; la cible a la
forme demandee par `target` de la competence. Une commande mal formee est une erreur d'entree
(refusee). Une commande bien formee sans cible valide au pas d'application ne s'applique pas
(FR-014b) : evenement `skill` avec `applied: false`.

### 3.5 Etat (`CombatState`)

| Partie | Champs |
|---|---|
| general | `tick`, `rng` (4 mots), `outcome` (`'running' \| 'victory' \| 'defeat'`), `endReason` (`'relic' \| 'cleared' \| 'timeout'`) |
| relique | `hp: Fixed`, `maxHp: Fixed`, `x`, `y` |
| unites (`CombatUnit`) | `id`, `unitId`, `slot`, `line`, `kind`, `x`, `y`, `hp`, `maxHp` (`Fixed`), `attack`, `defense`, `range`, `weapon`, `cooldown` (pas restants), `attackBuffUntilWave` (rang de vague ou -1) |
| ennemis (`CombatEnemy`) | `id`, `wave` (rang), `threat`, `weapon`, `x`, `y`, `hp`, `maxHp`, `attack`, `defense`, `range`, `speed` (`Fixed` par pas), `cooldown`, `frozen` (pas restants) |
| vagues | `waves` (liste de `WaveSpec`), `spawned` (nombre), `nextWaveIn` (pas) |
| effets | `defenseBuff` (`{ multiplier, ticks }` ou nul), `frontDamageCut` (idem), `enemyMiss` (`{ chance, ticks }` ou nul) |
| commandant | `actionPoints`, `spentSkills` (masque de bits), `pillage` (`{ wave, status: 'pending' \| 'won' \| 'lost' }` ou nul) |

Les unites detruites restent dans `units` (PV a zero, n'agissent plus) ; les ennemis detruits sont
retires a la fin du pas (R6). L'etat est en lecture seule pour l'application (principe III).

### 3.6 Evenements (`SimEvent`)

Types de `plan.md` §6, avec leurs donnees :

| `type` | Donnees |
|---|---|
| `wave` | `index`, `boss`, `composition` |
| `spawn` | `id`, `threat`, `x`, `y` |
| `shot` | `from`, `to` (identifiants, 0 pour la relique), `weapon`, `missed` |
| `hit` | `target`, `damage: Fixed`, `multiplier: Fixed` (matrice) |
| `death` | `id`, `side` (`'unit' \| 'enemy'`), `boss` |
| `skill` | `skill`, `applied`, `target?`, `bonus?` (`'loot'` quand Pillage est obtenu) |
| `objective` | `damage: Fixed`, `hp: Fixed` (relique touchee) |
| `end` | `outcome`, `reason` |

Chaque evenement porte `tick`. Ils servent la scene et le journal ; ils n'entrent pas dans
l'empreinte (ils se deduisent de l'etat et des entrees).

### 3.7 Resultat (`CombatResult`)

`{ outcome, reason, ticks, wavesSpawned, wavesTotal, unitsLeft, unitsEngaged, relicHp: Fixed,
lootBonus: boolean, fingerprint }` : ce qu'affichent la fenetre de fin (FR-030) et celle de la
resolution automatique (FR-030a).

### 3.8 Combat de reference (`tests/golden/combats.json`)

`{ name, setup: CombatSetup, expected: { outcome, ticks, fingerprint } }` (R11).

### 3.9 Valeurs de briefing

Fonctions pures qui rendent les memes formes que `@nova/data` (`SquadDerived`, `RouteDerived`,
`BriefingDerived`, `Wave`), plus `ultimateStatus(level)` et `engagedUnits(squad, theatre)`. Detail :
`contracts/sim-package.md`.

## 4. Etat du client (`apps/web`)

### 4.1 Deploiement (`state/deployment.svelte.ts`)

| Champ | Type | Regle |
|---|---|---|
| `autoDeploy` | booleen | interrupteur du Briefing, vrai par defaut (FR-041) |
| `placements` | dictionnaire `escouade/theatre/formation` -> `Placement` | session seulement |
| `picked` | identifiant d'unite ou nul | unite choisie dans la liste (FR-039) |
| `dragging` | `{ unit, from: 'list' \| slot }` ou nul | glisser-deposer en cours (R18) |

### 4.2 Moteur du combat (`state/combat-runtime.ts`)

| Champ | Type | Regle |
|---|---|---|
| `phase` | `'idle' \| 'running' \| 'paused' \| 'ended'` | 5.1 |
| `mode` | `'live' \| 'replay'` | FR-021 |
| `setup` | `CombatSetup` | entrees ; `commands` s'allonge en direct |
| `sim` | instance de combat | |
| `accumulatorMs`, `lastFrame` | nombres | horloge (R12) ; hors simulation |
| `previous` | positions par identifiant | interpolation (R12) |
| `designation` | `{ skill, step: 'unit' \| 'slot' \| 'point' \| 'enemy', unit? }` ou nul | 5.2 |
| `result` | `CombatResult` ou nul | a la fin |

### 4.3 Projection pour le HUD (`state/combat.svelte.ts`)

`hud` (`$state.raw`) : vague courante et total, PV de la relique en pourcentage, secondes avant la
prochaine vague, points d'action, competences depensees, mode replay ; `forces` : par unite engagee,
nom, armement, PV, maximum, detruite (mise a jour tous les 5 pas) ; `log` : au plus 11 lignes
`{ text, tone: '' | 'ok' | 'crit' | 'gold' }` ; `end` : resume de fin ou nul.

### 4.4 Resolution automatique

`{ setup, result }` gardes le temps de la fenetre ; "Revoir le combat" passe `setup` (avec un
journal vide) au moteur en mode `replay`.

## 5. Transitions d'etat

### 5.1 Cycle de vie d'un combat

```text
idle --(Lancer le combat | adresse directe, au moins une unite placee)--> running
running --(ecran quitte | onglet masque)--> paused --(retour)--> running
running --(evenement end)--> ended --(fenetre de fin : Revoir)--> running [mode replay]
ended --(Redeployer | Retour a la carte)--> ended (garde pour le plateau, FR-041 / story 2)
* --(Lancer le combat)--> running [nouveau combat, mode live]
```

Une ouverture de l'adresse du Combat en phase `ended` ou `idle` demarre un nouveau combat (FR-031).

### 5.2 Designation

```text
aucune --(competence ciblee activee)--> en cours (step selon `target`)
en cours --(cible valide choisie)--> [unit-slot : step 'slot'] | commande au pas suivant -> aucune
en cours --(Echap | clic droit | meme competence | autre competence | fin | ecran quitte)--> aucune
```

### 5.3 Deploiement

Le placement d'une combinaison escouade/theatre/formation n'existe qu'une fois cree : a la premiere
arrivee au Deploiement (automatique si `autoDeploy`, sinon vide) ou par la premiere action du
joueur. "Tout retirer" le vide ; "Deploiement automatique" le remplace.

## 6. Invariants verifies par les tests

- Etat du combat : PV de chaque entite dans [0, maximum] ; relique dans [0, 1 000 x 65 536] ; tous
  les champs numeriques entiers et sous 2^31 ; `tick` <= 12 000 (SC-007).
- Identifiants uniques et croissants ; un ennemi retire n'est plus reference.
- Points d'action : `actionPoints` = points de la rarete moins le nombre de bits de `spentSkills`.
- Placement : resultat de `autoPlacement` toujours valide ; lignes egales a celles de
  `derivedValues.deployment` (SC-012).
- Donnees : chaque competence a un `effect` coherent avec sa `target` ; chaque archetype a un
  effectif et des caracteristiques strictement positifs.
