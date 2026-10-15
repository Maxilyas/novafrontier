# Feature Specification: Simulation du combat, plateau de deploiement et scene de combat

**Feature Branch**: `feature/p1-simulation-combat`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Phase P1 de la feuille de route (plan.md §9) : simulation de combat et scene de combat. Ce que la phase rend visible : un combat de defense de la relique qui se deroule a l'ecran Combat et se rejoue a l'identique. (1) packages/sim : les regles du combat portees de la maquette nova-frontier-v2.html (combatLoop, spawnWave, dmg, modOf/MATRIX, wavesFor, useAction, endCombat, startCombat) — boucle a pas fixe, vagues (intercepteurs, fregates, boss), degats PV/ATQ/DEF avec la trinite d'armement laser/artillerie/nucleaire, ciblage et deplacement des ennemis, attaque de l'objectif, competences du commandant consommant des points d'action, victoire si toutes les vagues sont repoussees et la relique > 0, defaite si la relique tombe ; en TypeScript pur, deterministe (graine, virgule fixe, sans flottant non maitrise), sans rendu, avec tests. Les valeurs derivees que P0 a figees (puissance, chances de victoire, vagues) sont produites par la sim et verifiees contre le test oracle. (2) Scene de combat Pixi avec des formes vectorielles provisoires (unites, ennemis, objectif, tirs, explosions) qui lit l'etat de la sim et interpole entre les ticks. (3) HUD DOM (vagues, minuteur, barre de la relique, force engagee, trinite, journal, points d'action, barre d'actions) branche sur le store du combat. Criteres de verification : meme graine = meme empreinte d'etat final sur Chrome, Firefox, Safari et Node ; 60 images/s avec 60 entites (overlay de stats) ; un replay (graine + journal de commandes) se rejoue a l'identique."

Cette feature sert la phase P1 de la feuille de route (`plan.md` §9). Elle succede a la phase P0
(`specs/20260928-182033-socle-ecrans-navigables/`), qui a livre les 9 ecrans, la scene provisoire et
le HUD de combat a son etat initial. Pendant la planification, l'equipe y a ajoute le plateau de
deploiement, que `plan.md` §9 placait en phase P2 de la feuille de route (voir Clarifications).
Termes employes :

- **Maquette** : `nova-frontier-v2.html`, a la racine du depot. Ses regles de combat (lignes
  1806-1820 et 2161-2375) sont la reference de cette feature.
- **Regles du combat** : le calcul du deroulement d'un combat (vagues, deplacements, tirs, degats,
  competences, fin), independant de tout affichage. Les memes regles servent au client et, en phase
  P5 de la feuille de route, au serveur.
- **Pas** : l'unite de temps des regles du combat, de duree fixe (`plan.md` §6). Le combat avance
  d'un nombre entier de pas, quel que soit le rythme d'affichage de l'ecran.
- **Graine** : le nombre dont decoulent tous les tirages aleatoires d'un combat.
- **Commande** : une action du joueur pendant le combat (utiliser une competence), datee du pas ou
  elle prend effet. Le **journal de commandes** est la liste ordonnee des commandes d'un combat.
- **Entrees d'un combat** : graine, escouade, theatre, formation, placement, planete visee et
  journal de commandes. Elles determinent entierement le combat.
- **Empreinte** : un code court calcule a partir de l'etat complet du combat a un pas donne (positions,
  PV, temps de recharge, effets en cours, vagues, relique, points d'action). Deux etats egaux ont la
  meme empreinte ; deux etats differents ont, en pratique, des empreintes differentes.
- **Replay** : un combat rejoue a partir de ses entrees, sans intervention du joueur.
- **Entite** : une unite du joueur, un ennemi ou la relique. Les tirs, explosions et effets visuels
  n'en sont pas.
- **Arene** : l'espace du combat, de la taille logique de celle de la maquette (1600 x 816), dans
  lequel s'expriment positions, portees et vitesses.
- **Plateau de deploiement** : la scene de l'ecran Deploiement, ou le joueur place ses unites
  avant le combat.
- **Emplacement** : une place du plateau, propre a la formation, qui a une ligne (premiere ou
  seconde) et un type (vaisseau ou meca) ; seule une unite de son type peut l'occuper.
- **Placement** : l'emplacement de chaque unite placee. Il fait partie des entrees d'un combat ; les
  unites non placees ne combattent pas.
- **Valeurs de la maquette a 60 images/s** : la maquette compte ses durees en images ; les durees de
  cette spec en sont la conversion en secondes, a raison de 60 images par seconde.
- **Competence ciblee** : competence qui demande au joueur de designer, dans la scene, un point de
  l'arene, une de ses unites, un ennemi ou un emplacement libre de la formation. La **designation**
  est ce geste ; la commande enregistre la cible.
- **Jusqu'a la vague suivante** : jusqu'a l'apparition de la vague suivante, ou jusqu'a la fin du
  combat si la derniere vague est deja apparue.

## Clarifications

### Session 2026-10-14

- Q: Quand le code de la maquette et ses textes affiches se contredisent (effets des competences,
  effectifs des vagues), lequel fait foi ? → A: Ni l'un ni l'autre par principe : l'equipe a revu un
  par un les effets, descriptions et comportements attendus. Competences : Frappe orbitale, point
  choisi ; Bouclier de flotte, effet du code (DEF x1,7 pendant 7 s) ; Reparation, unite choisie par le
  joueur ; Impulsion EM, ennemis de menace legere seuls, 4 s ; Surcharge, unite choisie, jusqu'a la
  vague suivante ; Abordage eclair, ennemi le plus proche de la relique ; Fumigene, 30 % de tirs ennemis
  manques pendant 6 s ; Pillage, +15 % de butin si la vague est nettoyee ; Mur d'acier, premiere ligne
  -50 % de degats pendant 7 s ; Charge lourde, frappe de zone sans deplacement ; Ralliement, +10 % a
  toutes les unites ; Tir de soutien, 200 degats a un ennemi choisi ; Garde serree, DEF +15 % pendant
  8 s ; Reparation de zone, +12 % autour d'un point choisi ; Repli tactique, unite et emplacement libre
  choisis. Vagues : effectifs du code, libelles corriges (FR-003, FR-004, FR-014).
- Q: Pendant que le joueur designe la cible d'une competence, le combat continue-t-il ? → A: Oui,
  en temps reel ; la competence s'applique au pas qui suit la confirmation (FR-013).
- Q: Quel delai entre deux vagues ? → A: 12 s fixes, qu'il reste des ennemis ou non (valeur du
  minuteur statique de la maquette), au lieu des 3,3 s de son code (FR-003).
- Q: Sous quelle forme peut-on revoir un combat termine ? → A: Bouton "Revoir le combat" dans la
  fenetre de fin, pour le joueur ; en plus, l'equipe peut relancer un combat precis en mettant sa
  graine dans l'adresse, outil invisible pour les joueurs ; pas de fichier de replay (FR-021,
  FR-022).
- Q: Que doit faire "Resoudre automatiquement" au Briefing ? → A: Calculer le combat aussitot par
  les memes regles, sans affichage ni competence, afficher le vrai resultat et proposer de le revoir
  a l'ecran ; rien n'est credite (FR-030a).
- Q: (ajout de l'equipe pendant la planification) Comment vaisseaux et mecas prennent-ils place ?
  → A: Une escouade est une flotte et une force meca : le plateau a des emplacements distincts pour
  les vaisseaux et pour les mecas, libres en bleu pour un vaisseau et en vert pour un meca (couleurs
  provisoires). Avant le combat, le placement est automatique si le joueur le decide, sinon manuel,
  pour jouer de la portee, de la defense et de l'attaque des unites face aux vagues (story 2,
  FR-037 a FR-044).
- Q: Ou et quand le joueur place-t-il ses unites ? → A: Sur le plateau de l'ecran Deploiement,
  avant "Lancer le combat", comme dans la maquette : placement manuel, "Deploiement automatique",
  "Tout retirer" ; l'interrupteur "Deploiement automatique" du Briefing pre-remplit le plateau. Le
  plateau passe ainsi de la phase P2 a la phase P1 de la feuille de route.
- Q: En combat spatial, la force meca est-elle engagee ? → A: Non, comme dans la maquette : en
  combat spatial, seuls les emplacements de vaisseaux existent ; en combat terrestre, vaisseaux et
  mecas sont deployes ensemble.
- Q: Comment disposer les emplacements de vaisseaux et de mecas ? → A: Les deux lignes de la
  maquette sont conservees, et chaque ligne alterne emplacements de vaisseaux et de mecas ; le
  placement automatique met chaque unite sur un emplacement de son type, les blindes en premiere
  ligne.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mener un combat de defense de la relique (Priority: P1)

Le joueur lance le combat depuis le Deploiement. Sur l'ecran Combat, ses unites sont aux
emplacements ou il les a placees, autour de la relique ; les vagues ennemies arrivent, avancent vers ses
unites et la relique, et les deux camps se tirent dessus automatiquement. Le HUD suit le combat en
direct (vague en cours, minuteur, integrite de la relique, force engagee, journal). Le joueur
depense ses points d'action pour declencher les competences de son commandant. Le combat se termine
par la victoire (toutes les vagues repoussees, relique debout) ou la defaite (relique detruite), et
une fenetre de fin en donne le bilan.

**Why this priority**: c'est ce que la phase P1 de la feuille de route rend visible et le coeur du
jeu ; sans elle, l'ecran Combat reste une image fixe.

**Independent Test**: depuis l'ecran Escouades, avec l'escouade Alpha, preparer l'assaut sur la
planete visee, garder le placement automatique, lancer le combat, utiliser au moins une competence, et suivre le combat jusqu'a la
fenetre de fin, en verifiant a chaque etape le HUD et la scene.

**Acceptance Scenarios**:

1. **Given** le Deploiement d'une escouade dont au moins une unite est placee, **When** le joueur
   choisit "Lancer le combat", **Then** l'ecran Combat s'affiche, les unites placees sont a leurs
   emplacements autour de la relique, la premiere vague apparait aussitot et le journal annonce le
   deploiement, la formation et la vague.
2. **Given** un combat en cours, **When** des ennemis s'approchent, **Then** ils avancent vers l'unite
   la plus proche, s'arretent a portee de tir et tirent ; les unites du joueur tirent sur l'ennemi le
   plus proche a leur portee ; chaque tir est visible et les PV des cibles baissent dans la scene et
   dans la force engagee.
3. **Given** un combat en cours, **When** le delai entre deux vagues s'ecoule, **Then** la vague
   suivante apparait, le compteur de vagues avance et le journal l'annonce ; le minuteur affiche le
   temps restant avant la prochaine vague.
4. **Given** un ennemi sans unite du joueur a sa portee et proche de la relique, **When** son arme
   est rechargee, **Then** il frappe la relique, dont la barre d'integrite baisse.
5. **Given** un combat en cours et des points d'action restants, **When** le joueur active une
   competence de son commandant (et, pour une competence ciblee, designe sa cible dans la scene),
   **Then** son effet s'applique (visible dans la scene), un point d'action est consomme, la
   competence devient inactive pour le reste du combat et le journal la mentionne.
6. **Given** une competence ciblee activee, **When** le joueur annule la designation, **Then** aucun
   point d'action n'est consomme et la competence reste disponible.
7. **Given** un combat en cours, **When** le joueur active l'ultime de palier, **Then** un message bref
   indique qu'il n'est pas encore debloque, comme dans la maquette, et rien ne change.
8. **Given** la derniere vague apparue, **When** le dernier ennemi est detruit alors que la relique a
   encore des PV, **Then** le combat s'arrete et la fenetre de fin annonce "Relique securisee", avec
   les vagues, les unites restantes et le butin estime.
9. **Given** un combat en cours, **When** l'integrite de la relique tombe a zero, **Then** le combat
   s'arrete et la fenetre de fin annonce "Relique perdue", sans butin.
10. **Given** la fenetre de fin, **When** le joueur choisit "Redeployer" ou "Retour a la carte",
    **Then** le Deploiement ou la Carte s'affiche, et aucune ressource du joueur n'a change.

---

### User Story 2 - Placer ses unites avant le combat (Priority: P2)

Une escouade est une flotte et une force meca. Sur le plateau de l'ecran Deploiement, chaque
formation offre des emplacements en premiere et en seconde ligne, reserves aux vaisseaux (libres en
bleu) ou aux mecas (libres en vert) ; en combat spatial, seuls ceux des vaisseaux existent. Le joueur
garde le placement automatique ou place lui-meme chaque unite, selon sa portee, sa defense et son
attaque face aux vagues annoncees. Le combat commence avec les unites la ou il les a mises.

**Why this priority**: c'est le premier choix tactique du joueur ; sans lui, une escouade combat
toujours de la meme facon. Il suppose le combat de la story 1 pour avoir un effet.

**Independent Test**: au Deploiement d'Alpha en combat terrestre, tout retirer, placer a la main deux
vaisseaux et deux mecas sur des emplacements choisis, laisser la cinquieme unite hors du plateau,
lancer le combat et verifier les positions et la force engagee.

**Acceptance Scenarios**:

1. **Given** le Briefing, interrupteur "Deploiement automatique" active, **When** le joueur passe au
   deploiement, **Then** chaque unite engagee occupe un emplacement de son type, blindages moyen et
   lourd en premiere ligne, blindage leger en seconde.
2. **Given** le Deploiement, **When** le joueur choisit une unite dans la liste puis un emplacement
   libre de son type, ou la fait glisser sur cet emplacement, **Then** l'unite l'occupe ; un
   emplacement de l'autre type la refuse.
3. **Given** une unite placee, **When** le joueur choisit son emplacement ou la ligne de l'unite dans
   la liste, **Then** elle quitte le plateau ; **When** il la pose sur un autre emplacement, **Then**
   elle quitte l'ancien.
4. **Given** le Deploiement, **When** le joueur choisit "Tout retirer", **Then** le plateau est vide
   et "Lancer le combat" devient inactif ; **When** il choisit "Deploiement automatique", **Then** le
   placement automatique est applique.
5. **Given** le combat spatial, **When** le Deploiement s'affiche, **Then** seuls des emplacements de
   vaisseaux sont proposes et la liste ne compte que les vaisseaux ; **Given** le combat terrestre,
   **Then** emplacements bleus et verts, vaisseaux et mecas.
6. **Given** un placement manuel, **When** le joueur lance le combat, **Then** chaque unite placee
   est a la position de son emplacement ; les unites non placees ne combattent pas et ne figurent pas
   dans la force engagee.
7. **Given** un placement manuel et un combat termine, **When** le joueur choisit "Redeployer",
   **Then** le plateau presente le placement de ce combat, pret a etre ajuste.

---

### User Story 3 - Rejouer un combat a l'identique, partout (Priority: P3)

Un combat est entierement determine par ses entrees. Rejoue a partir d'elles, il produit le meme
deroulement et la meme empreinte finale, que ce soit dans l'application (sur n'importe quel
navigateur cible, quel que soit l'ecran) ou hors navigateur, ou le serveur le rejouera pour le
valider en phase P5 de la feuille de route. Le joueur peut revoir le combat qu'il vient de livrer ;
l'equipe peut lancer un combat sur une graine donnee et lire son empreinte.

**Why this priority**: c'est la garantie sur laquelle repose la validation des combats par le serveur
(principe II de la constitution) ; une divergence decouverte plus tard obligerait a reprendre les
regles.

**Independent Test**: lancer un combat sur une graine donnee, utiliser deux competences, noter
l'empreinte finale ; le revoir, puis le rejouer sur les autres navigateurs cibles et hors navigateur
avec les memes entrees, et comparer deroulement et empreintes.

**Acceptance Scenarios**:

1. **Given** un combat termine, **When** le joueur choisit "Revoir le combat" dans la fenetre de fin,
   **Then** le combat se rejoue depuis le debut dans la scene, avec les memes vagues, tirs,
   destructions, competences aux memes moments, le meme resultat et la meme empreinte finale ; les
   competences ne sont pas activables pendant le replay.
2. **Given** les entrees d'un combat (graine, escouade, theatre, formation, planete, journal de
   commandes), **When** l'equipe le rejoue hors navigateur puis sur Chrome, Edge, Firefox et Safari,
   **Then** l'empreinte finale est la meme partout.
3. **Given** la meme graine et les memes choix, **When** le combat se deroule sur un ecran a 60 Hz
   puis a 120 Hz ou 144 Hz, en rendu accelere puis en rendu de repli, dans une petite puis une grande
   fenetre, **Then** son deroulement et son empreinte finale ne changent pas.
4. **Given** l'adresse de l'ecran Combat completee d'une graine, **When** l'equipe l'ouvre, **Then**
   le combat se deroule sur cette graine, et l'empreinte du combat est lisible par l'equipe pendant et
   a la fin du combat.
5. **Given** les combats de reference conserves avec leur empreinte attendue, **When** une regle du
   combat change, **Then** les verifications de l'equipe signalent chaque combat de reference dont
   l'empreinte a change.
6. **Given** le Briefing d'une escouade qui engage au moins une unite, **When** le joueur choisit
   "Resoudre automatiquement", **Then** une fenetre donne aussitot le resultat calcule par les regles
   du combat ; **When** il choisit ensuite "Revoir le combat", **Then** l'ecran Combat rejoue ce combat,
   qui aboutit au meme resultat.

---

### User Story 4 - Des valeurs de briefing issues des regles (Priority: P4)

Les valeurs que les ecrans Escouades, Carte et Briefing tirent des regles du jeu (puissance d'une
escouade, armement dominant, difficulte, vagues annoncees, puissance adverse, avantage d'armement,
chances de victoire, butin estime, carburant) sont calculees par les memes regles que le combat, et
non plus recopiees. Elles restent egales a celles de la maquette.

**Why this priority**: supprime la duplication entre les regles affichees au briefing et celles du
combat (`plan.md` §6) ; pour le joueur, rien ne change a l'ecran.

**Independent Test**: comparer, pour chaque escouade et chaque theatre, les valeurs affichees par
l'application a celles que calcule la maquette (verification de la phase P0 de la feuille de route),
puis verifier que les vagues annoncees au Briefing sont celles qui apparaissent en combat.

**Acceptance Scenarios**:

1. **Given** chaque escouade de l'etat de demonstration, **When** l'equipe compare les valeurs des
   ecrans Escouades, Carte et Briefing a celles que calcule la maquette, **Then** elles sont egales.
2. **Given** le Briefing d'une planete, **When** le joueur lance ensuite le combat, **Then** le nombre
   de vagues, leur composition annoncee et leur armement sont ceux de la liste du Briefing.

---

### User Story 5 - Tenir la fluidite avec 60 entites (Priority: P5)

L'equipe peut afficher par-dessus la scene un releve de mesures (images par seconde, nombre
d'entites, pas courant, empreinte, mode de rendu) et lancer un scenario de charge qui fait combattre
au moins 60 entites a la fois, pour verifier que la scene reste fluide dans le budget de `plan.md` §5.

**Why this priority**: c'est le critere de fluidite de la phase P1 de la feuille de route ; il
suppose un combat qui tourne (story 1) mais ne change rien pour le joueur.

**Independent Test**: sur le poste de reference, ouvrir le scenario de charge avec le releve de
mesures affiche et relever les images par seconde pendant une minute.

**Acceptance Scenarios**:

1. **Given** un combat affiche, **When** l'equipe active le releve de mesures, **Then** il affiche les
   images par seconde, le nombre d'entites, le pas courant, l'empreinte et le mode de rendu, sans
   masquer le HUD ; **When** elle le desactive, **Then** il disparait. Il n'est pas affiche par
   defaut.
2. **Given** le scenario de charge sur le poste de reference, **When** au moins 60 entites combattent
   en meme temps, **Then** la scene s'anime a au moins 60 images par seconde.

---

### Edge Cases

- Escouade qui n'engage aucune unite dans le theatre choisi (Charlie) : "Lancer le combat"
  reste inactif, comme en phase P0 ; ouvrir directement l'adresse du Combat avec cette escouade
  affiche le HUD a l'etat initial et un message indiquant qu'aucune unite n'est engagee, sans lancer
  de combat.
- Escouade sans commandant : aucun point d'action ni competence ; seul l'ultime (verrouille) figure
  dans la barre d'actions.
- Toutes les unites du joueur detruites : les ennemis se dirigent vers la relique et la frappent ; le
  combat continue jusqu'a la chute de la relique.
- La relique tombe au meme pas que le dernier ennemi : defaite (la chute de la relique est examinee
  en premier, comme dans la maquette).
- Competence sans cible valide au moment ou elle s'applique (aucun ennemi, cible detruite ou
  emplacement occupe entre la designation et le pas suivant) : elle ne s'applique pas, le point
  d'action n'est pas consomme et elle reste disponible (FR-014b).
- Designation en cours quand le combat se termine, quand le joueur quitte l'ecran ou qu'une autre
  competence est activee : la designation est annulee, rien n'est consomme.
- Repli tactique sans emplacement libre (toutes les places de la formation occupees par des unites
  vivantes) : la designation de l'emplacement est impossible ; le joueur ne peut qu'annuler.
- Deux activations de competences au meme pas, ou double clic sur la meme competence : chaque
  competence ne s'applique qu'une fois ; deux competences differentes s'appliquent dans l'ordre de
  leur activation.
- Competence activee pendant un replay ou apres la fin du combat : sans effet.
- Onglet masque, fenetre reduite ou passage a un autre ecran en cours de combat : le combat se met en
  pause et reprend la ou il en etait au retour, sans rattraper d'un coup le temps ecoule.
- Rechargement de la page en cours de combat : le combat est perdu (rien n'est sauvegarde) ; l'ecran
  Combat lance un nouveau combat avec les choix courants.
- "Lancer le combat" alors qu'un combat est deja en cours ou en pause : le nouveau combat remplace
  l'ancien.
- Aucune acceleration graphique, ou affichage interrompu pendant le combat : la zone de scene affiche
  le message explicatif de la phase P0, mais le combat continue de se derouler ; le HUD, le journal et
  la fenetre de fin restent a jour.
- Fenetre redimensionnee ou zoom du navigateur pendant le combat : l'arene reste entierement visible,
  sans deformation, et le combat n'en est pas affecte.
- Ecran a frequence elevee (120 Hz, 144 Hz) : le combat avance a la meme vitesse qu'a 60 Hz (la
  maquette, qui avancait d'une etape par image, allait deux fois plus vite a 120 Hz).
- Combat qui ne se termine pas de lui-meme : au-dela de la duree maximale d'un combat, il se termine
  par une defaite (voir Assumptions).
- Preference systeme "reduire les animations" : les animations decoratives (pulsation de la relique,
  anneaux d'explosion et d'effet de competence) sont supprimees ou figees ; les deplacements et les
  tirs, qui portent l'information du combat, restent affiches.
- Aucune unite placee (tout retire, ou interrupteur du Briefing desactive) : "Lancer le combat" reste
  inactif.
- Plus d'unites d'un type que d'emplacements de ce type dans une ligne : le placement automatique
  passe a l'autre ligne du meme type, puis laisse hors du plateau celles qui ne trouvent pas de place
  (cas impossible avec les escouades actuelles, 3 vaisseaux et 2 mecas au plus).
- Unite deposee hors d'un emplacement, sur un emplacement de l'autre type : elle revient d'ou elle
  venait (liste ou emplacement). Deposee sur un emplacement occupe de son type : les deux unites
  echangent leurs places.
- Changement de formation ou de theatre au Deploiement : le plateau presente les emplacements
  correspondants et le placement deja fait pour cette combinaison, sinon le placement automatique ou
  un plateau vide selon l'interrupteur du Briefing.
- Ouverture directe de l'adresse du Deploiement : plateau pre-rempli selon l'interrupteur du
  Briefing (active par defaut).

## Requirements *(mandatory)*

### Functional Requirements

**Deroulement du combat** (maquette, `startCombat`, `spawnWave`, `combatLoop`, `endCombat`)

- **FR-001**: Un combat DOIT etre une defense de la relique : la relique a 1 000 PV ; elle est au
  centre de l'arene en formation a 360 degres et adossee au bord droit en formation en arc, aux
  positions de la maquette.
- **FR-002**: Les unites engagees DOIVENT etre les unites placees sur le plateau de deploiement
  (FR-037 a FR-044), chacune a la position de son emplacement, transposee du plateau a l'arene comme
  dans la maquette. Chaque unite engagee a pour PV maximum ses PV multiplies par son effectif, et pour
  attaque, defense, portee et armement ceux de sa fiche. Les unites du joueur ne se deplacent pas,
  sauf par Repli tactique.
- **FR-003**: Le nombre de vagues DOIT etre le double de la difficulte de la planete visee, la
  derniere etant la vague du boss ; l'armement et la menace de chaque vague DOIVENT etre ceux de la
  maquette (`wavesFor`), et sa composition annoncee DOIT decrire les ennemis qui apparaissent
  reellement (FR-004). La premiere vague DOIT apparaitre des le debut du combat, chaque suivante 12 s
  apres la precedente, que les ennemis precedents aient ete detruits ou non. (Le code de la maquette
  espace les vagues de 3,3 s ; ses 12 s affiches au minuteur statique ont ete retenus, voir
  Clarifications.)
- **FR-004**: Les ennemis d'une vague DOIVENT avoir le nombre et les caracteristiques que leur donne
  le code de la maquette selon la menace de la vague, et l'armement de la vague. Les libelles de la
  maquette, qui annoncent d'autres effectifs, sont corriges en consequence (ecart admis avec la
  maquette, voir FR-033) :

  | Menace | Composition annoncee | Ennemis | PV | ATQ | DEF | Portee | Vitesse (arene/s) |
  |---|---|---|---|---|---|---|---|
  | legere | Intercepteurs x12 | 12 | 120 | 11 | 22 | 110 | 76,5 |
  | moyenne | Intercepteurs lourds x9 | 9 | 230 | 18 | 22 | 110 | 54 |
  | lourde | Fregates de raid x5 | 5 | 520 | 34 | 46 | 110 | 37,8 |
  | boss | Croiseur porte-nef | 1 | 2 600 | 90 | 70 | 150 | 21,6 |

- **FR-005**: Les ennemis DOIVENT apparaitre autour de la relique, dans toutes les directions en
  formation a 360 degres et d'un seul cote (la gauche, sur un secteur de 86 degres) en formation en
  arc, a une distance de 520 a 660 de la relique (620 pour le boss), aplatie verticalement comme dans
  la maquette. Direction et distance DOIVENT etre tirees de la graine.
- **FR-006**: A chaque pas, chaque ennemi DOIT viser l'unite vivante du joueur la plus proche ; si
  elle est hors de sa portee, il avance vers elle (vers la relique s'il ne reste aucune unite), sauf
  s'il est immobilise. Si l'unite visee est a sa portee, il s'arrete et lui tire dessus des que son
  arme est rechargee (toutes les 0,7 s). Sinon, s'il est a moins de 70 de la relique, il la frappe des
  que son arme est rechargee (toutes les 0,8 s), pour la moitie de son attaque, sans reduction par la
  defense.
- **FR-007**: A chaque pas, chaque unite vivante du joueur dont l'arme est rechargee DOIT tirer sur
  l'ennemi le plus proche a sa portee, s'il y en a un ; son arme se recharge alors en 0,57 s.
- **FR-008**: Les degats d'un tir DOIVENT etre : attaque x multiplicateur d'armement x (1 - DEF / (DEF
  + 130)), avec un minimum de 1, puis les modificateurs des competences actives (FR-014) ; le
  multiplicateur est celui de la matrice de la maquette, armement du tireur contre armement de la
  cible :

  | Tireur \ Cible | Laser | Artillerie | Nucleaire |
  |---|---|---|---|
  | Laser | 1 | 1,35 | 0,75 |
  | Artillerie | 0,75 | 1 | 1,35 |
  | Nucleaire | 1,35 | 0,75 | 1 |

- **FR-009**: Une unite ou un ennemi dont les PV tombent a zero ou moins DOIT etre detruit : il ne
  tire plus, n'est plus vise et disparait de la scene (les unites detruites restent listees, estompees,
  dans la force engagee).
- **FR-010**: Le combat DOIT s'arreter sur une defaite des que les PV de la relique tombent a zero, et
  sur une victoire quand toutes les vagues sont apparues et qu'il ne reste aucun ennemi, la defaite
  etant examinee en premier.
- **FR-011**: Les durees, cadences et vitesses DOIVENT etre celles de la maquette a 60 images/s,
  arrondies au pas pres, et NE DOIVENT PAS dependre du rythme d'affichage, de la taille de la fenetre
  ni du mode de rendu.

**Commandant, points d'action et competences** (maquette, `renderCombatPanels`, `useAction`)

- **FR-012**: Le commandant de l'escouade DOIT disposer d'autant de points d'action que l'indique sa
  rarete (2 pour commun, 3 pour rare, 4 pour epique, 5 pour legendaire et divin) ; la barre d'actions
  presente ses competences dans la limite de ce nombre, chacune au cout d'un point. Le variant
  "points d'action achetables", qui n'a pas de regle dans la maquette, reste un affichage sans effet
  sur le combat.
- **FR-013**: Activer une competence non ciblee DOIT l'appliquer au pas suivant. Activer une
  competence ciblee DOIT faire passer la scene en designation : les cibles valides sont mises en
  evidence, le joueur designe la sienne, ou annule (nouvelle activation de la competence, touche
  Echap ou clic droit) sans rien consommer ; le combat continue en temps reel pendant la
  designation, et la competence s'applique au pas qui suit la designation.
  Une competence appliquee DOIT consommer un point d'action, etre inscrite au journal de commandes
  (avec sa cible) et au journal du combat, et devenir inactive pour le reste du combat. Sans point
  d'action restant, une competence NE DOIT PAS s'appliquer.
- **FR-014**: Chaque competence DOIT avoir l'effet suivant, arrete par l'equipe (voir
  Clarifications) ; sauf mention contraire, les degats de competence ne sont reduits ni par la
  defense ni par la matrice d'armement, les soins ne depassent pas les PV maximum et seules les
  unites vivantes sont concernees :

  | Commandant | Competence | Cible | Effet |
  |---|---|---|---|
  | Korax Vell | Frappe orbitale | point de l'arene | 420 degats a chaque ennemi a moins de 150 du point |
  | Korax Vell | Bouclier de flotte | - | pendant 7 s, defense des unites du joueur x1,7 face aux tirs ennemis ; une nouvelle activation repart de 7 s |
  | Korax Vell | Reparation | une unite du joueur | l'unite recupere 25 % de ses PV maximum |
  | Korax Vell | Impulsion EM | - | les ennemis de menace legere presents sont immobilises 4 s (ils tirent encore sur ce qui est a leur portee) |
  | Korax Vell | Surcharge | une unite du joueur | attaque de l'unite x1,5 jusqu'a la vague suivante |
  | Rhea Tallow | Abordage eclair | - | 420 degats a l'ennemi le plus proche de la relique |
  | Rhea Tallow | Fumigene | - | pendant 6 s, chaque tir ennemi a 30 % de chances de manquer (tirage issu de la graine) ; un tir manque n'inflige aucun degat et se voit dans la scene |
  | Rhea Tallow | Pillage | - | si tous les ennemis de la vague en cours sont detruits avant la vague suivante, le butin estime de la victoire augmente de 15 % |
  | Odin Braak | Mur d'acier | - | pendant 7 s, les unites de premiere ligne subissent des degats x0,5 |
  | Odin Braak | Charge lourde | - | l'unite de premiere ligne de plus forte defense (a defaut, de seconde ligne) frappe sans se deplacer : 420 degats a chaque ennemi a moins de 150 de l'ennemi le plus proche d'elle |
  | Odin Braak | Ralliement | - | chaque unite recupere 10 % de ses PV maximum |
  | T. Halven | Tir de soutien | un ennemi | 200 degats a cet ennemi |
  | T. Halven | Garde serree | - | pendant 8 s, defense des unites du joueur x1,15 ; une nouvelle activation repart de 8 s |
  | P. Andar | Reparation de zone | point de l'arene | chaque unite a moins de 150 du point recupere 12 % de ses PV maximum |
  | P. Andar | Repli tactique | une unite du joueur, puis un emplacement libre de son type | l'unite est replacee aussitot sur l'emplacement designe, non occupe par une unite vivante, et prend la ligne de cet emplacement |

- **FR-014a**: Les descriptions de competences affichees (barre d'actions, journal, fiches) DOIVENT
  decrire l'effet de FR-014 ; celle de Bouclier de flotte, seule a garder l'effet du code de la
  maquette, devient "+70 % DEF pendant 7 s".
- **FR-014b**: Une competence qui n'a pas de cible valide au pas ou elle s'applique (aucun ennemi pour
  Abordage eclair ou Charge lourde, unite ou ennemi designe detruit entre-temps, emplacement occupe
  entre-temps) NE DOIT PAS s'appliquer : le point d'action n'est pas consomme, la competence reste
  disponible et le journal du combat le signale.

- **FR-015**: L'ultime de palier DOIT rester verrouille tant que le niveau du joueur n'est pas un
  multiple de 10 (niveau 47 dans l'etat de demonstration) ; l'activer DOIT afficher le message bref de
  la maquette, sans effet sur le combat.

**Determinisme, empreinte et replay** (`plan.md` §6, principe II de la constitution)

- **FR-016**: Les regles du combat DOIVENT produire, pour les memes entrees, exactement le meme
  deroulement (etat a chaque pas, evenements) et la meme empreinte, dans l'application sur Chrome,
  Edge, Firefox et Safari, et hors navigateur.
- **FR-017**: Tout tirage aleatoire d'un combat DOIT decouler de sa graine. Sans graine imposee, le
  client en tire une au lancement du combat.
- **FR-018**: Les regles du combat DOIVENT pouvoir derouler un combat complet sans aucun affichage, a
  partir de ses entrees, et en donner le resultat, l'etat final et l'empreinte.
- **FR-019**: Les regles du combat DOIVENT signaler, pas par pas, les evenements du combat :
  apparition d'une vague, apparition d'un ennemi, tir, impact, destruction, competence, atteinte a la
  relique, fin du combat. La scene et le HUD s'en servent pour les effets et le journal ; ils NE
  DOIVENT jamais modifier l'etat du combat.
- **FR-020**: L'empreinte de l'etat DOIT pouvoir etre calculee a tout pas ; l'empreinte finale d'un
  combat est celle de son dernier pas.
- **FR-021**: La fenetre de fin DOIT proposer "Revoir le combat", qui rejoue le combat a partir de ses
  entrees, a la vitesse normale, avec le meme deroulement et la meme empreinte finale ; pendant le
  replay, les competences sont inactives et le HUD indique qu'il s'agit d'un replay.
- **FR-022**: L'equipe DOIT pouvoir lancer un combat sur une graine donnee, en la mettant dans
  l'adresse de l'ecran Combat, et lire l'empreinte courante et finale du combat. Cet outil n'est
  signale nulle part aux joueurs. Il n'y a pas d'export ni d'import de replay sous forme de fichier.
- **FR-023**: Un jeu de combats de reference (entrees et empreinte finale attendue, dont certains
  avec des competences) DOIT etre conserve avec les regles ; tout changement de regle qui modifie
  l'une de ces empreintes DOIT etre signale par les verifications et assume explicitement par la mise
  a jour de la reference.

**Scene de combat** (maquette, `combatLoop`, partie dessin)

- **FR-024**: La scene de combat DOIT remplacer le fond provisoire de la phase P0 sur l'ecran Combat
  et montrer, avec des formes provisoires reprises de la maquette :
  - le fond (degrade sombre et champ d'etoiles en combat spatial ; degrade vert-brun en combat
    terrestre) ;
  - la relique (hexagone dore et anneau pulse) ;
  - les unites du joueur (fleches de la couleur de leur ligne, rouge en premiere ligne, turquoise en
    seconde ; barre de PV, trait de la couleur de l'armement, cercle de portee discret, anneau de
    bouclier quand il est actif) ;
  - les ennemis (pointes orientees vers la relique, de taille et de couleur selon leur menace, boss
    en rose ; barre de PV pour les menaces moyenne, lourde et le boss ; anneau violet quand ils sont
    immobilises) ;
  - les tirs (traits de la couleur de l'armement, rouges contre la relique, qui s'estompent en
    0,15 s), les tirs manques sous l'effet de Fumigene (distincts des tirs au but), les destructions
    (anneau qui s'elargit, plus grand pour le boss) et les effets de competence (anneau colore selon
    l'effet : degats, protection, soin, immobilisation, renforcement) ;
  - pendant une designation, les cibles valides mises en evidence (zone d'effet sous le pointeur pour
    un point de l'arene, unites ou ennemis designables, emplacements libres de la formation pour
    Repli tactique).
- **FR-025**: La scene DOIT lire l'etat du combat et ses evenements sans les modifier, et lisser les
  mouvements entre deux pas, pour un deplacement fluide quel que soit le rythme d'affichage.
- **FR-026**: L'arene DOIT etre entierement visible dans la zone de scene, sans deformation, quelle
  que soit la taille de la fenetre, et garder les exigences de la phase P0 sur la nettete, le
  redimensionnement et le rendu de repli.

**HUD de combat** (maquette, lignes 813-828, `renderForce`, `renderCombatPanels`)

- **FR-027**: Le HUD DOIT suivre l'etat du combat en direct, avec la mise en forme de la maquette :
  - le bandeau de vagues ("VAGUE nn / nn"), la barre d'integrite de la relique ("RELIQUE nn %") et le
    minuteur de la prochaine vague ("PROCHAINE 0:ss", a 0:00 une fois la derniere vague apparue) ;
  - la force engagee : nombre d'unites vivantes sur engagees et, par unite, armement, nom, barre et
    valeur de PV, estompee une fois detruite ;
  - la trinite d'armement, inchangee depuis la phase P0 ;
  - les points d'action restants et la barre d'actions, competences depensees estompees et inactives.
- **FR-028**: Le bandeau de vagues, la barre de la relique et le minuteur DOIVENT etre a jour a chaque
  pas ; la force engagee au moins deux fois par seconde.
- **FR-029**: Le journal du combat DOIT afficher, du plus recent au plus ancien et dans la limite de
  11 lignes, les messages de la maquette : deploiement de l'escouade et formation, annonce de chaque
  vague (marquee "BOSS" pour la derniere), destruction d'une unite du joueur, avantage d'armement
  (au plus une fois toutes les 1,5 s), destruction du boss, competence utilisee avec sa description,
  competence sans cible valide (FR-014b), bonus de Pillage obtenu.
- **FR-030**: La fenetre de fin DOIT reprendre celle de la maquette : titre ("Relique securisee" ou
  "Relique perdue"), texte, vagues apparues sur le total, unites restantes sur engagees, butin estime
  de la planete en cas de victoire, majore par Pillage le cas echeant (0 sinon), et les commandes "Redeployer", "Retour a la carte" et
  "Revoir le combat". Le butin n'est pas credite et aucune ressource ne change (phase P5 de la feuille
  de route).

- **FR-030a**: "Resoudre automatiquement", au Briefing, DOIT calculer aussitot un combat complet par
  les memes regles, sans affichage et sans competence du commandant, avec une graine tiree au clic,
  l'escouade, le theatre et la formation choisis et le placement en cours de l'escouade (le
  placement automatique s'il n'y en a pas). Une fenetre reprenant
  celle de la maquette ("Resolution automatique") DOIT en donner le vrai resultat ("Operation
  reussie" ou "Operation echouee", unites perdues, butin estime, planete gagnee ou territoire
  inchange), avec les commandes "Fermer", "Rejouer en manuel" (vers le Deploiement) et "Revoir le
  combat", qui rejoue ce combat a l'ecran Combat a l'identique (FR-021). Rien n'est credite.

**Cycle de vie du combat**

- **FR-031**: "Lancer le combat" DOIT demarrer un nouveau combat avec l'escouade, le theatre, la
  formation, le placement et la planete choisis, et remplacer tout combat en cours. Ouvrir directement
  l'adresse du Combat sans combat en cours DOIT demarrer un combat avec les choix courants (le
  placement automatique si aucun placement n'existe).
- **FR-032**: Le combat DOIT se mettre en pause quand son ecran n'est plus affiche ou que l'onglet est
  masque, et reprendre au meme pas au retour, sans rattrapage du temps ecoule.

**Valeurs de briefing** (`plan.md` §8 : `power`, `winChance`, `wavesFor`, `diffOf`, `lootOf`,
`fuelOf`)

- **FR-033**: Les valeurs que la phase P0 a figees a partir de la maquette (puissance et synthese
  d'escouade, armement dominant, distance, carburant, difficulte, butin estime, vagues, puissance
  adverse, avantage d'armement, chances de victoire) DOIVENT etre calculees par les regles du jeu, et
  rester egales a celles de la maquette pour le meme etat de demonstration, a une exception pres : les
  compositions annoncees des vagues sont les libelles corriges de FR-004 (ecart admis avec la
  maquette, a refleter dans la verification de la phase P0).
- **FR-034**: Les vagues annoncees au Briefing DOIVENT etre celles que le combat fait apparaitre.

**Outils de l'equipe**

- **FR-035**: L'equipe DOIT pouvoir afficher et masquer, sur l'ecran Combat, un releve de mesures
  (images par seconde, nombre d'entites, pas courant, empreinte, mode de rendu), masque par defaut et
  sans gener le HUD.
- **FR-036**: L'equipe DOIT pouvoir lancer un scenario de charge qui fait combattre au moins 60
  entites a la fois, avec les memes regles.

**Plateau de deploiement** (maquette, `buildSlots`, `autoPlace`, `drawDeploy`, lignes 1959-2156)

- **FR-037**: L'ecran Deploiement DOIT afficher dans sa zone de scene le plateau de la formation
  choisie : fond du theatre, relique, lignes et fleches d'arrivee ennemie de la maquette, et les
  emplacements aux positions de la maquette (360 degres : 8 en premiere ligne et 8 en seconde ; arc :
  7 et 6). Dans chaque ligne, les emplacements alternent vaisseau et meca, en commencant par un
  vaisseau. En combat spatial, seuls les emplacements de vaisseaux sont proposes.
- **FR-038**: Un emplacement libre DOIT montrer son type, en bleu pour un vaisseau et en vert pour un
  meca (couleurs provisoires), et sa ligne par sa position ; la legende du panneau de l'ecran les
  explique. Un emplacement occupe DOIT montrer l'unite comme la maquette : nom, armement, effectif et
  PV, marque de ligne.
- **FR-039**: Le joueur DOIT pouvoir placer une unite en la choisissant dans la liste "Unites a
  placer" puis en choisissant un emplacement libre de son type, ou en la faisant glisser de la liste
  ou d'un emplacement vers un emplacement de son type ; pendant le choix, les emplacements valides
  sont mis en evidence. Une unite n'occupe qu'un emplacement. Choisir un emplacement occupe, ou une
  unite placee dans la liste, la retire du plateau.
- **FR-040**: "Deploiement automatique" DOIT appliquer le placement automatique : pour chaque type,
  les unites par defense decroissante, blindage moyen ou lourd en premiere ligne et leger en
  seconde, chaque ligne remplie dans l'ordre de ses emplacements, a defaut l'autre ligne du meme type
  (regle `autoPlace` de la maquette, appliquee par type). "Tout retirer" DOIT vider le plateau.
- **FR-041**: Le placement DOIT etre memorise pour la session, par escouade, theatre et formation.
  A l'arrivee au Deploiement, s'il n'en existe pas, le plateau DOIT etre pre-rempli par le placement
  automatique quand l'interrupteur "Deploiement automatique" du Briefing est active (par defaut,
  comme dans la maquette), et vide sinon.
- **FR-042**: "Lancer le combat" DOIT rester inactif tant qu'aucune unite n'est placee ; la liste
  "Unites a placer" indique le nombre d'unites placees sur le total, et la place de chacune.
- **FR-043**: Le placement DOIT etre possible au clavier : apres le choix d'une unite, les
  emplacements valides se parcourent et se choisissent au clavier, avec le focus visible de la
  maquette.
- **FR-044**: Le placement d'un combat DOIT etre verifiable par les regles du combat : chaque unite
  placee appartient a l'escouade et au theatre, occupe un emplacement de son type, et aucun
  emplacement n'a deux unites ; un placement invalide est refuse (principe IV de la constitution).

### Key Entities *(include if feature involves data)*

- **Entrees d'un combat** : graine, escouade, theatre, formation, placement, planete visee (d'ou la
  difficulte et les vagues), journal de commandes.
- **Emplacement** : formation, rang, ligne (premiere ou seconde), type (vaisseau ou meca), position
  sur le plateau et dans l'arene.
- **Placement** : pour une escouade, un theatre et une formation, l'emplacement de chaque unite
  placee.
- **Commande** : competence activee (par sa place dans la barre d'actions), pas ou elle prend effet et,
  pour une competence ciblee, sa cible (point de l'arene, unite du joueur, ennemi, ou unite et
  emplacement).
- **Etat du combat** : pas courant ; relique (PV, maximum, position) ; unites engagees (unite d'origine,
  ligne, emplacement, position, PV, maximum, attaque, defense, portee, armement, recharge, surcharge
  jusqu'a la vague suivante) ; ennemis (vague d'origine, menace, armement, position, PV, maximum,
  attaque, defense, portee, vitesse, recharge, immobilisation) ; vagues (liste, nombre apparu, delai
  avant la suivante) ; effets de competence en cours et leur duree restante (bouclier, mur d'acier,
  garde serree, fumigene) ; bonus de Pillage (vague visee, obtenu ou non) ; points d'action restants
  et competences depensees ; issue (en cours, victoire, defaite).
- **Evenement** : type (vague, apparition, tir, impact, destruction, competence, relique, fin), pas, et
  les entites concernees.
- **Empreinte** : code calcule a partir de l'etat du combat a un pas donne.
- **Combat de reference** : entrees d'un combat et empreinte finale attendue, conserves avec les
  regles.
- **Vague** : rang, boss ou non, composition annoncee, armement, menace (legere, moyenne, lourde,
  boss).
- **Competence** : nom, description, commandant, genre de cible (aucune, point de l'arene, unite du
  joueur, ennemi, unite et emplacement), effet (FR-014).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depuis l'ecran Escouades, le joueur mene un combat complet, du lancement a la fenetre
  de fin, sans autre action que le parcours de mission et, s'il le souhaite, ses competences ; 100 %
  des combats lances avec une escouade qui engage au moins une unite se terminent par la fenetre de
  fin.
- **SC-002**: Pour au moins 100 combats de reference (escouades, theatres, formations et graines
  differents, avec et sans competences), l'empreinte finale est identique hors navigateur et sur
  Chrome, Edge, Firefox et Safari : 0 divergence.
- **SC-003**: Un combat revu ("Revoir le combat") ou rejoue a partir de ses entrees donne 10 fois sur
  10 le meme resultat et la meme empreinte finale que le combat d'origine.
- **SC-004**: Le meme combat (meme graine, memes commandes) donne la meme empreinte finale a 60, 120
  et 144 images par seconde, en rendu accelere et en rendu de repli, en fenetre de 1280x720 et de
  2560x1440, et avec un passage par l'onglet masque en cours de combat.
- **SC-005**: Sur le poste de reference de la phase P0, le scenario de charge (au moins 60 entites
  en meme temps) s'anime a au moins 60 images par seconde en moyenne sur une minute, mesure par le
  releve de mesures.
- **SC-006**: Hors navigateur, un combat de 1 200 pas avec 60 entites se calcule en moins de 50 ms sur
  le poste de reference, soit assez vite pour qu'un serveur le rejoue a la reception.
- **SC-007**: Sur 10 000 combats tires au hasard, aucun ne produit de valeur invalide (PV hors de
  0..maximum, relique hors de 0..1 000, position ou valeur non numerique) et tous se terminent avant la
  duree maximale d'un combat.
- **SC-008**: 100 % des valeurs de briefing (FR-033), pour chaque escouade et chaque theatre, sont
  egales a celles que calcule la maquette.
- **SC-009**: A la fin d'un combat, les vagues, les unites restantes et l'integrite de la relique
  affichees par le HUD et la fenetre de fin sont egales a celles de l'etat final du combat.
- **SC-010**: L'equipe valide en comparaison cote a cote avec la maquette que le combat de
  demonstration lui ressemble : memes formes, couleurs, comportements des ennemis et messages du
  journal ; et que chaque competence a l'effet arrete en FR-014.
- **SC-011**: Au Deploiement d'Alpha en combat terrestre, le joueur place a la main ses 5 unites en
  10 actions au plus (choisir, puis poser), a la souris comme au clavier ; 100 % des combats lances
  demarrent avec chaque unite placee a la position de son emplacement, et sans les unites non
  placees.
- **SC-012**: Pour chaque escouade et chaque theatre, le placement automatique met 100 % des unites
  sur un emplacement de leur type, dans la ligne que leur donne le Deploiement de la maquette.

## Assumptions

- **Perimetre** : la phase P1 de la feuille de route (`plan.md` §9). La pile, l'organisation du code
  (regles dans le paquet de simulation, scene dans l'application web), les formats numeriques et le
  pas (`plan.md` §6) relevent du plan de la feature, qui reprend les criteres de verification de cette
  phase (principe I de la constitution).
- **Fidelite a la maquette** : les regles de la maquette font foi (deplacements, tirs, degats,
  vagues, fin du combat), sauf la ou l'equipe a tranche autrement : effets des competences (FR-014,
  revus un par un) et libelles des vagues (FR-004). Les libelles proposes pour les vagues moyenne
  ("Intercepteurs lourds x9") et boss ("Croiseur porte-nef") sont une proposition de cette spec,
  modifiable sans changer les regles.
- **Defauts de la maquette corriges** : le combat avance a pas fixe et non d'une etape par image ; les
  tirages aleatoires viennent de la graine ; le message d'avantage d'armement n'est plus rythme par
  l'horloge d'affichage mais par le pas.
- **Rythme des vagues** : une vague toutes les 12 s (voir Clarifications) ; les 6 vagues de Gemenon
  apparaissent donc en une minute, et un combat de demonstration dure de l'ordre d'une a deux
  minutes.
- **Ce que la maquette n'applique pas en combat n'est pas applique** : bonus des commandants (PV
  d'escadre, degats laser...), niveaux, etoiles et paliers des unites, recherches, blindage (hors
  placement), contrainte de composition du Briefing ("au moins 2 unites de blindage moyen ou lourd"),
  relief du combat terrestre. Ces regles relevent de phases ulterieures ou de decisions de conception.
- **Duree maximale d'un combat** : 10 minutes de combat ; au-dela, le combat se termine par une
  defaite. La maquette n'en a pas, mais un combat valide par le serveur doit etre borne ; la valeur
  peut etre revue au plan.
- **Plateau de deploiement** : avance de la phase P2 a la phase P1 de la feuille de route a la
  demande de l'equipe (voir Clarifications) ; `plan.md` §9 est mis a jour en consequence. Le placement
  est memorise pour la session seulement, rien n'est sauvegarde. Les couleurs des emplacements libres
  (bleu, vert) sont provisoires, jusqu'aux visuels de la phase P3 de la feuille de route.
- **Graine** : tiree par le client au lancement, faute de serveur ; en phase P5 de la feuille de
  route, c'est le serveur qui la fournira (principe IV de la constitution).
- **Resolution automatique** : calculee par le client en phase P1 de la feuille de route (voir
  Clarifications), pour remplacer le tirage au hasard de la maquette ; en phase P5, le serveur la
  calculera et la validera (principe IV de la constitution). Sans competence : le joueur n'est pas la
  pour les declencher.
- **Pas de sauvegarde** : ni le combat en cours ni son resultat ne sont conserves ; recharger la page
  le perd. Aucune ressource, unite ni territoire ne change a l'issue d'un combat.
- **Pas de commande de vitesse** : ni pause manuelle ni acceleration, la maquette n'en ayant pas.
- **Navigateurs cibles et poste de reference** : ceux de la phase P0 (dernieres versions de Chrome,
  Edge, Firefox et Safari sur ordinateur ; ordinateur de moins de 5 ans a processeur graphique
  integre, ecran 1920x1080). Safari se verifie sur un Mac ou par un service de test en ligne.
- **Formes provisoires** : les visuels definitifs (sprites, effets de lumiere, particules) arrivent en
  phases P3 et P4 de la feuille de route ; les formes de cette feature sont celles que dessine la
  maquette.
- **Hors perimetre**, avec la phase de la feuille de route qui le prend en charge :
  - scene de la carte et de la base : phase P2 ;
  - visuels definitifs : phase P3 ;
  - post-traitement, particules, tremblements et effets : phase P4 ;
  - validation des combats par le serveur, graine fournie par le serveur, butin credite, resolution
    hors ligne par le serveur : phase P5 ;
  - mobile et tactile : phase P6.
