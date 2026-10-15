# Research: Simulation du combat, plateau de deploiement et scene de combat

Recherche de la phase 0 du plan (`plan.md` de cette feature). Chaque point tranche une inconnue
du contexte technique. Verifications faites le 2026-10-14 : registre npm pour les versions, code de
la maquette (`nova-frontier-v2.html`, lignes 1806-1820 et 2161-2375) et du depot apres la phase P0
de la feuille de route.

## R1. Versions et dependances

**Decision** : aucune nouvelle dependance d'execution. Deux dependances de developpement, dans
`packages/sim` seulement :

| Paquet | Version | Role | Contrainte verifiee |
|---|---|---|---|
| `@vitest/browser-playwright` | 5.0.2 | executer les tests de determinisme dans de vrais navigateurs (R10) | pair exact `vitest 5.0.2`, deja installe ; 5.0.4 existe mais exigerait de monter Vitest partout |
| `playwright` | 1.63.0 | moteurs Chromium, Firefox et WebKit pour ce fournisseur | meme version que `@playwright/test` de `apps/web` |

`@nova/sim` passe de "types seulement" a une dependance d'execution sur `@nova/data`, dont il lit
les donnees de jeu (unites, raretes, matrice, planetes, reglages du combat). `apps/web` ajoute
`@nova/sim` a ses dependances.

**Rationale** : `plan.md` §6 fait venir les entrees de la sim de `packages/data` ; Vitest est deja
l'outil de test de la sim, son mode navigateur fait tourner le meme fichier de test dans les trois
moteurs sans code de test dans l'application.

**Alternatives considered** : bundler la sim a part et l'injecter dans une page Playwright
(script de build supplementaire) ; une page de test dans l'application (code reserve aux tests,
ecarte en phase P0 de la feuille de route) ; un service de test en ligne dans la CI (payant, et
Safari reste de toute facon verifie a la main, R10).

## R2. Representation des nombres

**Decision** : toutes les grandeurs de l'etat du combat sont des entiers JavaScript.

- **Virgule fixe 16.16** (`plan.md` §6) pour les positions, vitesses, PV, multiplicateurs et
  degats : la valeur `v` est stockee `round(v x 65536)`. Les PV, positions et degats restent sous
  2^31 (entier signe sur 32 bits), ce que les tests de proprietes verifient : l'empreinte (R7) lit
  des mots de 32 bits.
- **Operations** : addition et soustraction directes ; produit et quotient par des fonctions
  dediees (`fmul`, `fdiv`) qui tronquent explicitement (`Math.trunc`) et dont les operandes sont
  bornes pour que le resultat intermediaire reste sous 2^53, donc exact en double precision.
- **Distances** : comparees au carre, sur des coordonnees ramenees au 1/256 d'unite d'arene
  (decalage de 8 bits). En 16.16, un ecart de 1 600 unites vaut 1,05 x 10^8 et son carre
  depasserait 2^53 ; au 1/256, le carre d'une diagonale de l'arene reste sous 10^12. Les portees
  sont converties de la meme facon.
- **Racine carree** : racine entiere par Newton sur des entiers (`isqrt`), exacte par
  construction, pour normaliser les deplacements et pour la distance des planetes (R9).
- **Donnees de jeu** : les valeurs decimales de `@nova/data` (1,35 ; 0,72 ; vitesses) sont
  converties une fois, a la creation du combat, par `Math.round(x * 65536)`. Multiplication et
  arrondi sont exacts et identiques sur tous les moteurs (IEEE 754) ; le resultat est un entier.
- **Garde-fou** : le test de purete (`packages/sim/tests/purity.test.ts`) interdit en plus
  `Math.pow`, `Math.exp`, `Math.log*`, `Math.tan`, `Math.asin`, `Math.acos`, `Math.atan`,
  `Math.sinh`, `Math.cosh`, `Math.tanh`, `Math.cbrt` et l'operateur `**`, dont le resultat n'est
  pas garanti identique d'un moteur a l'autre (ECMAScript les dit "implementation-approximated").

**Rationale** : principe II de la constitution et `plan.md` §6 et §11 ; les quatre operations et
l'arrondi sur des doubles sont exacts et reproductibles, ce sont les fonctions transcendantes et
les depassements de 2^53 qui cassent le determinisme. Ramener les distances au 1/256 est une
precision de mise en oeuvre de "positions et distances en virgule fixe 16.16", reportee dans
`plan.md` §6 (R16).

**Alternatives considered** : `BigInt` (exact mais 10 a 50 fois plus lent, et SC-006 demande
moins de 50 ms) ; tout en 24.8 (s'ecarte de `plan.md` §6 sans necessite) ; `Math.fround` et
flottants simple precision (reproductibles en theorie, mais `plan.md` impose la virgule fixe) ;
`Math.sqrt` (correctement arrondie en pratique, mais l'entier exact evite toute discussion).

## R3. Angles et trigonometrie

**Decision** : les angles sont des entiers en 1/1024 de tour (`plan.md` §6). Une table de sinus
d'un quart de tour (257 valeurs en 16.16) est generee une fois par un script hors de `src/`
(`packages/sim/scripts/trig-table.mjs`), puis commitee dans `src/trig-table.ts` ; `sin` et `cos`
s'en deduisent par symetrie. Un test Vitest recalcule la table avec `Math.sin` (permis dans les
tests) et la compare au fichier. Les directions de deplacement ne passent pas par un angle : le
vecteur vers la cible est normalise par `isqrt` (R2), ce qui supprime tout `atan2`.

Usages : direction d'apparition des ennemis (R4), emplacements des formations (data-model.md
§2.3). Les angles de la formation en arc de la maquette, exprimes en radians, sont arrondis au
1/1024 de tour le plus proche (ecart de position inferieur a 1,5 unite d'arene, verifie par
`tests/formation.test.ts`).

**Rationale** : aucune fonction trigonometrique a l'execution ; une table d'un quart de tour
suffit et se verifie en une ligne.

**Alternatives considered** : table complete de 1 024 valeurs (4 fois plus grosse, sans gain) ;
CORDIC (plus de code pour rien) ; angles calcules avec `Math.atan2` puis tables (interdit).

## R4. Generateur pseudo-aleatoire

**Decision** : `xoshiro128**` (etat de 4 mots de 32 bits), initialise par `splitmix32` a partir de
la graine (entier non signe de 32 bits). Un tirage dans [0, n) vaut
`Math.floor(u32 * n / 2^32)`, exact tant que `n < 2^21`. Ordre des tirages, fixe par les regles :
pour chaque ennemi d'une vague, dans l'ordre d'apparition, l'angle puis la distance ; pour chaque
tir ennemi sous Fumigene, un tirage de reussite. L'etat du generateur fait partie de l'empreinte.

**Rationale** : `plan.md` §6 cite `xoshiro128**` ou `mulberry32` ; xoshiro a une periode de
2^128 - 1 et passe les batteries de tests statistiques, pour un cout negligeable. Toutes ses
operations sont des operations entieres sur 32 bits (`Math.imul`, decalages), identiques partout.

**Alternatives considered** : `mulberry32` (periode de 2^32, suffisante mais sans marge ; il reste
utilise par la scene provisoire, hors de la sim) ; `crypto.getRandomValues` (non reproductible).

## R5. Base de temps

**Decision** : pas fixe de 50 ms, 20 pas par seconde (`plan.md` §6). Les durees de la maquette,
comptees en images a 60 images/s, sont converties en pas (3 images par pas), arrondies au plus
proche ; les durees decidees en clarification sont exprimees directement en secondes. Les reglages
sont des donnees en millisecondes (`@nova/data`, R8), convertis par `round(ms / 50)`.

| Grandeur | Maquette | Retenu | Pas |
|---|---|---|---|
| Recharge d'une unite du joueur | 34 images | 0,55 s | 11 |
| Recharge d'un ennemi contre une unite | 42 images | 0,7 s | 14 |
| Recharge d'un ennemi contre la relique | 48 images | 0,8 s | 16 |
| Delai entre deux vagues | 200 images (3,3 s) | 12 s (Clarifications) | 240 |
| Bouclier de flotte, Mur d'acier | 420 images | 7 s | 140 |
| Impulsion EM | 200 images | 4 s (Clarifications) | 80 |
| Fumigene | - | 6 s | 120 |
| Garde serree | - | 8 s | 160 |
| Duree maximale d'un combat | - | 600 s | 12 000 |

Vitesses : la maquette avance de `spd x 1,5` unites par image ; la donnee est en unites d'arene
par seconde (76,5 ; 54 ; 37,8 ; 21,6), et la sim avance de `v / 20` par pas.

Semantique d'une recharge : une arme qui tire au pas `t` peut tirer de nouveau au pas `t + n`.
La premiere vague apparait a la creation du combat (pas 0), avec 240 pas avant la suivante ; le
minuteur du HUD affiche `ceil(pas restants / 20)` secondes.

**Rationale** : FR-011 (durees de la maquette, independantes du rythme d'affichage) ; la maquette
avancait d'une etape par image, donc deux fois plus vite a 120 Hz.

**Alternatives considered** : pas de 1/60 s (calque sur la maquette, mais `plan.md` §6 fixe
50 ms et le serveur rejoue trois fois plus de pas) ; conserver les images de la maquette comme
unite des donnees (le pas deviendrait une conversion implicite partout).

## R6. Ordre de resolution d'un pas

**Decision** : chaque pas suit le meme ordre, qui reprend celui de `combatLoop` :

1. commandes datees de ce pas, dans l'ordre du journal (competences, FR-013) ;
2. ennemis, dans l'ordre d'apparition : immobilisation, deplacement, tir sur une unite ou frappe
   de la relique (FR-006) ;
3. unites du joueur, dans l'ordre de leurs emplacements : tir (FR-007) ;
4. retrait des ennemis detruits, fin des effets echus (bouclier, mur, garde, fumigene, surcharge,
   immobilisations), evaluation de Pillage ;
5. minuteur de vague, puis apparition de la vague suivante s'il est echu ;
6. fin du combat : chute de la relique (defaite), puis toutes les vagues apparues et aucun ennemi
   (victoire), puis duree maximale (defaite).

Regles de departage et precisions, toutes deterministes :

- egalite de distance : l'entite d'identifiant le plus petit l'emporte (les identifiants croissent
  avec l'ordre d'apparition) ;
- une entite dont les PV sont a zero ou moins n'agit plus, meme si elle n'est retiree qu'a
  l'etape 4 (dans la maquette, un ennemi tue par une competence pouvait encore tirer une fois) ;
- un ennemi sans unite a viser avance vers la relique et s'arrete a 70 unites, distance a laquelle
  il la frappe (dans la maquette, il oscillait autour du centre) ;
- les tirs sont instantanes : le trait dans la scene n'est qu'un effet.

**Rationale** : un ordre unique et ecrit est la condition du determinisme ; les deux precisions
suppriment des comportements de la maquette qui n'apportaient rien et que la spec ne decrit pas.

**Alternatives considered** : resolution simultanee (degats calcules sur l'etat du debut du pas,
plus juste mais plus eloignee de la maquette et deux fois plus de memoire).

## R7. Empreinte

**Decision** : l'empreinte est un FNV-1a sur deux voies de 32 bits (bases de depart differentes),
calcule sur une serialisation canonique de l'etat en mots de 32 bits, et affiche en 16 chiffres
hexadecimaux. L'etat serialise comprend : pas courant, etat du generateur, relique, chaque unite et
chaque ennemi (dans l'ordre des identifiants, tous les champs de data-model.md §2.4), vagues,
effets en cours, points d'action, competences depensees, Pillage, issue.

**Rationale** : synchrone et sans dependance (le serveur et les tests l'appellent a chaque pas si
besoin) ; `Math.imul` garantit le meme resultat partout ; 64 bits suffisent a distinguer les
etats d'un combat et d'un jeu de reference, ce n'est pas une signature de securite (la validation
serveur rejoue le combat, principe IV).

**Alternatives considered** : SHA-256 par WebCrypto (asynchrone, API differente entre Node et
navigateur) ; empreinte de 32 bits (collisions trop probables sur 10 000 combats) ; JSON de l'etat
compare directement (lourd a transporter et a afficher).

## R8. Donnees de combat et regles

**Decision** : les **valeurs** vont dans `@nova/data`, les **regles** dans `@nova/sim`.

- `@nova/data` gagne `game/combat.ts` : reglages du combat (relique, arene, positions de
  l'objectif, rayons et angles des emplacements, distances d'apparition, aplatissement vertical,
  durees en millisecondes, constante 130 de la formule de degats, rayon de frappe de la relique,
  duree maximale) et les **archetypes d'ennemis** par menace (libelle de composition corrige,
  effectif, PV, ATQ, DEF, portee, vitesse, couleur et taille de la forme provisoire).
- Le schema des competences gagne `target` (aucune, point, unite, ennemi, unite puis emplacement)
  et `effect`, union discriminee dont chaque variante porte ses parametres (degats, rayon, duree,
  multiplicateur, part de PV). Les 15 competences de `game/units.ts` sont completees selon la table
  FR-014, et la description de Bouclier de flotte devient "+70% DÉF pendant 7 s" (FR-014a).
- `@nova/sim` ne contient aucune valeur de reglage : il les lit et les convertit (R2, R5).

**Rationale** : `plan.md` §8 (`packages/data` : donnees typees et schemas zod ; `packages/sim` :
regles) ; les memes schemas valideront les donnees cote serveur (principe IV) ; equilibrer le jeu
ne touche plus au code des regles.

**Alternatives considered** : constantes dans la sim (melange donnees et regles) ; effets des
competences codes par nom de competence, comme la maquette (fragile et non typable).

## R9. Valeurs de briefing calculees par la sim

**Decision** : `@nova/sim` porte les formules de la maquette en arithmetique entiere exacte :
`power`, synthese d'escouade, armement dominant, `dist` (racine entiere, R2), `diffOf`, `lootOf`,
`fuelOf`, temps de trajet, `winChance`, `wavesFor`, emplacements des formations, placement
automatique (`autoPlace`, applique par type, R18), unites engagees et leur ordre, statut de
l'ultime. Les ecrans Escouades, Carte, Briefing, Deploiement et
Combat les lisent dans la sim au lieu de `derivedValues`.

Chaine de verification :

1. la maquette = `derived.generated.json` : test oracle Playwright de la phase P0, inchange ;
2. `derived.generated.json` = sim : nouveau test Vitest de `packages/sim`, pour chaque escouade et
   chaque theatre, au moyen d'une liste explicite d'ecarts admis : compositions de vagues (libelles
   corriges, FR-004) et delai avant la premiere vague ("0:12" au lieu de "0:03", Clarifications).
   Le placement automatique par type donne aux unites les memes lignes que la maquette
   (`deployment`), ce que le test verifie aussi (SC-012) ; l'ordre de la force engagee
   (`combatStart`) suit desormais l'ordre des emplacements types et peut differer.

`derived.generated.json` reste dans `@nova/data` comme instantane des valeurs de la maquette ; il
n'est plus importe par l'application.

**Rationale** : FR-033 et SC-008 ; le test Vitest est rapide et tourne a chaque `pnpm -r test`,
l'oracle Playwright garde le lien avec la maquette. Les arrondis de la maquette (`Math.round`,
troncature `|0`) sont reproduits sur des rationnels exacts ; un ecart d'arrondi flottant de la
maquette apparaitrait dans le test et serait traite au cas par cas.

**Alternatives considered** : supprimer le fichier et comparer directement la sim a la maquette
dans Playwright (plus lent, et la CI ne verifierait plus les valeurs sans navigateur) ; garder les
formules flottantes hors de la sim (principe II).

## R10. Verifier le determinisme entre moteurs

**Decision** :

- **Node** : `pnpm --filter @nova/sim test` rejoue les combats de reference (R11) et compare les
  empreintes.
- **Chromium, Firefox, WebKit** : le meme fichier de test tourne en mode navigateur de Vitest,
  fournisseur Playwright, par `pnpm --filter @nova/sim test:browsers` (configuration en
  `projects` : `node` par defaut, `navigateurs` a part). La CI installe Firefox et WebKit en plus
  de Chromium, et lance ce script apres l'installation des navigateurs.
- **Safari reel et Edge** : verification manuelle. Avec `?diag=1&graine=<n>`, "Resoudre
  automatiquement" affiche l'empreinte du combat calcule ; elle doit etre celle du combat de
  reference correspondant (`quickstart.md`). WebKit de Playwright partage le moteur JavaScript de
  Safari (JavaScriptCore), d'ou une forte presomption, mais la spec exige Safari lui-meme.
- **Application** : un test Playwright (Chromium) lance `?graine=<n>#/combat`, avance l'horloge de
  la page jusqu'a la fin et compare l'empreinte affichee au combat de reference : il couvre le
  chemin complet (horloge, commandes, scene), pas seulement la sim.

**Rationale** : SC-002 et SC-004 ; aucune page ni aucun code reserve aux tests dans l'application.

**Alternatives considered** : uniquement Node (ne prouve rien pour JavaScriptCore et
SpiderMonkey) ; projets Firefox et WebKit dans les tests Playwright de l'application (la scene et
le WebGPU de ces moteurs en CI ajoutent du bruit sans rien prouver de plus sur la sim).

## R11. Combats de reference

**Decision** : `packages/sim/tests/golden/combats.json` contient au moins 120 combats : escouades
Alpha et Bravo, deux theatres, deux formations, 20 graines chacune pour Alpha et 10 pour Bravo,
dont un tiers avec un journal de commandes (toutes les competences de Vell et de Tallow, ciblees
comprises) et un tiers avec un placement manuel (unites en seconde ligne, unites laissees hors du
plateau). Chaque entree donne les entrees, l'issue, le dernier pas et l'empreinte finale. Les
competences d'Odin Braak, Halven et Andar, qui ne commandent aucune escouade de demonstration,
sont couvertes par des tests de regles sur des escouades construites dans les tests (la sim
accepte une escouade complete en entree, pas seulement un identifiant). Le fichier est regenere par
`pnpm --filter @nova/sim golden:update`, jamais par le test : un changement de regle qui modifie
une empreinte fait echouer le test, et la mise a jour est un acte explicite visible dans le diff
(FR-023).

**Rationale** : SC-002 (au moins 100 combats varies, avec et sans competences) ; `plan.md` §6
("replays dores versionnes").

**Alternatives considered** : instantanes Vitest (`toMatchSnapshot`, mis a jour trop facilement
par `-u`) ; empreintes calculees a chaque execution sans reference (ne detecte pas un changement
de regle).

## R12. Moteur du combat cote client

**Decision** : un module TypeScript sans Svelte, `apps/web/src/state/combat-runtime.ts`, possede
la session de combat et son horloge ; un module `combat.svelte.ts` en expose une projection
reactive pour le HUD.

- **Horloge** : boucle `requestAnimationFrame` a accumulateur ; chaque tranche de 50 ms ecoulee
  fait un pas, 4 pas au plus par image (au-dela, le retard est abandonne : pas de rattrapage).
  Elle tourne independamment de Pixi : sans acceleration graphique, le combat continue (spec,
  cas limites).
- **Pause** : quand l'ecran Combat est demonte ou l'onglet masque ; au retour, l'horloge repart
  de l'instant present (FR-032).
- **Commandes** : une competence activee (ou une designation confirmee) devient une commande
  datee du pas suivant, ajoutee au journal (FR-013).
- **Replay** : la meme session recreee a partir des entrees et du journal complet ; les commandes
  du joueur sont ignorees (FR-021).
- **HUD** : la projection est mise a jour a chaque pas pour le bandeau, la relique et le minuteur,
  tous les 5 pas (4 fois par seconde) pour la force engagee (FR-028) ; le journal est construit a
  partir des evenements par une fonction pure (`combat-log.ts`), qui applique la limite de 11
  lignes et l'espacement du message d'avantage (30 pas).
- **Interpolation** : avant chaque pas, le moteur garde les positions precedentes ; la scene
  interpole avec `alpha = temps accumule / 50 ms` (FR-025).

**Rationale** : principe III (la scene lit, les actions passent par le journal) ; une horloge
hors de Pixi permet le combat sans rendu ; le decouplage permet de tester l'horloge avec des
cadences simulees (SC-004 : 60, 120 et 144 Hz donnent le meme combat).

**Alternatives considered** : faire avancer la sim par le ticker de Pixi (le combat s'arreterait
sans rendu ou avec les animations reduites) ; un Web Worker (inutile pour moins de 1 ms par pas,
et la communication compliquerait le replay).

## R13. Scene de combat

**Decision** : `src/scene/scenes/combat/` implemente `SceneModule` (contrat de la phase P0 de la
feuille de route) :

- formes provisoires en `Graphics` Pixi, une par entite, dessinees une fois puis deplacees ; barres
  de PV redessinees quand les PV changent ; tirs, destructions et effets de competence dans un pool
  de `Graphics` reutilises ;
- l'arene (1 600 x 816 unites) est mise a l'echelle uniformement pour tenir dans la zone, centree ;
  le fond couvre toute la zone (FR-026) ;
- multi-echantillonnage active pour cette scene seulement (`antialias: true`) : les fleches et les
  traits ont des bords, contrairement au fond provisoire de la phase P0 ;
- designation : evenements de pointeur de Pixi sur l'arene, convertis en coordonnees d'arene, puis
  arrondis en 16.16 dans la commande ; clic droit et Echap annulent ;
- animations reduites : la scene continue d'afficher le combat (deplacements et tirs), mais la
  pulsation de la relique et les anneaux d'explosion et d'effet sont figes.

`renderer.ts` change en deux points : le contenu d'une scene vient d'un module propre a chaque
`SceneId` (Combat : `scenes/combat`, Deploiement : `scenes/deploy`, R18 ; Carte :
`scenes/placeholder` jusqu'a la phase P2 de la feuille de route), et un module peut demander a rester
anime quand les animations sont reduites.

**Rationale** : FR-024 a FR-026 ; budget de `plan.md` §5 (60 entites ; pas de filtre, ni de
particules avant la phase P4 de la feuille de route).

**Alternatives considered** : un `Graphics` unique redessine a chaque image (plus simple, mais
couteux a 60 entites en rendu logiciel) ; sprites issus de textures pre-rendues (relevent des
visuels de la phase P3 de la feuille de route).

## R14. Outils de l'equipe

**Decision** : parametres lus dans `location.search`, comme ceux de la phase P0 de la feuille de
route :

- `?graine=<n>` : graine des combats lances et des resolutions automatiques (FR-022) ;
- `?diag=1` : le badge de diagnostic gagne, sur l'ecran Combat, les images par seconde, le nombre
  d'entites, le pas courant, l'empreinte et le mode de rendu ; un clic sur le badge le replie ou le
  deplie (FR-035) ;
- `?charge=1` : scenario de charge (FR-036) : escouade Alpha en combat terrestre et cinq vagues
  legeres a un pas d'intervalle, soit 60 ennemis, 5 unites et la relique ; meme regles, seul le
  delai entre vagues est une entree du scenario.

Les tests de bout en bout avancent l'horloge de la page par l'API `clock` de Playwright plutot
que par un parametre d'acceleration.

**Rationale** : FR-022, FR-035, FR-036 ; rien n'est visible des joueurs sans parametre.

**Alternatives considered** : panneau de debogage dans l'interface (visible des joueurs) ;
parametre `?vitesse=` (code de test dans l'application, que l'horloge de Playwright rend inutile).

## R15. Strategie de test et CI

**Decision** :

- **`packages/sim`, Vitest (Node)** : arithmetique fixe, table trigonometrique, generateur ;
  regles (une suite par FR du deroulement et par competence) ; valeurs de briefing contre
  `derived.generated.json` (R9) ; combats de reference (R11) ; proprietes sur 10 000 combats tires
  au hasard : bornes, entiers, fin avant la duree maximale (SC-007) ; replay a l'identique
  (SC-003) ; performance : un combat de 1 200 pas a 60 entites, mediane de 5 executions apres
  echauffement, sous 50 ms (SC-006) ; purete etendue (R2).
- **`packages/sim`, Vitest navigateurs** : combats de reference dans Chromium, Firefox et WebKit
  (R10).
- **`apps/web`, Vitest** : construction du journal, horloge a cadences simulees, conversion des
  coordonnees de designation.
- **`apps/web`, Playwright** (projets existants) : plateau de deploiement (placement a la souris,
  par glisser-deposer et au clavier, refus d'un emplacement de l'autre type, "Tout retirer",
  "Deploiement automatique", interrupteur du Briefing, memorisation, SC-011) ; combat complet avec
  l'horloge de la page,
  competences et designation, fenetre de fin, "Revoir le combat", resolution automatique, pause hors
  ecran, combats complets jusqu'a la fenetre de fin dans le projet `sans-gpu` (sans rendu, l'horloge
  de page avance un combat de deux minutes en quelques secondes ; c'est aussi la preuve que le
  combat avance sans acceleration graphique), tailles de fenetre, empreinte avec
  `?graine=` (R10), scenario de charge (au moins 60 entites atteintes ; la cadence se mesure a la
  main, la CI rendant en logiciel).
- **CI** (`tests.yml`) : installation de Chromium, Firefox et WebKit, puis `test:browsers` de la
  sim avant les tests Playwright.

**Rationale** : principe V ; chaque critere de succes a sa verification (table du plan).

**Alternatives considered** : `fast-check` pour les proprietes (dependance de plus pour une
boucle sur des graines) ; mesure de cadence dans la CI (rendu logiciel, sans rapport avec le
poste de reference).

## R16. Documents a mettre a jour dans la meme PR

**Decision** :

- **Des ce plan** :
  - `plan.md` §6 : comparaison des distances au 1/256 d'unite (R2), table trigonometrique commitee
    (R3), empreinte FNV-1a sur 64 bits (R7), verification entre moteurs par le mode navigateur de
    Vitest (R10), placement dans les entrees de la sim (R18) ;
  - `plan.md` §9 : le plateau de deploiement (glisser-deposer, Pointer Events) passe de la ligne
    P2 a la ligne P1, a la demande de l'equipe (Clarifications de la spec) ; la verification P2
    garde le tactile sur tablette pour le plateau.
- **A l'implementation** :
  - `plan.md` §10 : versions de `@vitest/browser-playwright` et `playwright` dans la sim ;
  - `CLAUDE.md` et `tests.yml` : script `pnpm --filter @nova/sim test:browsers` et installation de
    Firefox et WebKit ;
  - `WORKFLOW.md` §1 (etat du depot : la sim contient les regles) et §5 (prochaine etape : phase
    P2 de la feuille de route) ;
  - `specs/20260928-182033-socle-ecrans-navigables/contracts/` n'est pas modifie : les contrats de
    cette feature le prolongent et le remplacent la ou ils different (codes `data-later-phase`
    retires, contenu des scenes, paquet `@nova/sim`).

**Rationale** : principe I de la constitution ; `CLAUDE.md` demande de mettre la CI a jour quand
un script change.

**Alternatives considered** : aucune ; la constitution l'impose.

## R17. Fenetres de fin et de resolution automatique

**Decision** : un composant `ui/Modal.svelte` (prevu par `plan.md` §8) porte la fenetre de la
maquette (`showModal`) : panneau a coins coupes, fond assombri, focus pris a l'ouverture et rendu
a la fermeture, Echap ferme quand une commande "Fermer" existe. Deux contenus l'utilisent : fin
de combat (FR-030) et resolution automatique (FR-030a). La resolution automatique calcule le
combat sans affichage (`runCombat`), puis "Revoir le combat" ouvre l'ecran Combat en replay de ces
entrees.

**Rationale** : fidelite a la maquette ; un seul composant de fenetre pour les deux usages.

**Alternatives considered** : element `<dialog>` natif seul (le style de la maquette se reproduit
mal sur `::backdrop` dans Safari) ; fenetre dans la scene (principe III).

## R18. Plateau de deploiement

**Decision** :

- **Emplacements** : calcules par la sim (`formationSlots`), a partir des reglages de `@nova/data`
  (rayons, angles et nombre par ligne, R8) et de la table trigonometrique (R3) : 360 degres, 8 + 8 ;
  arc, 7 + 6. Le type alterne dans chaque ligne, vaisseau en premier ; en combat spatial, les
  emplacements de mecas ne sont pas proposes. Chaque emplacement a une position sur le plateau
  (988 x 752, comme la maquette) et dans l'arene (transposition de `startCombat` : decalage par
  rapport a l'objectif multiplie par 1,04 et 0,98).
- **Placement automatique** : `autoPlace` de la maquette applique type par type (R9, FR-040).
- **Validation** : `validatePlacement` refuse une unite hors escouade ou hors theatre, un
  emplacement d'un autre type, un emplacement occupe deux fois (FR-044). `createCombat` l'appelle :
  un placement invalide leve une erreur, que le serveur traduira en refus (principe IV).
- **Scene** (`src/scene/scenes/deploy/`) : fond du theatre, relique, lignes en pointilles, fleches
  d'arrivee ennemie et hexagones des emplacements, en `Graphics` comme le combat (R13). Les textes de
  la maquette dessines dans le canvas ("ARRIVEES ENNEMIES", "RELIQUE — OBJECTIF", nom et PV des
  unites) passent dans le DOM (principe III).
- **Commandes en DOM** : chaque emplacement propose est un `<button>` positionne au-dessus du canvas,
  a la position de l'emplacement convertie dans la zone (meme mise a l'echelle que la scene). Il
  porte le texte de l'unite placee, le type et la ligne en `aria-label`, et recoit le focus : le
  placement au clavier (FR-043) et les tests s'appuient dessus. La scene ne gere aucun clic.
- **Glisser-deposer** : Pointer Events sur les boutons des emplacements et les lignes de la liste
  (capture du pointeur, seuil de 4 px avant de commencer un glissement) ; un depot sur un emplacement
  occupe de meme type echange les deux unites ; ailleurs, l'unite revient d'ou elle venait.
- **Etat** : `src/state/deployment.svelte.ts`, placement par escouade, theatre et formation, plus
  l'unite choisie ; l'interrupteur "Deploiement automatique" du Briefing y est range. Rien n'est
  sauvegarde.

**Rationale** : Clarifications de la spec ; `plan.md` §2 (interface en DOM, scene en GPU) et §9
(drag & drop en Pointer Events) ; boutons DOM : accessibilite et texte sans `BitmapText`, qui n'est
prevu que pour les chiffres du HUD en scene.

**Alternatives considered** : clics geres par Pixi sur les hexagones (pas de clavier, texte a
dessiner en `BitmapText`) ; plateau entierement en SVG DOM (s'ecarte de `plan.md` §2, qui place le
deploiement dans les scenes Pixi) ; glisser-deposer HTML5 natif (pas de retour visuel maitrise, mal
supporte au toucher pour la phase P6 de la feuille de route).
