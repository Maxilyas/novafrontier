# Data Model: Socle de l'application : les 9 ecrans navigables et la scene

Entites de la spec (section Key Entities), telles que `@nova/data` les decrit en schemas zod
(`research.md` R8). Les identifiants et les enumerations reprennent les cles de la maquette
(`nova-frontier-v2.html`), ce qui simplifie la comparaison automatique avec elle (R9). Les
noms de types sont en anglais ; les libelles affiches restent en francais, dans les donnees.

Emplacements :

- `packages/data/src/schemas/` : schemas zod et types (`z.infer`) ;
- `packages/data/src/game/` : donnees de jeu portees de la maquette ;
- `packages/data/src/demo/` : etat de demonstration et valeurs derivees ;
- `apps/web/src/state/` : etat d'interface, non sauvegarde.

## 1. Enumerations

| Type | Valeurs | Source dans la maquette |
|---|---|---|
| `RarityId` | `com`, `rare`, `epic`, `leg`, `div` | `RAR` |
| `WeaponId` | `las`, `art`, `nuc`, `ion`, `cin` | `WEP` |
| `ActiveWeaponId` | `las`, `art`, `nuc` | armements a statut `active` |
| `UnitFamily` | `cmd`, `ship`, `mech` | champ `k` de `POOL` |
| `Armor` | `Leger`, `Moyen`, `Lourd` (libelles accentues dans les donnees) | champ `arm` |
| `Engine` | `Standard`, `Leger`, `Subspatial`, ou `null` pour les mecas | champ `eng` |
| `Formation` | `ring` (360 degres), `arc` | `SQUADS[].form` |
| `Theatre` | `orbital`, `sol` | variable `theatre` |
| `ActionPointsMode` | `fixe`, `achat` | variable `actionMode` |
| `ResearchTreeId` | `arm`, `flotte`, `cmdt` | `TREES` |
| `ResearchState` | `done`, `active`, `lock` | champ `s` des noeuds |
| `PlanetStatus` | `BASE`, `CONTROLE`, `HOSTILE`, `NEUTRE`, `MARCHAND`, `INEXPLORE` | champ `own` |
| `IconId` | les 37 `<symbol>` du sprite (`ic-cmd` ... `ic-academy`) | sprite d'icones |
| `ScreenId` | `escouades`, `atlas`, `base`, `recherche`, `carte`, `briefing`, `deploiement`, `combat`, `butin` | `SCREENS` |

## 2. Donnees de jeu (`game/`)

### Rarity (5)

| Champ | Type | Regle |
|---|---|---|
| `id` | `RarityId` | unique |
| `label` | texte | "Commun"... "Divin" |
| `color` | couleur `#rrggbb` | celle des jetons `--r-*` |
| `maxStars` | entier 2 a 6 | nombre d'etoiles affichables |
| `actionPoints` | entier 2 a 5 | points d'action du commandant de cette rarete |
| `legendarySlot` | booleen | vrai seulement pour `div` |

### Weapon (5) et DamageMatrix

| Champ | Type | Regle |
|---|---|---|
| `id` | `WeaponId` | unique |
| `label`, `symbol` | texte, 1 caractere | "Laser" / "L"... |
| `color` | couleur | |
| `strongAgainst`, `profile` | texte | textes de la maquette |
| `status` | `active` ou `planned` | `ion` et `cin` : `planned` |

`DamageMatrix` : `Record<ActiveWeaponId, Record<ActiveWeaponId, number>>`, les 9 cases
remplies, multiplicateurs strictement positifs (1,35 / 1 / 0,75 dans la maquette).

`Enemy` : `{ weapon: 'nuc', armor: 'Lourd', siteDefense: 68 }` (constante `ENEMY`).

### Unit (11), union discriminee par `family`

Champs communs :

| Champ | Type | Regle |
|---|---|---|
| `id` | texte (`c1`...`c5`, `s1`...`s4`, `m1`, `m2`) | unique |
| `family` | `UnitFamily` | discriminant |
| `visual` | entier >= 0 | index de silhouette pour le generateur d'illustration |
| `rarity` | `RarityId` | reference vers Rarity |
| `name`, `role`, `code` | texte | |
| `level` | entier >= 1 | |
| `stars` | entier >= 1 | <= `maxStars` de la rarete |

Commandant (`family: 'cmd'`) :

- `squadBonuses` : texte[], au moins 1 ;
- `skills` : `{ name, icon: IconId, description }[]`, de 1 a 5 ;
- `legendarySkill?` : `{ name, description }`.

Vaisseau et meca (`family: 'ship' | 'mech'`) :

| Champ | Type | Regle |
|---|---|---|
| `formation` | `unite` ou `escadrille` | `unite` implique `count = maxCount = 1` |
| `count`, `maxCount` | entiers >= 1 | `count <= maxCount` |
| `weapon` | `ActiveWeaponId` | |
| `armor` | `Armor` | |
| `engine` | `Engine` | `null` si et seulement si `family = 'mech'` |
| `tier` | entier 1 a 4 | palier visuel par defaut |
| `carrier` | booleen | porte-nefs (`s4`) |
| `stats` | `{ hp, attack, defense, range, speed }` | entiers > 0 |

### Building (9)

| Champ | Type | Regle |
|---|---|---|
| `id` | `hq`, `refinery`, `reactor`, `lab`, `shipyard`, `mechbay`, `radar`, `market`, `turret` | unique ; sert aussi de type d'illustration |
| `name` | texte | |
| `level` | entier >= 1 | |
| `position` | `{ x, y, width }` | coordonnees du plan de la base de la maquette |
| `icon` | `IconId` | |
| `status`, `description` | texte | |
| `upgrade` | `{ alloy, credits, duration, effect }` | valeurs affichees par la maquette : alliage `28000 + i*4200`, credits `1800 + i*260` (i = rang du batiment), duree "04:12:30", effet "+14% rendement" |

Compteur "9 / 12" : `buildingSlots: { used: 9, total: 12 }`.

### ResearchTree (3) et ResearchNode (32)

`ResearchTree` : `{ id: ResearchTreeId, label, nodes: ResearchNode[] }`.

| Champ du noeud | Type | Regle |
|---|---|---|
| `id` | texte (`a1`..., `f1`..., `k1`...) | unique dans tout le jeu |
| `name`, `icon`, `description` | texte, `IconId`, texte | |
| `position` | `{ x, y }` | coordonnees de l'arbre de la maquette |
| `state` | `ResearchState` | |
| `level` | `{ current, max }` | `current <= max` ; affiche "2/4" |
| `prerequisites` | id de noeud[] | noeuds du meme arbre, sans cycle |
| `openDecision` | booleen | badge "a trancher" |
| `legendary` | booleen | exige des artefacts |
| `cost` | `{ alloy, credits, artefacts? }` | `artefacts` present si et seulement si `legendary` |
| `duration`, `effect` | texte | |
| `labLevel` | entier | niveau de laboratoire requis |

Les couts, durees, effets et niveaux de laboratoire sont ceux que la maquette affiche : alliage
`18000 + x*22`, credits `2200 + x*3`, 3 artefacts si legendaire, duree `0{1 + x%5}:24:00`,
laboratoire `4 + 2*(nombre de prerequis)`, effet "+8% rendement" (x = abscisse du noeud).

### Planet (16)

| Champ | Type | Regle |
|---|---|---|
| `id` | texte (nom en minuscules, sans accent, par exemple `gemenon`) | unique |
| `name` | texte | "GEMENON" |
| `position` | `{ x, y }` | coordonnees du monde de la maquette |
| `radius` | entier > 0 | |
| `colors` | `{ light, dark }` | couleurs du globe |
| `status` | `PlanetStatus` | exactement une planete `BASE` |
| `resources` | texte[] | |
| `operations` | entier >= 0 | missions disponibles |
| `description` | texte | |

`PlanetIncome` (3) : `{ planet: id de planete, label, daily }`, par exemple Astrea IV,
"Colonie mere", 8400.

### Crate (3) et pool de lancement

| Champ | Type | Regle |
|---|---|---|
| `id` | `free`, `week`, `prem` | unique |
| `title`, `subtitle`, `availability`, `cta` | texte | textes de la maquette |
| `icon` | `IconId` | |
| `odds` | `{ rarity, percent }[]` | somme = 100 (a 0,01 pres) |

Pool de lancement : unites groupees par rarete (5 communes, 5 rares, 1 divine), plus 4 cases
verrouillees (2 epiques, 2 legendaires).

## 3. Etat de demonstration (`demo/`)

| Element | Contenu |
|---|---|
| `profile` | nom, grade, escadre, badge "G4", niveau 47, progression 0,64, prochain ultime 50 |
| `resources` | credits 128 400, alliage 184 720, carburant 9 420, artefacts 6 |
| `pendingIncome` | 14 280 sur 27 300, "3 j 16 h avant plafond", jauge 52 % |
| `squads` | 5 escouades : `{ id, name, commander, ships[3], mechs[2], defaultFormation, lockedUntilRank? }`. Alpha, Bravo et Charlie sont remplies selon la maquette ; Delta et Echo sont vides et verrouillees ("Grade 5", "Grade 6") |
| `researchQueue` | 3 emplacements : 2 recherches en cours `{ label, icon, progress, remaining }` et 1 libre |
| `mission` | cible `gemenon`, adversaire `Enemy`, relique de 1000 PV, portee 900 UA, moteur Standard (1,0 u/UA) |
| `defaults` | escouade `alpha`, filtre des effectifs `cmd`, points d'action `fixe`, theatre `orbital`, Atlas `{ unit: 's1', tier: 2, weapon: 'las' }`, batiment `hq`, arbre `arm`, noeud `a2`, echelle de carte "Secteur", coordonnees "X:24 Y:12" |

Regles : une escouade ne reference que des unites de la bonne famille (commandant `cmd`,
vaisseaux `ship`, mecas `mech`). Une escouade verrouillee n'a aucune unite. La composition est
figee (Clarifications de la spec).

## 4. Valeurs derivees (`demo/derived.generated.json`)

Valeurs que la maquette calcule, extraites d'elle par `apps/web/scripts/extract-mockup.mjs` et
verifiees par le test oracle (`research.md` R9, FR-013). Les nombres sont bruts ; le formatage
francais (`toLocaleString('fr-FR')`) se fait a l'affichage.

| Cle | Contenu | Ecrans |
|---|---|---|
| `squads[id]` | `filled` (0 a 6), `power`, `dominantWeapon`, `weaponMix` (effectifs par armement), `totalHp`, `totalAttack`, `averageDefense` | Escouades, Briefing |
| `route` | `distance`, `fuelRequired`, `fuelAvailable`, `travelTime` ("7h 06"), `squadSpeed`, `difficulty` (1 a 5), `loot`, `inRange`, `reach` | Carte |
| `briefing[id]` | `sentPower`, `enemyPower`, `advantage` (multiplicateur), `winChance` (%), `armoredUnits`, `constraintMet` | Briefing |
| `mission` | `waves[]` (`{ index, boss, composition, weapon, threat }`), `territoryGain` | Briefing, Deploiement, Combat |
| `deployment[id][theatre]` | `units[]` (`{ unit, line: 'front' ou 'back' }`), dans l'ordre de placement automatique de la maquette | Deploiement |
| `combatStart[id][theatre]` | `title`, `units[]` (`{ unit, maxHp }`), `actionPoints`, `skills` (nombre de competences disponibles), `waveCount`, `nextWaveIn`, `log[]` (`{ text, tone }`) | Combat |

`id` parcourt les escouades deverrouillees (alpha, bravo, charlie) ; `theatre` parcourt
`orbital` et `sol`. Exemples extraits de la maquette : puissance d'Alpha 2566 ; Gemenon a 681 UA,
difficulte 3, butin 2511, 6 vagues ; chances de victoire d'Alpha 38 %.

## 5. Etat d'interface (`apps/web/src/state/`, non sauvegarde)

| Etat | Valeur initiale | Modifie par |
|---|---|---|
| `route` | lue dans l'adresse (`contracts/routes.md`) | navigation, Precedent, adresse |
| `squad` | `defaults.squad` | onglets d'escouade (sauf verrouillees) |
| `rosterFilter` | `cmd` | filtre des effectifs, emplacement vide |
| `actionPointsMode` | `fixe` | selecteur "a trancher" (Escouades) |
| `formation[squad]` | `defaultFormation` de l'escouade | selecteurs de formation (Escouades, Briefing, Deploiement), partages |
| `theatre` | `orbital` | selecteur du Briefing |
| `atlas` | `defaults.atlas`, ou l'unite de l'adresse | Atlas : unite, palier, armement ; bouton "Fiche" |
| `building`, `tree`, `node` | valeurs par defaut | selections de Base et Recherche |
| `toast` | aucun | commandes d'une phase ulterieure (2,6 s) |

Au rechargement, tout revient aux valeurs initiales, sauf l'ecran, qui vient de l'adresse
(FR-014).

Regles :

- choisir une escouade verrouillee ne change rien ;
- choisir un emplacement vide fixe `rosterFilter` a sa famille ;
- ouvrir l'Atlas sur un vaisseau ou un meca aligne `atlas.tier` et `atlas.weapon` sur l'unite,
  comme la maquette ;
- changer de formation ne modifie ni les unites engagees ni les valeurs derivees (FR-017).

## 6. Etat d'une zone de scene

Une machine par scene (`carte`, `deploiement`, `combat`), exposee par `data-render-mode`
(`contracts/scene-host.md`) :

```text
inactive --(premiere ouverture)--> initialisation
initialisation --(WebGPU obtenu)--> webgpu
initialisation --(WebGL obtenu)--> webgl2 | webgl1
initialisation --(aucun rendu, ou echec)--> indisponible
webgpu | webgl2 | webgl1 --(contexte perdu)--> perdu
perdu --(contexte retabli)--> mode precedent
perdu --(3 s sans retablissement)--> indisponible
```

Quitter l'ecran met l'animation en pause sans changer le mode. Revenir reprend l'animation, ou
retente l'initialisation si le mode est `indisponible` a la suite d'une perte.

## 7. Invariants verifies par les tests de `@nova/data`

1. Identifiants uniques par collection, et uniques entre arbres de recherche.
2. References valides : escouades vers unites de la bonne famille ; unites vers raretes ;
   prerequis vers noeuds du meme arbre, sans cycle ; revenus vers planetes ; cible de mission
   vers une planete qui n'est pas la base.
3. Etoiles <= `maxStars` de la rarete ; `count <= maxCount` ; formation `unite` implique un
   effectif de 1 ; `engine` nul pour les seuls mecas.
4. Matrice de degats complete pour les 3 armements actifs.
5. Taux des coffres de somme 100.
6. Valeurs derivees : une entree par escouade deverrouillee et par theatre ; toutes les unites
   citees existent et appartiennent a l'escouade.
