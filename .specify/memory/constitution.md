# Constitution de Nova Frontier

Principes non negociables du projet, sous une forme verifiable. Spec-kit les
applique a chaque feature : porte "Constitution Check" de `/speckit-plan`,
puis `/speckit-analyze` et `/speckit-converge`.

Ses principes ne creent pas de regle : ils condensent ce qui est deja acte
dans `CLAUDE.md` et `plan.md`, avec un renvoi vers la source. Les valeurs
(pas de simulation, formats, budgets, versions) restent dans `plan.md` et ne
sont pas recopiees ici : une feature les lit a la source.

## Principes fondamentaux

### I. `plan.md` fait autorite

L'architecture, la pile, la structure du depot et la feuille de route sont
celles de `plan.md` a la racine (`CLAUDE.md`).

- Un plan de feature (`specs/<feature>/plan.md`) DOIT utiliser la pile de
  `plan.md` §7 et l'arborescence de `plan.md` §8, pas une structure generique
  (`src/`, `backend/`, `frontend/`).
- Une feature qui s'ecarte de `plan.md` (dependance structurante, autre
  moteur, autre decoupage en paquets) DOIT mettre `plan.md` a jour dans la
  meme PR (`CLAUDE.md`).
- Quand une feature sert une phase de la feuille de route (`plan.md` §9,
  phases P0 a P6), son plan l'indique et reprend les criteres de
  verification de cette phase qui la concernent.

Raison : deux documents d'architecture qui divergent ne servent plus de
reference ni a l'un ni a l'autre.

### II. Simulation deterministe et partagee (NON NEGOCIABLE)

Les regles du jeu vivent dans `packages/sim`, en TypeScript pur, et le meme
code tourne cote client et cote serveur (`plan.md` §6).

- `packages/sim` NE DOIT dependre ni du DOM, ni de Pixi, ni de Svelte, ni du
  reseau.
- La sim avance a pas fixe ; le rendu interpole entre deux ticks, il ne
  pilote jamais la sim.
- Aucune source de non-determinisme : RNG seede uniquement (pas de
  `Math.random`), positions et distances en virgule fixe, angles discrets
  avec tables trigonometriques, aucun appel a `Math.sin`, `Math.cos`,
  `Math.atan2` ni `Math.hypot`, aucune lecture d'horloge. Le pas, les formats,
  les entrees et les sorties sont ceux de `plan.md` §6.
- Les tests Vitest de `plan.md` §6 DOIVENT rester verts et etre etendus quand
  une regle change : meme seed donne meme hash, proprietes, replays dores,
  performance.

Raison : le serveur valide un combat en le rejouant ; un seul calcul flottant
non maitrise casse cette validation (`plan.md` §11).

### III. Interface en DOM, scenes en GPU

L'architecture est hybride (`plan.md` §2).

- L'interface (panneaux, cartes, arbres, listes, HUD) est en DOM (Svelte 5),
  avec le design system porte depuis la maquette. Elle NE DOIT PAS etre
  rendue dans le canvas, a l'exception du texte que `plan.md` place dans la
  scene (chiffres du HUD dans la scene, `plan.md` §2 et §4), dessine en
  `BitmapText` MSDF.
- Les scenes temps reel sont en PixiJS v8 (lesquelles : `plan.md` §2 et §9).
  Le repli WebGL2 DOIT fonctionner quand WebGPU manque.
- La scene lit un instantane de la sim et consomme ses evenements ; elle ne
  modifie jamais l'etat de la sim. Les actions du joueur passent par le
  journal de commandes.

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
  `pnpm -r test` et `pnpm -r build` passent, comme dans la CI
  (`.github/workflows/tests.yml`) ; Claude les lance pour verifier son
  travail plutot que de supposer qu'il marche (`CLAUDE.md`).
- TypeScript strict partout ; Biome pour le lint et le format (`plan.md` §7).
- pnpm uniquement, jamais npm ni yarn : aucun `package-lock.json` ni
  `yarn.lock` dans un diff (`CLAUDE.md`).
- Chaque critere de succes d'une spec DOIT etre verifiable (test, mesure ou
  capture) ; le plan de la feature dit comment il le sera, a l'image des
  verifications de `plan.md` §9.

Raison : un changement qui n'a pas ete verifie n'est pas fini, et la CI ne
juge que ce qu'on lui donne a executer.

## Contraintes techniques

Elles s'appliquent a toute feature qui touche le domaine concerne. Les
valeurs sont dans `plan.md`, qui seul les fixe.

- **Budget de rendu** : celui de `plan.md` §5 (passes plein ecran, DPR,
  particules, entites, fps, sur mobile et sur desktop), avec l'option
  "effets reduits" et le respect de `prefers-reduced-motion`.
- **Mise en page** : grille CSS fluide, pas de scene fixe mise a l'echelle ;
  largeur minimale sur desktop et arrivee du mobile selon `plan.md` §2 et §9.
- **Assets** : la rarete est une teinte et un halo, jamais une texture
  dupliquee ; polices auto-hebergees, pas de Google Fonts (`plan.md` §4 et
  §11).
- **Configuration** : ce qui change entre preprod et prod (URL d'API, flags)
  est lu a l'execution, pas fige au build (`plan.md` §9, phase P5).
- **Secrets** : jamais dans le depot ni dans un diff (`.gitignore`).

## Workflow de developpement

Le deroule (branches, commits, review, PR, merge, mise en prod) est defini
par `WORKFLOW.md` et n'est pas repris ici : une regle de workflow se change
dans ce fichier.

## Gouvernance

- **Preseance** : `CLAUDE.md` puis `plan.md` priment sur cette constitution,
  qui les condense. En cas de contradiction, c'est elle qui a tort : la
  corriger dans la meme PR. Elle prime sur `WORKFLOW.md` et sur les
  artefacts de feature (`specs/`).
- **Portee** : ces principes s'appliquent a toute PR, qu'elle passe par
  spec-kit ou non. `/speckit-plan`, `/speckit-analyze` et `/speckit-converge`
  les verifient pour les features ; pour le reste, c'est la relecture de PR.
- **Ecarts** : un ecart aux principes III ou IV est admis s'il est justifie
  dans la section "Complexity Tracking" du plan de la feature ; il est alors
  conforme, et ni `/speckit-analyze` ni `/speckit-converge` ne le traitent
  comme une violation. Un ecart a `plan.md` (principe I, contraintes
  techniques) se regle en mettant `plan.md` a jour dans la meme PR. Les
  principes II et V et la regle des secrets n'admettent aucun ecart.
- **Amendement** : dans la PR qui change la regle source (`CLAUDE.md` ou
  `plan.md`), sinon dans une PR dediee (`docs: ...`). `/speckit-constitution`
  peut le rediger.
- **Versions** : majeure quand un principe est retire ou redefini, mineure
  quand un principe ou une section est ajoute, corrective pour une
  reformulation.

**Version** : 1.0.0 | **Ratifiee** : 2026-09-28 | **Derniere modification** : 2026-09-28
