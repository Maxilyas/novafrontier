# Feature Specification: Socle de l'application : les 9 ecrans navigables et la scene

**Feature Branch**: `ccr-ab1d36f1-5j9ozs`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "" (commande lancee sans description). Description retenue : celle que `WORKFLOW.md` §5 prevoit pour l'etape suivante, a savoir ce que la phase P0 de la feuille de route (`plan.md` §9) rend visible : "les 9 ecrans navigables, fideles a la maquette, et la scene qui s'affiche avec ou sans WebGPU". La pile et l'outillage de cette phase relevent de `/speckit-plan`.

Cette feature sert la phase P0 de la feuille de route. Termes employes :

- **Maquette** : `nova-frontier-v2.html`, a la racine du depot. Reference visuelle et fonctionnelle des 9 ecrans.
- **Etat de demonstration** : les donnees de la maquette (profil, ressources, escouades, unites, batiments, recherches, planetes, coffres). Rien n'est sauvegarde.
- **Ecran a scene** : Carte, Deploiement et Combat, dont une zone est une scene animee dessinee par l'acceleration graphique du navigateur. Les 6 autres ecrans sont des ecrans d'interface.
- **Rendu accelere / rendu de repli** : la scene utilise WebGPU quand le navigateur le propose (rendu accelere), sinon la generation precedente d'acceleration graphique des navigateurs (rendu de repli).
- **Commande d'une phase ulterieure** : bouton ou geste de la maquette dont l'effet depend de regles du jeu, d'une economie, d'une sauvegarde ou d'une scene qu'une phase suivante de la feuille de route introduit.
- **Message bref** : la notification temporaire de la maquette, affichee en haut de l'ecran puis effacee.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Parcourir les 9 ecrans (Priority: P1)

Un membre de l'equipe ouvre l'application et parcourt les 9 ecrans de la maquette par les chemins du jeu : le bandeau superieur mene aux cinq ecrans principaux (Escouades, Base, Recherche, Carte, Butin), la fiche d'une unite (Atlas) s'ouvre depuis Escouades, et une mission se prepare de la Carte au Combat en passant par le Briefing et le Deploiement.

**Why this priority**: c'est le squelette sur lequel s'appuient toutes les phases suivantes de la feuille de route ; sans lui, aucun ecran n'est atteignable ni ne peut etre montre.

**Independent Test**: depuis l'ouverture de l'application, atteindre chacun des 9 ecrans sans barre d'adresse ni outil de developpement, en verifiant pour chacun le titre de l'ecran et l'entree de navigation mise en evidence ; puis rouvrir chaque ecran par son adresse.

**Acceptance Scenarios**:

1. **Given** l'application qui vient d'etre ouverte, **When** son chargement se termine, **Then** l'ecran Escouades s'affiche sous le bandeau superieur et l'entree "Escouades" est mise en evidence.
2. **Given** n'importe quel ecran, **When** le joueur choisit Escouades, Base, Recherche, Carte ou Butin dans le bandeau superieur, **Then** l'ecran choisi remplace l'ecran courant et le bandeau reste en place.
3. **Given** l'ecran Escouades, **When** le joueur ouvre la fiche d'une unite, **Then** l'ecran Atlas s'affiche sur cette unite et l'entree "Escouades" reste mise en evidence.
4. **Given** l'ecran Carte, **When** le joueur choisit "Preparer l'assaut", **Then** le Briefing de la planete visee s'affiche ; **When** il choisit ensuite "Passer au deploiement" puis "Lancer le combat", **Then** le Deploiement puis le Combat s'affichent, l'entree "Carte" restant mise en evidence.
5. **Given** un ecran atteint en naviguant, **When** le joueur utilise la commande Precedent du navigateur, **Then** l'ecran precedent s'affiche.
6. **Given** n'importe lequel des 9 ecrans, **When** le joueur recharge la page ou ouvre directement l'adresse de cet ecran, **Then** ce meme ecran s'affiche.

---

### User Story 2 - Retrouver la maquette dans chaque ecran (Priority: P2)

Chaque ecran reproduit celui de la maquette : memes zones et panneaux, memes textes et valeurs, meme charte graphique (coins coupes, phosphore, grain, cadres de rarete), memes illustrations generees. Les commandes qui servent a consulter (onglets, filtres, selection d'un element pour voir son detail) fonctionnent comme dans la maquette ; celles qui dependent d'une phase ulterieure restent visibles et le disent quand on les active.

**Why this priority**: c'est la valeur visible de la phase : l'equipe juge le rendu et l'ergonomie dans l'application elle-meme, et non plus dans la maquette. Elle suppose la navigation de la story 1 pour servir au quotidien.

**Independent Test**: pour chaque ecran, ouvert par son adresse, comparer cote a cote avec la maquette a 1600x900, puis derouler les consultations de l'ecran et activer une de ses commandes d'une phase ulterieure.

**Acceptance Scenarios**:

1. **Given** un ecran de l'application et le meme ecran de la maquette affiches a 1600x900, **When** l'equipe les compare, **Then** zones, textes, valeurs, couleurs, polices et illustrations correspondent, aux ecarts admis pres (FR-011).
2. **Given** l'ecran Escouades, **When** le joueur choisit une autre escouade deverrouillee, **Then** le plateau, les effectifs et la synthese presentent cette escouade ; **When** il choisit une escouade verrouillee, **Then** rien ne change et le grade requis reste affiche.
3. **Given** l'ecran Atlas, **When** le joueur choisit une autre unite, un autre palier ou un autre armement, **Then** la carte et les caracteristiques se mettent a jour comme dans la maquette.
4. **Given** l'ecran Base ou Recherche, **When** le joueur selectionne un batiment, change d'arbre ou selectionne un noeud, **Then** le panneau de detail correspondant s'affiche.
5. **Given** une commande d'une phase ulterieure ("Collecter", "Ameliorer", "Lancer la recherche", l'ouverture d'un coffre...), **When** le joueur l'active, **Then** un message bref indique que la fonction n'est pas encore disponible et aucune valeur affichee ne change.
6. **Given** plusieurs cartes d'unites de raretes differentes affichees ensemble, **When** l'ecran s'affiche, **Then** chaque illustration garde ses propres couleurs.
7. **Given** une escouade choisie sur l'ecran Escouades, **When** le joueur prepare une mission depuis la Carte, **Then** le Briefing, le Deploiement et le Combat presentent cette escouade.
8. **Given** l'ecran Escouades, **When** le joueur passe la formation de 360 degres a l'arc, **Then** l'apercu de formation change, et le Briefing et le Deploiement affichent la formation en arc.
9. **Given** le Briefing, **When** le joueur choisit le combat terrestre, **Then** le Deploiement liste aussi les mecas de l'escouade et l'intitule du Combat devient terrestre.

---

### User Story 3 - Voir la scene s'afficher avec ou sans WebGPU (Priority: P3)

Sur les ecrans a scene (Carte, Deploiement, Combat), la zone de scene s'affiche en rendu accelere quand le navigateur le permet et passe d'elle-meme au rendu de repli sinon, sans action ni difference visible pour le joueur. Elle est nette sur les ecrans haute densite et suit la taille de sa zone. A ce stade elle montre un contenu provisoire : la carte, le plateau de deploiement et le combat arrivent avec les phases P1 et P2 de la feuille de route.

**Why this priority**: prepare les scenes des phases suivantes de la feuille de route et leve tot le risque de compatibilite entre navigateurs ; pour le joueur, la scene n'est encore qu'un fond provisoire.

**Independent Test**: ouvrir un ecran a scene dans un navigateur qui propose WebGPU, puis dans un navigateur (ou une configuration) qui ne le propose pas, puis sans aucune acceleration graphique : la scene s'affiche dans les deux premiers cas, avec le mode de rendu identifiable, et un message explicatif la remplace dans le troisieme.

**Acceptance Scenarios**:

1. **Given** un navigateur qui propose WebGPU, **When** le joueur ouvre un ecran a scene, **Then** la scene s'affiche en rendu accelere.
2. **Given** un navigateur qui ne propose pas WebGPU, ou qui l'a desactive, **When** le joueur ouvre un ecran a scene, **Then** la scene s'affiche en rendu de repli, sans message d'erreur et sans difference visible avec le rendu accelere.
3. **Given** un navigateur sans aucune acceleration graphique, **When** le joueur ouvre un ecran a scene, **Then** la zone de scene affiche un message explicatif, et les panneaux et la navigation de l'ecran restent utilisables.
4. **Given** un ecran haute densite, **When** une scene s'affiche, **Then** elle est aussi nette que l'interface qui l'entoure.
5. **Given** un ecran a scene affiche, **When** le joueur redimensionne la fenetre, zoome dans le navigateur ou deplace la fenetre vers un ecran de densite differente, **Then** la scene occupe toute sa zone, sans deformation, sans flou et sans rechargement.
6. **Given** un ecran a scene, **When** le joueur passe a un autre ecran, **Then** la scene cesse de s'animer ; **When** il revient, **Then** elle s'affiche de nouveau aussitot.

---

### User Story 4 - Utiliser l'application a la taille de sa fenetre (Priority: P4)

L'interface occupe toute la fenetre et repartit ses zones selon la place disponible, au lieu d'etre une page de taille fixe agrandie ou reduite comme une image. Des la largeur minimale sur ordinateur, rien n'est tronque ni superpose.

**Why this priority**: conditionne le confort sur les ecrans d'ordinateur courants et prepare l'arrivee du mobile (phase P6 de la feuille de route) ; a 1600x900, la story 2 couvre deja la fidelite a la maquette.

**Independent Test**: sur chaque ecran, passer la fenetre par 1280x720, 1600x900, 1920x1080 et 2560x1440, et verifier que l'interface occupe la fenetre, sans chevauchement, sans contenu inaccessible et sans defilement horizontal.

**Acceptance Scenarios**:

1. **Given** une fenetre de 1920x1080 ou 2560x1440, **When** un ecran s'affiche, **Then** il occupe toute la fenetre, sans bandes vides, et ses panneaux se repartissent la place au lieu d'etre agrandis uniformement.
2. **Given** une fenetre de 1280x720, **When** un ecran s'affiche, **Then** tous ses contenus restent accessibles (defilement a l'interieur des panneaux si besoin), sans chevauchement ni defilement horizontal.
3. **Given** une fenetre plus petite que 1280x720, **When** un ecran s'affiche, **Then** l'interface garde ses dimensions minimales et la page devient defilable, sans mise en page cassee.

---

### Edge Cases

- Navigateur sans WebGPU, ou qui l'a desactive, ou qui refuse le materiel graphique : rendu de repli, meme contenu, aucun message d'erreur.
- Aucune acceleration graphique disponible (desactivee dans le navigateur, navigateur ancien) : message explicatif dans la zone de scene ; la navigation et les panneaux restent utilisables.
- Affichage graphique interrompu en cours d'utilisation (reinitialisation du pilote, sortie de veille) : la scene se retablit sans recharger la page, sinon le message explicatif s'affiche.
- Fenetre deplacee vers un ecran de densite differente : la scene retrouve sa nettete sans rechargement.
- Redimensionnement continu (bord de la fenetre tire a la souris) ou zoom du navigateur : ni scintillement, ni deformation, ni zone vide qui persiste.
- Fenetre plus petite que 1280x720 : dimensions minimales conservees, page defilable, aucun chevauchement.
- Changements d'ecran rapides (plusieurs clics de suite) : seul le dernier ecran demande s'affiche, sans superposition ni erreur, et aucune scene ne reste animee en arriere-plan.
- Onglet masque ou fenetre reduite : la scene cesse de s'animer et reprend au retour.
- Adresse qui ne correspond a aucun ecran : l'ecran Escouades s'affiche.
- Ouverture directe d'un ecran du parcours de mission (Briefing, Deploiement, Combat) par son adresse : l'ecran s'affiche pour la planete visee et l'escouade de l'etat de demonstration.
- Escouade verrouillee (Delta, Echo) : onglet non selectionnable, grade requis affiche.
- Escouade sans vaisseau ni meca (Charlie) : le Briefing signale la contrainte de composition non respectee, le Deploiement ne liste aucune unite et "Lancer le combat" reste inactif, comme dans la maquette.
- Polices indisponibles : texte lisible dans une police de repli, jamais invisible.
- Preference systeme "reduire les animations" : transitions et animations supprimees, scene provisoire immobile.
- Activation d'une commande d'une phase ulterieure : message bref, aucune valeur modifiee, l'ecran reste en place.

## Requirements *(mandatory)*

### Functional Requirements

**Ecrans et navigation**

- **FR-001**: L'application DOIT proposer les 9 ecrans de la maquette (Escouades, Atlas, Base, Recherche, Carte, Briefing, Deploiement, Combat, Butin) et s'ouvrir sur Escouades.
- **FR-002**: Le bandeau superieur de la maquette (profil du joueur, navigation principale, ressources, bouton de collecte) DOIT rester affiche au-dessus de chacun des 9 ecrans.
- **FR-003**: La navigation principale DOIT mener en une action a Escouades, Base, Recherche, Carte et Butin, avec les libelles, icones et l'ordre de la maquette. Elle DOIT mettre en evidence l'entree de la section courante : Escouades pour Escouades et Atlas ; Carte pour Carte, Briefing, Deploiement et Combat ; l'entree elle-meme pour Base, Recherche et Butin.
- **FR-004**: Le joueur DOIT pouvoir ouvrir la fiche d'une unite (Atlas) depuis l'ecran Escouades, par une commande distincte de celles qui composent l'escouade ; l'Atlas s'ouvre alors sur cette unite.
- **FR-005**: Le parcours de mission DOIT etre celui de la maquette : Carte, puis Briefing ("Preparer l'assaut", "Espionner" ou l'operation proposee pour la planete visee), puis Deploiement ("Passer au deploiement"), puis Combat ("Lancer le combat").
- **FR-006**: Chaque ecran DOIT avoir une adresse propre : l'ouvrir directement ou recharger la page affiche cet ecran, la commande Precedent du navigateur ramene a l'ecran precedent, et une adresse inconnue mene a Escouades.

**Fidelite a la maquette**

- **FR-007**: Chaque ecran DOIT reproduire l'ecran correspondant de la maquette : zones et panneaux, titres et bandeaux de pied, textes, valeurs, couleurs (y compris celles des raretes et l'usage de l'or), polices, illustrations et etats de selection, aux ecarts de FR-011 pres.
- **FR-008**: Les elements communs de la charte (panneaux et boutons a coins coupes, en-tetes de panneau, barres de valeur, pastilles, selecteurs segmentes, interrupteurs, badges "a trancher", etoiles de rarete, cartes d'unite a cadre colore par rarete, message bref) DOIVENT avoir le meme rendu sur tous les ecrans ou ils apparaissent.
- **FR-009**: Le voile de grain de la maquette DOIT couvrir uniformement l'interface et les zones de scene, sans jamais intercepter un clic.
- **FR-010**: Les illustrations d'unites, de batiments et d'armes DOIVENT etre les illustrations generees de la maquette, aucun visuel definitif n'etant attendu a ce stade. Chacune DOIT garder ses propres couleurs quand plusieurs sont affichees ensemble, et une illustration deja affichee NE DOIT PAS se recharger visiblement quand le joueur revient sur un ecran.
- **FR-011**: Les seuls ecarts admis avec la maquette sont :
  - la mise en page fluide (FR-029 a FR-031) au lieu d'une page fixe de 1600x900 mise a l'echelle ;
  - le retrait des outils de demonstration de la maquette (barre de pagination des ecrans, panneau "Notes v2") ;
  - le contenu provisoire des zones de scene (FR-022) ;
  - le comportement des commandes d'une phase ulterieure (FR-018) et le placement automatique des unites au Deploiement (FR-017) ;
  - l'acces a l'Atlas depuis Escouades (FR-004) et la mise en evidence de la section courante sur Atlas, Briefing, Deploiement et Combat (FR-003), que la maquette n'offre pas ;
  - la correction du melange de couleurs entre illustrations de la maquette (FR-010).

**Donnees**

- **FR-012**: Les donnees affichees DOIVENT etre celles de la maquette (etat de demonstration) et provenir d'une source unique : une donnee de jeu (unite, armement, batiment, noeud de recherche, planete, coffre) modifiee a un seul endroit DOIT apparaitre modifiee sur tous les ecrans qui l'affichent.
- **FR-013**: Les valeurs que la maquette tire des regles du jeu (puissance et synthese d'escouade, armement dominant, distance, carburant et temps de trajet, difficulte, butin estime, vagues, puissance adverse, avantage d'armement, chances de victoire) DOIVENT etre egales a celles de la maquette pour le meme etat de demonstration.
- **FR-014**: Aucune donnee n'est sauvegardee : recharger l'application DOIT ramener l'etat de demonstration, sur le meme ecran.

**Commandes**

- **FR-015**: Les commandes de consultation DOIVENT fonctionner comme dans la maquette :
  - Escouades : choisir une escouade deverrouillee (les escouades verrouillees restent inaccessibles et affichent le grade requis) ; filtrer les effectifs par famille, directement ou en choisissant un emplacement vide ;
  - Atlas : choisir une unite, un palier visuel (sauf pour les commandants) et un armement actif ;
  - Base : selectionner un batiment sur le plan ou dans la liste ;
  - Recherche : changer d'arbre et selectionner un noeud.
- **FR-016**: Les selecteurs qui presentent une decision encore ouverte dans la maquette (badge "a trancher" : points d'action fixes ou achetables, formation a 360 degres ou en arc, combat spatial ou terrestre) DOIVENT basculer l'affichage entre les variantes comme dans la maquette, tant que la decision reste ouverte. La formation et le theatre choisis DOIVENT etre les memes sur tous les ecrans qui les montrent.
- **FR-017**: L'escouade choisie sur Escouades DOIT etre celle du Briefing, du Deploiement et du Combat. Le theatre choisi au Briefing DOIT determiner les unites engagees (vaisseaux seuls en combat spatial, vaisseaux et mecas en combat terrestre) et l'intitule du Combat. Tant que le plateau de deploiement n'existe pas, les unites engagees DOIVENT etre considerees comme placees automatiquement selon la formation choisie, et un changement de formation NE DOIT PAS les retirer.
- **FR-018**: Les commandes d'une phase ulterieure DOIVENT rester visibles, a leur place et avec l'apparence de la maquette ; les activer DOIT afficher un message bref indiquant que la fonction n'est pas encore disponible, sans modifier aucune valeur affichee. Sont concernees : composer une escouade (assigner ou retirer une unite) ; collecter les revenus ; ameliorer un batiment ou le mettre en file ; lancer une recherche ; deplacer ou zoomer la vue de la carte ; espionner une planete depuis le Briefing ; resoudre automatiquement ; activer ou couper le deploiement automatique ; selectionner, placer ou retirer une unite au Deploiement ; utiliser une action du commandant ou l'ultime en Combat ; ouvrir ou acheter un coffre.
- **FR-019**: Les commandes que la maquette rend inactives selon l'etat DOIVENT l'etre dans les memes conditions (par exemple "Lancer le combat" quand l'escouade n'engage aucune unite).

**Scene**

- **FR-020**: Les ecrans Carte, Deploiement et Combat DOIVENT comporter une zone de scene a la place de la zone graphique correspondante de la maquette, sous les panneaux et commandes de l'ecran. L'ecran Base garde le rendu de la maquette ; son eventuel passage en scene se decide en phase P2 de la feuille de route.
- **FR-021**: Les panneaux, textes et commandes superposes a une scene DOIVENT rester aussi nets et utilisables que le reste de l'interface, quel que soit le mode de rendu.
- **FR-022**: La zone de scene DOIT afficher un contenu provisoire : un fond spatial anime en continu, dans la palette de la maquette. La carte (champ d'etoiles, planetes, routes, trajet, choix de la planete visee) et le plateau de deploiement arrivent en phase P2 de la feuille de route, le deroulement du combat en phase P1 de la feuille de route. D'ici la, les panneaux de ces ecrans presentent l'etat de demonstration : planete visee de la maquette (Gemenon), unites placees automatiquement, combat a son etat initial (premiere vague annoncee, relique intacte, unites a pleine sante, points d'action pleins).
- **FR-023**: La scene DOIT utiliser le rendu accelere quand le navigateur propose WebGPU et passer d'elle-meme au rendu de repli sinon, sans action du joueur ni difference visible de contenu.
- **FR-024**: Si aucun mode de rendu n'est disponible, ou si la scene ne parvient pas a demarrer, la zone de scene DOIT afficher un message explicatif dans la charte de l'application, et le reste de l'ecran DOIT rester utilisable. Si l'affichage graphique est interrompu en cours d'utilisation (reinitialisation du pilote, sortie de veille), la scene DOIT se retablir sans rechargement de la page, ou a defaut afficher ce message.
- **FR-025**: La scene DOIT etre nette sur les ecrans haute densite, dans la limite du budget de rendu de `plan.md` §5.
- **FR-026**: La scene DOIT occuper en permanence toute sa zone : lors d'un redimensionnement, d'un zoom du navigateur ou d'un passage sur un ecran de densite differente, elle s'adapte sans deformation, sans zone vide et sans rechargement.
- **FR-027**: Une scene NE DOIT s'animer que lorsque son ecran est affiche et que l'onglet est visible. Quand le joueur revient sur l'ecran, elle DOIT s'afficher de nouveau en moins de 300 ms, et les allers-retours NE DOIVENT PAS accumuler de ressources.
- **FR-028**: L'equipe DOIT pouvoir identifier le mode de rendu actif sur un poste (accelere, repli ou indisponible), sans que cette information encombre l'interface du joueur.

**Mise en page, confort et accessibilite**

- **FR-029**: L'interface DOIT occuper toute la fenetre et repartir ses zones selon la place disponible, au lieu d'agrandir ou de reduire uniformement une page de taille fixe.
- **FR-030**: A partir de la largeur minimale sur ordinateur de `plan.md` §2 (1280 px) et d'une hauteur de 720 px, aucun contenu NE DOIT etre tronque sans moyen d'y acceder ni se chevaucher, et la page NE DOIT PAS defiler horizontalement ; les listes longues defilent a l'interieur de leur panneau, comme dans la maquette.
- **FR-031**: En deca de ces dimensions, l'interface DOIT garder ses dimensions minimales et la page devenir defilable, sans mise en page cassee. L'adaptation aux mobiles et aux tablettes releve de la phase P6 de la feuille de route.
- **FR-032**: Les polices de la maquette (Oswald et Share Tech Mono) DOIVENT s'afficher des le premier rendu sans recours a un service tiers ; si elles ne se chargent pas, le texte DOIT rester lisible dans une police de repli.
- **FR-033**: L'application NE DOIT contacter aucun service tiers pour s'afficher et se parcourir.
- **FR-034**: Les commandes de navigation et de consultation DOIVENT etre utilisables au clavier seul, avec l'indicateur de focus de la maquette.
- **FR-035**: Quand le systeme du joueur demande de reduire les animations, les transitions d'ecran et les animations decoratives, y compris celle de la scene provisoire, DOIVENT etre supprimees, comme dans la maquette.

**Perimetre par ecran** (detail de FR-003 a FR-022)

| Ecran | Acces | Consultations actives | Commandes d'une phase ulterieure | Contenu provisoire ou reporte |
|---|---|---|---|---|
| Bandeau superieur | toujours affiche | navigation principale | "Collecter" | - |
| 01 Escouades | ouverture de l'application ; navigation principale | onglets d'escouade ; filtre des effectifs ; emplacement vide ; variantes "a trancher" (points d'action, formation) ; ouverture de la fiche Atlas | assigner ou retirer une unite | - |
| 02 Atlas | fiche d'une unite, depuis Escouades | unite ; palier ; armement actif | - | - |
| 03 Base | navigation principale | batiment, sur le plan ou dans la liste | "Ameliorer", "File", "Tout collecter" | - |
| 04 Recherche | navigation principale | arbre ; noeud | "Lancer la recherche" | - |
| 05 Carte | navigation principale | - | fleches de deplacement ; niveaux de zoom | scene provisoire ; carte et choix de la planete visee en phase P2 de la feuille de route |
| 06 Briefing | Carte : "Preparer l'assaut", "Espionner", operation proposee | theatre ; formation | "Espionner la planete" ; "Resoudre automatiquement" ; interrupteur de deploiement automatique | rapport d'espionnage detaille, avec l'espionnage (phase ulterieure) |
| 07 Deploiement | Briefing : "Passer au deploiement" | formation | selection d'une unite a placer ; "Deploiement automatique" ; "Tout retirer" | scene provisoire ; plateau de deploiement en phase P2 de la feuille de route |
| 08 Combat | Deploiement : "Lancer le combat" | - | actions du commandant ; ultime | scene provisoire et HUD a l'etat initial ; deroulement du combat en phase P1 de la feuille de route |
| 09 Butin | navigation principale | - | ouverture ou achat d'un coffre | - |

### Key Entities *(include if feature involves data)*

- **Profil du joueur** : nom, grade, portrait, niveau et progression, niveau du prochain ultime ; ressources (credits, alliage, carburant, artefacts) ; revenus en attente de collecte et leur plafond.
- **Rarete** : commun, rare, epique, legendaire, divin ; couleur, nombre maximal d'etoiles, points d'action accordes au commandant, acces au slot legendaire.
- **Armement** : laser, artillerie, nucleaire (actifs), ionique et cinetique (prevus) ; couleur, symbole, cible de predilection, description. La **matrice de degats** donne le multiplicateur de chaque armement actif contre chacun des autres.
- **Unite** : commandant, vaisseau ou meca ; nom, code, rarete, niveau, etoiles, role, illustration. Vaisseaux et mecas : caracteristiques (PV, attaque, defense, portee, vitesse), armement, blindage, moteur, unite seule ou escadrille (effectif et maximum), palier visuel (1 a 4), capacite de transport. Commandants : competences, bonus d'escadre, competence legendaire.
- **Escouade** : nom, un commandant, trois emplacements de vaisseaux et deux de mecas, formation par defaut (360 degres ou arc), grade requis si elle est verrouillee.
- **Batiment** : nom, type, niveau, place sur le plan de la base, statut, description, cout, duree et effet de la prochaine amelioration.
- **Recherche** : trois arbres (Armement, Flotte, Commandement) de noeuds ; chaque noeud a un nom, une icone, un etat (acquis, en cours, verrouille), un niveau, des prerequis, une description, un cout et une duree, et peut etre legendaire ou "a trancher". Une file de recherche a trois emplacements.
- **Planete** : nom, position, taille, couleurs, statut (base, controle, hostile, neutre, marchand, inexplore), ressources, operations disponibles, description ; revenu quotidien pour les planetes possedees.
- **Mission** : planete visee, theatre (spatial ou terrestre), vagues, objectifs, contrainte de composition, escouade engagee et placement de ses unites.
- **Coffre** : nom, condition d'obtention, taux par rarete, disponibilite ou prix. Le **pool de lancement** regroupe les cartes obtenables, par rarete.
- **Mode de rendu de la scene** : accelere, repli ou indisponible.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depuis l'ouverture de l'application, chacun des 9 ecrans est atteint en 4 actions au plus, sans barre d'adresse ni outil de developpement (Escouades : 0 ; Atlas, Base, Recherche, Carte, Butin : 1 ; Briefing : 2 ; Deploiement : 3 ; Combat : 4).
- **SC-002**: 9 ecrans sur 9 sont valides par l'equipe en comparaison cote a cote avec la maquette, a 1600x900 et dans l'etat de demonstration : memes zones, textes, valeurs, couleurs, polices et illustrations, les seules differences etant les ecarts de FR-011.
- **SC-003**: Au premier chargement, l'ecran Escouades obtient un score de performance superieur a 90/100 a un audit de performance web standard, en profil ordinateur.
- **SC-004**: Sur le poste de reference, un changement d'ecran est termine en moins de 300 ms, transition comprise ; a la premiere ouverture d'un ecran a scene, la scene apparait en moins d'une seconde.
- **SC-005**: Sur chaque navigateur cible, la scene s'affiche dans au moins une configuration qui propose le rendu accelere et au moins une qui ne le propose pas ; dans les deux cas, le contenu est identique a l'oeil et s'anime a au moins 60 images par seconde sur le poste de reference.
- **SC-006**: Sans aucune acceleration graphique, les 9 ecrans restent navigables et chaque zone de scene affiche le message explicatif : aucune zone vide, aucune erreur bloquante.
- **SC-007**: Sur chacun des 9 ecrans, a 1280x720, 1600x900, 1920x1080 et 2560x1440, l'interface occupe toute la fenetre, sans chevauchement, sans contenu inaccessible et sans defilement horizontal.
- **SC-008**: Apres un redimensionnement de la fenetre ou un passage sur un ecran de densite double, la scene occupe toute sa zone, sans deformation ni flou visible sur une capture.
- **SC-009**: Apres 50 allers-retours entre un ecran a scene et un ecran d'interface, la scene s'anime toujours a au moins 60 images par seconde et la memoire occupee par l'application ne croit plus d'un aller-retour a l'autre.
- **SC-010**: Au chargement puis pendant le parcours des 9 ecrans, aucune requete n'est adressee a un domaine tiers.
- **SC-011**: Une donnee de jeu modifiee a un seul endroit (par exemple le nom d'une unite) apparait modifiee sur 100 % des ecrans qui l'affichent, sans autre intervention.
- **SC-012**: 100 % des commandes d'une phase ulterieure affichent le message bref d'indisponibilite quand on les active, et aucune ne modifie une valeur affichee.
- **SC-013**: Les 9 ecrans sont atteignables, et toutes les commandes de navigation et de consultation utilisables, au clavier seul, avec un focus visible a chaque etape.

## Assumptions

- **Origine de la description** : `/speckit-specify` a ete lance sans description ; celle retenue est la prochaine etape decrite par `WORKFLOW.md` §5.
- **Perimetre** : la phase P0 de la feuille de route (`plan.md` §9), vue du joueur. La pile, l'organisation du depot, l'outillage et les verifications automatiques (dont "build et CI verts") relevent du plan de la feature, qui reprend les criteres de verification de cette phase (principe I de la constitution).
- **Utilisateurs** : l'equipe et des joueurs de test, sur ordinateur. Pas de compte, pas de serveur, pas de sauvegarde : ils arrivent en phase P5 de la feuille de route.
- **Maquette de reference** : `nova-frontier-v2.html` a la racine du depot ; le chemin Windows cite dans le contexte de `plan.md` designe le meme fichier.
- **Langue** : interface en francais uniquement, comme la maquette.
- **Navigateurs cibles** : dernieres versions stables de Chrome, Edge, Firefox et Safari sur ordinateur. WebGPU n'y est pas disponible partout (`plan.md` §3) ; les configurations qui ne le proposent pas (par exemple Firefox sous Linux, ou WebGPU desactive) servent a verifier le rendu de repli.
- **Poste de reference** pour les mesures de performance et de fluidite : ordinateur courant de moins de 5 ans, a processeur graphique integre, ecran 1920x1080. Le plan peut en retenir un autre et le dire.
- **Dimensions minimales** : 1280 px de large, fixes par `plan.md` §2 ; la hauteur minimale de 720 px est une hypothese de cette spec, `plan.md` n'en fixant pas.
- **Commandes d'une phase ulterieure** : un message bref plutot qu'une commande grisee, pour rester fidele a la maquette sans rien laisser croire. Aucune ne simule une regle du jeu, une economie ou un tirage (principes II et IV de la constitution).
- **Composition des escouades** : non modifiable a ce stade ; elle depend de regles du jeu et d'une sauvegarde que des phases ulterieures de la feuille de route introduisent.
- **Valeurs calculees** : FR-013 fixe les valeurs affichees, pas la maniere de les obtenir, qui releve du plan.
- **Decisions ouvertes** : les points 2 et 3 du compte-rendu repris dans la maquette (objectif et disposition du combat, bascule spatial ou terrestre ; points d'action fixes ou achetables) ne sont pas tranches a la date de cette spec. Leurs selecteurs sont repris tant qu'ils ne le sont pas.
- **Acces a l'Atlas** : la maquette n'y mene que par son outil de pagination ; l'acces depuis Escouades est une hypothese de cette spec, sa forme exacte relevant de la conception.
- **Hors perimetre**, avec la phase de la feuille de route qui le prend en charge :
  - regles du jeu et deroulement du combat : phase P1 de la feuille de route ;
  - scenes de la carte, du deploiement et de la base : phase P2 de la feuille de route ;
  - visuels definitifs : phase P3 de la feuille de route ;
  - post-traitement et effets : phase P4 de la feuille de route ;
  - serveur, comptes, economie, timers, tirages et sauvegarde : phase P5 de la feuille de route ;
  - mobile et tactile : phase P6 de la feuille de route ;
  - traduction de l'interface : aucune phase prevue.
