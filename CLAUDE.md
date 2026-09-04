# novafrontier

> Ce fichier est lu automatiquement par Claude Code au demarrage de chaque
> session, chez Antoine comme chez Maxilyas. C'est le seul endroit ou nos
> deux assistants partagent les memes regles. Il est versionne : si vous
> changez une convention, c'est ici, dans une PR.

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

## Workflow git — regles imperatives

**Ne jamais commiter directement sur `main` ni sur `dev`.** Tout passe par une
branche puis une PR.

- `main` — production. Ne recoit que des PR depuis `dev`.
- `dev` — branche d'integration. Ne recoit que des PR depuis des branches de travail.
- `feature/<sujet>` / `fix/<sujet>` / `chore/<sujet>` — branches de travail,
  partent toujours de `dev` a jour.

Avant de commencer quoi que ce soit :

```
git switch dev && git pull && git switch -c feature/mon-sujet
```

Avant de pousser, toujours rebaser sur `dev` a jour — pas de merge commit
"Merge branch 'dev' of github.com/..." dans l'historique :

```
git fetch origin && git rebase origin/dev
```

## Regles anti-conflit (on est deux sur le repo)

1. **Une PR = un sujet.** Petite et courte a vivre. Une branche qui vit une
   semaine est une branche qui va faire mal a rebaser.
2. **Ne pas reformater du code qu'on ne touche pas.** Un reformatage global
   transforme un diff de 5 lignes en diff de 500 et ecrase le travail en
   cours de l'autre. Si le formatage doit changer, c'est une PR dediee, seule,
   mergee vite.
3. **Ne pas renommer ni deplacer des fichiers en passant.** Si c'est
   necessaire, le dire dans la PR et prevenir l'autre.
4. **Ne pas toucher aux lockfiles sans raison.** Ne pas relancer `install`
   juste pour "mettre a jour".
5. **Annoncer le perimetre.** Avant de lancer un gros chantier, dire sur quels
   fichiers on va vivre, pour que l'autre n'y aille pas en meme temps.

## Conventions de commit

Format court, a l'imperatif, prefixe par le type :

```
feat: ajoute l'export CSV des rapports
fix: corrige le calcul de TVA sur les remises
chore: met a jour les dependances
docs: complete le README
refactor: extrait la validation dans un module
test: ajoute les cas limites du parser
```

Un commit = un changement coherent. Pas de commit "wip" ou "fix" seul sur
une branche destinee a etre mergee.

## Ce que Claude ne fait pas sans qu'on le demande

- Pousser sur `origin` (`git push`).
- Merger ou fermer une PR.
- Faire un `git rebase` / `reset --hard` / `push --force` sur une branche
  partagee — donc jamais sur `dev` ni `main`.
- Modifier `.github/workflows/` sans le signaler explicitement.
- Ajouter une dependance sans le dire.

## Secrets

Aucun secret dans le repo. `.env` est ignore par git ; le modele des variables
attendues va dans `.env.example`, qui lui est versionne.

La cle API pour la review automatique est dans les secrets GitHub du repo
(`ANTHROPIC_API_KEY`), pas dans le code.

## Commandes du projet

Claude doit utiliser ces commandes pour verifier son travail plutot que de
supposer que le code marche. A ajuster si les scripts npm changent.

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

## Deploiement

`main` est deployee automatiquement. Un merge sur `main` = une mise en prod.
Le workflow construit l'image, la pousse sur GHCR et redemarre les conteneurs
du VPS par SSH. Chaque image est taguee avec le SHA du commit : pour revenir
en arriere, on repointe le compose sur le tag precedent.

Ne jamais pousser directement sur `main`.
