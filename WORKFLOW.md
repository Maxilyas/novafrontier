# Workflow — recapitulatif operationnel

> **Pour une session Claude qui arrive sur ce depot.**
>
> Ce fichier decrit le **deroule** d'une tache de bout en bout et l'**etat reel**
> du depot. Il ne redefinit aucune regle.
>
> Preseance, en cas de contradiction :
> 1. `CLAUDE.md` — conventions (branches, commits, review, limites de Claude)
> 2. `plan.md` — architecture, pile, feuille de route P0 a P6
> 3. ce fichier — deroule et etat des lieux
>
> Si ce fichier contredit l'un des deux autres, c'est lui qui a tort : le
> corriger ici, dans la meme PR que le changement.

Derniere mise a jour : 4 septembre 2026 (initialisation du projet).

---

## 1. Etat du depot

Le depot ne contient **aucun code applicatif**. Uniquement de la documentation
et de l'outillage CI. Le projet est avant la phase P0 du plan.

**Present :**

| Fichier | Role |
|---|---|
| `plan.md` | Architecture, comparatif des moteurs, feuille de route P0-P6. Fait autorite. |
| `CLAUDE.md` | Conventions partagees, lu automatiquement par Claude Code. |
| `.github/workflows/tests.yml` | Lint / typecheck / tests / build pnpm sur les PR vers `dev` et `main`. |
| `.github/workflows/deploy.yml` | Build image GHCR + SSH vers le VPS, sur push vers `main`. |
| `.github/pull_request_template.md` | Checklist de PR. |
| `.gitattributes` | LF partout, quel que soit l'OS. |
| `.gitignore` / `.dockerignore` | Secrets, artefacts, contexte de build. |

**Absent — a creer en P0 :** `package.json`, `pnpm-workspace.yaml`,
`tsconfig.base.json`, `biome.json`, `apps/web`, `apps/server`, `packages/sim`,
`packages/data`. **Absent — a creer en P5 :** `Dockerfile`,
`docker-compose.yml` (ce dernier vit sur le VPS).

Les deux workflows contiennent un garde-fou qui les fait se sauter tant que
ces fichiers manquent. **Ils n'ont donc jamais reellement tourne** : ils sont
valides syntaxiquement, pas verifies a l'usage. La premiere PR vers `dev` sera
leur premier vrai test.

---

## 2. Qui fait quoi

| Etape | Qui | Automatique ? |
|---|---|---|
| Ecrire le code | humain + Claude en session | — |
| Review de code | Claude en local, `/code-review` | **non** — personne ne la declenche a votre place |
| Lint, typecheck, tests, build | CI (`tests.yml`) | oui, sur chaque PR |
| Merge | humain | non |
| Deploiement | CI (`deploy.yml`) | oui, sur push vers `main` |

Il n'y a **pas** de review automatique dans la CI : c'est un choix assume
(voir `CLAUDE.md`). La CI ne juge pas la conception, seulement que ca compile
et que ca passe.

---

## 3. Le cycle complet

### Demarrer une tache

```
git switch dev && git pull
git switch -c feature/mon-sujet
```

Jamais de commit direct sur `dev` ni sur `main`.
Prefixes : `feature/`, `fix/`, `chore/`, `docs/`.

### Pendant le travail

Rester dans le perimetre annonce. Ne pas reformater du code non touche, ne pas
renommer de fichiers en passant, ne pas toucher au lockfile sans raison — les
trois causes de conflit les plus couteuses a deux (detail dans `CLAUDE.md`).

### Avant de commiter

```
/code-review
```

A lancer **avant** le dernier commit, pas apres avoir pousse : les corrections
restent dans la branche au lieu de produire un commit "fix review". Sur une
branche qui a vecu plusieurs jours, viser `/code-review dev` pour relire tout
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
git fetch origin && git rebase origin/dev
git push
```

`push.autoSetupRemote` est actif : `git push` nu suffit sur une branche neuve.

Remplir le template, en particulier la section **Points laisses de cote** : la
review ayant eu lieu dans votre session, l'autre personne n'a aucune visibilite
sur ce qui a ete signale puis ecarte. Sans ce report, l'information est perdue.

### Merger

`feature/*` -> `dev` une fois la CI verte et la PR relue.
`dev` -> `main` quand un lot est pret a partir en prod.

Un merge sur `main` **est** une mise en production.

---

## 4. Pieges connus sur ce depot

1. **pnpm, jamais npm ni yarn.** Le workspace en depend. Un `package-lock.json`
   qui apparait dans un diff casse l'install de l'autre.
2. **GHCR refuse les majuscules.** Le depot s'appelle `Maxilyas/novafrontier` ;
   `deploy.yml` convertit le nom d'image en minuscules avant le push, sinon
   l'erreur est `repository name must be lowercase`.
3. **La protection de branche est a l'envers.** `dev` exige des PR, `main` n'est
   pas protegee — alors que c'est `main` qui declenche les deploiements. A
   corriger dans Settings. Par ailleurs la regle sur `dev` n'engage pas les
   administrateurs : un push direct passe sans blocage, il est seulement
   enregistre comme contournement.
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

---

## 5. Prochaine etape

Phase **P0** du plan : monorepo pnpm, Vite 8 + Svelte 5 + TypeScript, Biome,
portage des tokens CSS et des primitives de la maquette, `packages/data` et
`packages/sim` vides mais types, `SceneHost` Pixi avec detection WebGPU/WebGL2.

Aucun asset definitif ni backend a ce stade.

A faire passer par une PR vers `dev` — ce sera la premiere execution reelle de
la CI, et l'occasion de retirer le garde-fou de `tests.yml`.
