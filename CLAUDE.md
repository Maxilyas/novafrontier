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
