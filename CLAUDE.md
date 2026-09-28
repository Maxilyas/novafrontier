# novafrontier

## Le projet

Jeu de gestion / combat spatial en navigateur.

Stack : monorepo pnpm, TypeScript strict. UI Svelte 5 + Vite 8, scenes PixiJS v8
(WebGPU avec repli WebGL2), simulation deterministe partagee client/serveur,
backend Fastify + PostgreSQL. Deploiement Docker sur VPS, declenche par un merge
sur `main`.

**`plan.md` fait autorite** sur l'architecture, la pile et la feuille de route
(phases P0 a P6). Le lire avant toute decision technique structurante. Si une
decision s'en ecarte, mettre `plan.md` a jour dans la meme PR plutot que de
laisser les deux diverger.

**`WORKFLOW.md`** donne le deroule d'une tache de bout en bout et l'etat reel
du depot (ce qui existe, ce qui manque, les pieges connus). A lire au demarrage
d'une session sur ce projet. Ce fichier-ci reste prioritaire sur les
conventions.

## Spec-kit

Les features passent par [spec-kit](https://github.com/github/spec-kit) :
skills `/speckit-*` dans `.claude/skills/`, outillage dans `.specify/`, un
dossier par feature dans `specs/`. Le deroule est dans `WORKFLOW.md`.

- **Constitution** (`.specify/memory/constitution.md`) : les principes non
  negociables de ce fichier et de `plan.md`, condenses sous une forme que
  spec-kit verifie, avec renvoi vers la source. Elle ne les remplace pas : en
  cas de contradiction, c'est elle qu'on corrige, dans la meme PR.
- **Deux sortes de `plan.md`** : celui de la racine est le plan
  d'architecture du projet ; `specs/<feature>/plan.md` est le plan
  d'implementation d'une feature, subordonne au premier.
- **P1, P2... et "Phase N"** : dans `specs/`, ce sont les priorites des user
  stories et les etapes de `tasks.md`, pas les phases P0 a P6 de la feuille de
  route. Pour citer ces dernieres, ecrire "phase P2 de la feuille de route".
- **Quand s'en servir** : pour une phase ou une partie de phase de la feuille
  de route, ou pour un changement de comportement qui touche plusieurs
  paquets. Un correctif localise, de l'outillage ou de la doc s'en passent.
- **Langue** : le contenu des artefacts de `specs/` est redige en francais,
  comme le reste de la doc ; les titres de section des templates restent en
  anglais.

## Commandes du projet

Claude doit utiliser ces commandes pour verifier son travail plutot que de
supposer que le code marche. A ajuster si les scripts pnpm changent.

```
pnpm install --frozen-lockfile   # installation
pnpm dev                         # lancer le client en local
pnpm -r lint                     # Biome, sur tout le workspace
pnpm -r typecheck
pnpm -r test                     # Vitest
pnpm -r build
```

**pnpm, jamais npm ni yarn** : le workspace en depend, et un `package-lock.json`
qui apparait dans un diff casse l'install de l'autre.

Les memes scripts sont appeles par la CI dans `.github/workflows/tests.yml` :
si vous en renommez un, mettez le workflow a jour dans la meme PR.

## Review et merge

La review se fait sur la PR, par l'equipe avec Claude. Claude ne merge une PR
(en squash vers `main`) que lorsqu'un humain le lui demande explicitement,
meme si elle est verte et relue.
