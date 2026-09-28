# Constitution de Nova Frontier

Principes non negociables du projet, sous une forme verifiable. Spec-kit les
applique a chaque feature : porte "Constitution Check" de `/speckit-plan`,
puis `/speckit-analyze` et `/speckit-converge`.

Ce texte ne cree pas de regle : il condense ce qui est deja acte dans
`CLAUDE.md`, `plan.md` et `WORKFLOW.md`, avec un renvoi vers la source. Les
details (versions, tableaux, justifications) restent dans ces fichiers.

## Principes fondamentaux

### I. `plan.md` fait autorite

L'architecture, la pile, la structure du depot et la feuille de route sont
celles de `plan.md` a la racine (`CLAUDE.md`).

- Un plan de feature (`specs/<feature>/plan.md`) DOIT utiliser la pile de
  `plan.md` §7 et l'arborescence de `plan.md` §8 (`apps/web`, `apps/server`,
  `packages/sim`, `packages/data`, `packages/assets-src`), pas une structure
  generique (`src/`, `backend/`, `frontend/`).
- Une feature qui s'ecarte de `plan.md` (dependance structurante, autre
  moteur, autre decoupage en paquets) DOIT mettre `plan.md` a jour dans la
  meme PR et justifier l'ecart dans la section "Complexity Tracking" de son
  plan.
- Une feature DOIT indiquer la phase de la feuille de route qu'elle sert
  (`plan.md` §9, phases P0 a P6), ou l'y ajouter si elle n'y figure pas, et
  reprendre les criteres de verification de cette phase qui la concernent.

Raison : deux documents d'architecture qui divergent ne servent plus de
reference ni a l'un ni a l'autre.

### II. Simulation deterministe et partagee (NON NEGOCIABLE)

Les regles du jeu vivent dans `packages/sim`, en TypeScript pur, et le meme
code tourne cote client et cote serveur (`plan.md` §6).

- `packages/sim` NE DOIT dependre ni du DOM, ni de Pixi, ni de Svelte, ni du
  reseau.
- Pas fixe de 50 ms (20 ticks/s). Le rendu interpole entre deux ticks, il ne
  pilote jamais la sim.
- Aucune source de non-determinisme : RNG seede uniquement (pas de
  `Math.random`), positions et distances en virgule fixe 16.16, angles en
  1/1024 de tour avec tables sinus/cosinus, aucun appel a `Math.sin`,
  `Math.cos`, `Math.atan2` ni `Math.hypot`, aucune lecture d'horloge.
- Entrees : seed, escouade, formation, theatre, vagues (issues de
  `packages/data`) et journal de commandes `{tick, action}`. Sorties : etat
  par tick et evenements types (`wave`, `spawn`, `shot`, `hit`, `death`,
  `skill`, `objective`, `end`).
- Les tests Vitest de `plan.md` §6 DOIVENT rester verts et etre etendus quand
  une regle change : meme seed donne meme hash, proprietes (jamais de NaN, PV
  bornes), replays dores versionnes, performance (1 000 ticks sous un seuil).

Raison : le serveur valide un combat en le rejouant ; un seul calcul flottant
non maitrise casse cette validation (`plan.md` §11).

### III. Interface en DOM, scenes en GPU

L'architecture est hybride (`plan.md` §2).

- Panneaux, cartes, arbres, listes et HUD sont en DOM (Svelte 5), avec le
  design system porte depuis la maquette (`tokens.css`, composants de
  `apps/web/src/ui`). Ils NE DOIVENT PAS etre rendus dans le canvas.
- Les scenes temps reel (carte, deploiement, combat, et la base si elle
  passe en Pixi, `plan.md` §9, phase P2) sont en PixiJS v8. Le repli WebGL2
  DOIT fonctionner quand WebGPU manque.
- La scene lit un instantane de la sim et consomme ses evenements ; elle ne
  modifie jamais l'etat de la sim. Les actions du joueur passent par le
  journal de commandes.
- Le texte affiche dans la scene passe par `BitmapText` MSDF ; tout autre
  texte est en DOM.

Raison : 7 ecrans sur 9 sont de l'interface et leur qualite tient au design
system CSS ; le GPU ne sert que la ou il apporte bloom, particules et
60 fps (`plan.md` §1).

### IV. Le serveur fait foi

Le client n'est jamais cru sur parole pour ce qui a de la valeur
(`plan.md` §6 et §7).

- Un resultat de combat n'est accepte qu'apres re-simulation : le serveur
  fournit le seed, le client renvoie le journal de commandes et le hash de
  l'etat final, le serveur rejoue et compare.
- Economie, timers et gacha (taux, pitie) sont calcules cote serveur.
- Les schemas zod de `packages/data` servent a la fois aux donnees de jeu et
  a l'API ; toute donnee recue par le serveur est validee par eux.

Raison : sans cette validation, un client modifie fausse la progression et
l'economie.

### V. Verifier, ne pas supposer

- Une feature n'est terminee que si `pnpm -r lint`, `pnpm -r typecheck`,
  `pnpm -r test` et `pnpm -r build` passent en local, comme dans la CI
  (`.github/workflows/tests.yml`).
- TypeScript strict partout ; Biome pour le lint et le format.
- pnpm uniquement, jamais npm ni yarn : aucun `package-lock.json` ni
  `yarn.lock` dans un diff.
- Chaque critere de succes d'une spec DOIT etre verifiable (test, mesure ou
  capture), a l'image des verifications de `plan.md` §9 ; le plan de la
  feature dit comment il sera verifie.

Raison : `CLAUDE.md` demande de verifier le travail avec les commandes du
projet plutot que de supposer que le code marche.

## Contraintes techniques

La pile est decrite dans `plan.md` §7 et n'est pas repetee ici. Ces
contraintes s'appliquent a toute feature qui touche le domaine concerne :

- **Budget de rendu** (`plan.md` §5) : sur mobile milieu de gamme, 2 passes
  plein ecran au plus, DPR 1,5 au plus, 2 000 particules et 60 entites au
  plus, 60 fps vises ; sur desktop, DPR 2. Une option "effets reduits" existe
  et `prefers-reduced-motion` est respecte.
- **Mise en page** (`plan.md` §2) : grille CSS fluide, pas de scene fixe
  mise a l'echelle ; largeur minimale de 1280 px sur desktop, le mobile
  arrive en phase P6.
- **Assets** (`plan.md` §4 et §11) : la rarete est une teinte et un halo,
  jamais une texture dupliquee ; polices auto-hebergees en WOFF2, pas de
  Google Fonts.
- **Configuration** (`plan.md` §9, phase P5) : ce qui change entre preprod
  et prod (URL d'API, flags) est lu a l'execution, pas fige au build.
- **Secrets** : jamais dans le depot ni dans un diff (`.gitignore`, template
  de PR).

## Workflow de developpement

Le deroule complet est dans `WORKFLOW.md`. Les regles qui en decoulent :

- Une branche par sujet, partie de `main` (`feature/`, `fix/`, `chore/`,
  `docs/`) ; jamais de commit direct sur `main`. Une PR = un sujet.
- `main` reste livrable : rien de pas fini n'est actif apres un merge.
- Merge en squash vers `main`, une fois la CI verte et la PR relue. Le titre
  de la PR suit le format des commits (`feat: ...`).
- `/code-review` tourne en local avant le dernier commit ; ce qui est ecarte
  est reporte dans la section "Points laisses de cote" de la PR.
- La mise en prod attend la validation humaine de l'environnement
  `production`.

## Gouvernance

- **Preseance** : `CLAUDE.md` puis `plan.md` priment sur cette constitution,
  qui les condense. En cas de contradiction, c'est elle qui a tort : la
  corriger dans la meme PR. Elle prime sur `WORKFLOW.md` et sur les
  artefacts de feature (`specs/`).
- **Portee** : ces principes s'appliquent a toute PR, qu'elle passe par
  spec-kit ou non. `/speckit-plan`, `/speckit-analyze` et `/speckit-converge`
  les verifient pour les features ; pour le reste, c'est la relecture de PR.
- **Ecarts** : un ecart a un principe est justifie dans la section
  "Complexity Tracking" du plan de la feature, ou donne lieu a un
  amendement. Le principe II n'admet aucun ecart.
- **Amendement** : par une PR dediee (`docs: ...`), avec
  `/speckit-constitution` ou a la main. Si l'amendement change une regle de
  `CLAUDE.md` ou de `plan.md`, ces fichiers sont mis a jour dans la meme PR.
- **Versions** : majeure quand un principe est retire ou redefini, mineure
  quand un principe ou une section est ajoute, corrective pour une
  reformulation.

**Version** : 1.0.0 | **Ratifiee** : 2026-09-28 | **Derniere modification** : 2026-09-28
