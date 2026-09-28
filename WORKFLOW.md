# Workflow — recapitulatif operationnel

> **Pour une session Claude qui arrive sur ce depot.**
>
> Ce fichier decrit le **deroule** d'une tache de bout en bout et l'**etat reel**
> du depot. Il ne redefinit aucune regle.
>
> Preseance, en cas de contradiction :
> 1. `CLAUDE.md` — presentation du projet et commandes
> 2. `plan.md` — architecture, pile, feuille de route P0 a P6
> 3. `.specify/memory/constitution.md` — principes non negociables, verifies
>    par spec-kit
> 4. ce fichier — deroule et etat des lieux
> 5. `specs/<feature>/` — artefacts spec-kit d'une feature
>
> Si ce fichier contredit l'un des trois premiers, c'est lui qui a tort : le
> corriger ici, dans la meme PR que le changement.

Derniere mise a jour : 28 septembre 2026 (adoption de spec-kit).

---

## 1. Etat du depot

Le depot ne contient **aucun code applicatif**. Uniquement de la documentation,
de l'outillage CI et spec-kit. Le projet est avant la phase P0 du plan.

**Present :**

| Fichier | Role |
|---|---|
| `plan.md` | Architecture, comparatif des moteurs, feuille de route P0-P6. Fait autorite. |
| `CLAUDE.md` | Presentation du projet et commandes, lu automatiquement par Claude Code. |
| `.github/workflows/tests.yml` | Lint / typecheck / tests / build pnpm sur les PR vers `main`. |
| `.github/workflows/deploy.yml` | Build image GHCR + deploiement prod par SSH sur le VPS, sur push vers `main`, derriere la validation de l'environnement `production` (pieges 3 et 7). Pas encore de preprod. |
| `.github/pull_request_template.md` | Checklist de PR. |
| `.gitattributes` | LF partout, quel que soit l'OS. |
| `.gitignore` / `.dockerignore` | Secrets, artefacts, contexte de build. |
| `.specify/` | Spec-kit 1.0.12 : constitution (`memory/constitution.md`), templates, scripts bash, reglages (`init-options.json`). Voir §3 et pieges 8 a 11. |
| `.claude/skills/speckit-*/` | Les skills `/speckit-*` de Claude Code, generes par spec-kit (piege 9). |
| `.claude/settings.json` | Permissions Claude Code partagees : les scripts qu'appellent les skills spec-kit se lancent sans demande de confirmation. |

**Absent — a creer en P0 :** `package.json`, `pnpm-workspace.yaml`,
`tsconfig.base.json`, `biome.json`, `apps/web`, `apps/server`, `packages/sim`,
`packages/data`. **Absent — a creer en P5 :** `Dockerfile`,
`docker-compose.yml` (ce dernier vit sur le VPS). **Absent — cree par la
premiere feature spec-kit :** `specs/`.

Les deux workflows contiennent un garde-fou qui les fait se sauter tant que
ces fichiers manquent. **Ils n'ont donc jamais reellement tourne** : ils sont
valides syntaxiquement, pas verifies a l'usage. La PR du P0 vers `main` sera
le premier vrai test de `tests.yml` ; celle qui ajoutera le `Dockerfile`,
celui de `deploy.yml`.

---

## 2. Qui fait quoi

| Etape | Qui | Automatique ? |
|---|---|---|
| Specifier, planifier, decouper une feature | humain + Claude, skills `/speckit-*` | non — chaque etape est lancee puis relue par un humain |
| Ecrire le code | humain + Claude en session | — |
| Review de code | Claude en local, `/code-review` | **non** — personne ne la declenche a votre place |
| Lint, typecheck, tests, build | CI (`tests.yml`) | oui, sur chaque PR |
| Merge | humain, en squash vers `main` | non |
| Deploiement preprod | CI | oui, a chaque merge sur `main` — **pas encore en place** |
| Mise en prod | CI (`deploy.yml`), sur feu vert humain | non — le job attend la validation de l'environnement `production` (piege 3) |

Il n'y a **pas** de review automatique dans la CI : c'est un choix assume. La
CI ne juge pas la conception, seulement que ca compile et que ca passe.

---

## 3. Le cycle complet

### Demarrer une tache

```
git switch main && git pull
git switch -c feature/mon-sujet
```

Jamais de commit direct sur `main`.
Prefixes : `feature/`, `fix/`, `chore/`, `docs/`.

### Specifier, planifier, implementer (feature spec-kit)

Pour une phase de la feuille de route ou un changement qui touche plusieurs
paquets (voir `CLAUDE.md`). Chaque etape est un skill a lancer dans Claude
Code, dans cet ordre, en relisant le resultat avant de passer a la suivante :

| Etape | Skill | Produit dans `specs/<feature>/` |
|---|---|---|
| Specifier : le quoi et le pourquoi, sans technique | `/speckit-specify <description>` | `spec.md`, `checklists/requirements.md` |
| Lever les ambiguites (conseille) | `/speckit-clarify` | `spec.md` complete |
| Planifier : le comment, dans le cadre de `plan.md` | `/speckit-plan <contraintes>` | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` |
| Decouper en taches | `/speckit-tasks` | `tasks.md` |
| Verifier la coherence (conseille, lecture seule) | `/speckit-analyze` | rapport dans la session |
| Implementer | `/speckit-implement` | le code, et les taches cochees dans `tasks.md` |
| Converger | `/speckit-converge` | de nouvelles taches dans `tasks.md` s'il reste des ecarts |

Repeter implementer puis converger jusqu'a ce que `/speckit-converge` ne
trouve plus d'ecart. `/speckit-checklist` (listes de controle de la qualite
des exigences) est optionnel.

- Le dossier de la feature s'appelle `specs/<AAAAMMJJ-HHMMSS>-<nom>/` :
  l'horodatage evite que deux branches ouvertes en parallele prennent le meme
  numero.
- `/speckit-plan` passe la porte "Constitution Check" : un ecart non admis
  par la constitution l'arrete (ecarts admis : section Gouvernance de la
  constitution).
- La branche se cree a la main, comme ci-dessus : spec-kit ne touche pas a
  git dans ce depot.
- Les artefacts de `specs/` sont commites dans la branche de la feature. Pour
  faire relire la spec et le plan avant d'implementer, ouvrir la PR en
  brouillon a ce stade.

### Pendant le travail

Rester dans le perimetre annonce. Ne pas reformater du code non touche, ne pas
renommer de fichiers en passant, ne pas toucher au lockfile sans raison — les
trois causes de conflit les plus couteuses a deux.

### Avant de commiter

```
/code-review
```

A lancer **avant** le dernier commit, pas apres avoir pousse : les corrections
restent dans la branche au lieu de produire un commit "fix review". Sur une
branche qui a vecu plusieurs jours, viser `/code-review main` pour relire tout
l'ecart, sinon seul le dernier diff est relu.

Puis verifier localement ce que la CI verifiera :

```
pnpm -r lint && pnpm -r typecheck && pnpm -r test
```

### Commiter

Format imperatif prefixe par le type — `feat:`, `fix:`, `chore:`, `docs:`,
`refactor:`, `test:`. Un commit = un changement coherent.

### Ouvrir la PR

```
git fetch origin && git rebase origin/main
git push
```

`push.autoSetupRemote` est actif : `git push` nu suffit sur une branche neuve.
Si la branche etait deja poussee, le rebase a reecrit son historique :
`git push --force-with-lease`, sur sa propre branche de travail uniquement.
C'est le cas courant quand l'autre merge avant vous (le ruleset exige une
branche a jour) ; le bouton **Update branch** de la PR marche aussi.

La PR vise `main`. Son titre suit le format des commits (`feat: ...`) : au
merge en squash, c'est lui qui devient le message du commit sur `main`.

Remplir le template, en particulier la section **Points laisses de cote** : la
review ayant eu lieu dans votre session, l'autre personne n'a aucune visibilite
sur ce qui a ete signale puis ecarte. Sans ce report, l'information est perdue.

Pour une feature spec-kit, donner le chemin de `specs/<feature>/` dans la
description : la spec et le plan sont le point d'entree de la relecture.

### Merger

En **squash**, vers `main`, une fois la CI verte et la PR relue.

Un merge sur `main` n'est **pas** une mise en production, mais tout ce qui est
sur `main` doit rester livrable : la prochaine mise en prod embarquera tous les
merges depuis la precedente, pas seulement le dernier.

### Mettre en prod

- **Cible** (avec l'hebergement, au plus tard en P5) : chaque merge part en
  preprod automatiquement ; on promeut ensuite en prod l'image deja testee en
  preprod (meme SHA), sans la reconstruire.
- **Aujourd'hui** : pas de preprod. Un merge sur `main` lance `deploy.yml`, qui
  construit l'image puis attend un feu vert avant de deployer en prod : onglet
  Actions, ouvrir le run, **Review deployments**, cocher `production`, puis
  **Approve and deploy** ou **Reject**. Ne pas laisser un run en attente : il
  bloque les suivants (piege 7). Tant qu'il n'y a pas de `Dockerfile`, rien ne
  part.
- **Revenir en arriere** : aujourd'hui, repointer a la main le compose du VPS
  sur le tag du SHA precedent ; a terme, redeployer l'image de ce SHA.

---

## 4. Pieges connus sur ce depot

1. **pnpm, jamais npm ni yarn.** Le workspace en depend. Un `package-lock.json`
   qui apparait dans un diff casse l'install de l'autre.
2. **GHCR refuse les majuscules.** Le depot s'appelle `Maxilyas/novafrontier` ;
   `deploy.yml` convertit le nom d'image en minuscules avant le push, sinon
   l'erreur est `repository name must be lowercase`.
3. **Les garde-fous de `main` et de la prod sont des reglages GitHub, pas du
   code.** Rien dans le depot ne les verifie, il faut qu'ils soient en place :
   - ruleset sur `main` : PR obligatoire, check `Tests & Lint` vert, branche a
     jour, historique lineaire, liste de contournement vide ;
   - Settings > General : merge en squash seul, message par defaut = titre de
     la PR ;
   - environnement `production` : "Required reviewers", deploiement limite a
     la branche `main`.

   Sans le ruleset, on peut pousser sur `main` sans PR ni CI ; sans les
   Required reviewers, tout merge sur `main` part en prod sans validation. Ces
   protections sont gratuites parce que le depot est public : en prive, les
   Required reviewers demandent GitHub Enterprise, et sur un compte gratuit le
   ruleset n'est plus applique non plus.
4. **Les garde-fous de CI sont temporaires.** `tests.yml` teste la presence de
   `package.json`, `deploy.yml` celle de `Dockerfile`. Les deux etapes sont a
   supprimer une fois le socle en place, sinon un jour la CI se sautera en
   silence au lieu d'echouer.
5. **`.gitattributes` force LF.** Sous Windows, git affiche un avertissement
   `CRLF will be replaced by LF` a l'ajout d'un fichier : c'est le comportement
   attendu, pas une erreur.
6. **Aucune cle Anthropic cote GitHub.** La review tourne en local avec
   l'abonnement de chacun. Les seuls secrets a creer sont les `VPS_*`, et
   seulement a partir du P5.
7. **`deploy.yml` ne deploie pas encore par SHA** (sans effet tant qu'il n'y a
   pas de `Dockerfile`). Le build pousse `:latest` avant toute validation, y
   compris depuis une autre branche via `workflow_dispatch`, et le deploiement
   tire `:latest`, pas l'image de son propre run : une image refusee devient
   donc quand meme `:latest`. Et comme la concurrence est reglee sur tout le
   workflow, un run qui attend son feu vert bloque les suivants. A corriger en
   meme temps que le `Dockerfile` : deployer un SHA explicite, ne deplacer
   `:latest` qu'apres validation, reserver build et deploiement a `main`.
8. **La feature courante de spec-kit est un etat local.** Elle est notee dans
   `.specify/feature.json`, ignore par git, qui ne suit pas les changements de
   branche. Tous les skills sauf `/speckit-specify` et
   `/speckit-constitution` en dependent. Dans un clone neuf ou une session
   Claude dans le cloud, ils s'arretent sur `Feature directory not found`.
   Apres un `git switch`, ils visent encore la feature de l'autre branche :
   `/speckit-clarify` peut ecrire dans sa spec, `/speckit-plan` recree son
   dossier. Avant de reprendre une feature, demander a Claude d'ecrire
   `{"feature_directory": "specs/<feature>"}` dans `.specify/feature.json`.
   Ne pas exporter `SPECIFY_FEATURE_DIRECTORY` pour toute une session : elle
   prime sur `feature.json` et garde la meme feature meme apres un
   `/speckit-specify`, dont le plan ecraserait alors celui de la precedente.
9. **Les fichiers generes par spec-kit ne se modifient pas a la main.** Les
   skills `.claude/skills/speckit-*`, les scripts et les templates de
   `.specify/` sont references avec leur empreinte dans
   `.specify/integrations/*.manifest.json` : une mise a jour refuse d'ecraser
   un fichier modifie. Les regles propres au depot vont dans la constitution ;
   pour adapter un template, en deposer une copie modifiee sous le meme nom
   dans `.specify/templates/overrides/`, qui prime sur l'original.
   Mise a jour : `specify self upgrade`, puis `specify integration upgrade
   claude` et `specify integration status`, dans une PR `chore:` dediee. Ne
   pas relancer `specify init` : il remettrait `.specify/init-options.json` a
   ses valeurs par defaut (numerotation sequentielle au lieu de l'horodatage).
10. **Les skills lancent des scripts bash** (`.specify/scripts/bash/`). Sous
    Windows, Claude Code doit pouvoir les executer via Git Bash ; LF est
    indispensable (piege 5) : un script en CRLF ne s'execute pas.
11. **Deux skills ecrivent hors de `specs/`.** `/speckit-implement` complete au
    besoin `.gitignore` et `.dockerignore` : relire ces fichiers dans le diff.
    `/speckit-taskstoissues` cree une issue GitHub par tache sur le depot : a
    ne lancer que si l'on veut suivre les taches dans les issues.

---

## 5. Prochaine etape

Phase **P0** du plan : monorepo pnpm, Vite 8 + Svelte 5 + TypeScript, Biome,
portage des tokens CSS et des primitives de la maquette, `packages/data` et
`packages/sim` vides mais types, `SceneHost` Pixi avec detection WebGPU/WebGL2.

Aucun asset definitif ni backend a ce stade.

A faire passer par une PR vers `main` — ce sera la premiere execution reelle de
la CI, et l'occasion de retirer le garde-fou de `tests.yml`.

C'est aussi la premiere feature a faire passer par spec-kit (cycle du §3).
Decrire a `/speckit-specify` ce que P0 rend visible : les 9 ecrans
navigables, fideles a la maquette, et la scene qui s'affiche avec ou sans
WebGPU. La pile et l'outillage (monorepo, Vite, Biome, CI) vont a
`/speckit-plan`, qui les tire de `plan.md` : une spec reste sans technique.
