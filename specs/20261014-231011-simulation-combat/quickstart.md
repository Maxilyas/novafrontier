# Quickstart : valider la simulation, le plateau et le combat (phase P1 de la feuille de route)

Guide de validation : prerequis, commandes, puis scenarios qui prouvent chaque critere de succes de
`spec.md`. Contrats : `contracts/` ; formes des donnees : `data-model.md`.

## Prerequis

Ceux de la phase P0 de la feuille de route (`specs/20260928-182033-socle-ecrans-navigables/
quickstart.md`) : Node 22.19 ou plus, pnpm par `packageManager` (sur un poste ou pnpm n'est pas dans
le PATH : `corepack pnpm ...`). En plus, pour les tests de determinisme dans les navigateurs, les
moteurs Firefox et WebKit de Playwright :

```bash
pnpm --filter @nova/sim exec playwright install chromium firefox webkit
```

Dans une session Claude Code dans le cloud, Chromium est preinstalle
(`PW_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`) ; Firefox et WebKit s'installent comme
ci-dessus, ou ces tests restent a la CI.

## Commandes

```bash
pnpm install --frozen-lockfile
pnpm -r lint
pnpm -r typecheck
pnpm -r test                               # dont sim : regles, briefing, reference, proprietes, performance
pnpm --filter @nova/sim test:browsers      # combats de reference dans Chromium, Firefox, WebKit
pnpm -r build
pnpm --filter @nova/web test:e2e           # Playwright : plateau, combat, replay, resolution, pause
pnpm --filter @nova/web perf               # Lighthouse sur Escouades (> 90, phase P0)
pnpm --filter @nova/web captures           # captures, dont Deploiement et Combat en cours
pnpm --filter @nova/sim golden:update      # SEULEMENT pour assumer un changement de regle (FR-023)
```

Resultat attendu : toutes passent, sauf `golden:update` qui n'est pas une verification. La CI
(`tests.yml`) enchaine lint, typecheck, test, build, installation des trois navigateurs,
`test:browsers`, Playwright et Lighthouse.

## Scenarios de validation

| # | Critere | Comment | Attendu |
|---|---|---|---|
| 1 | SC-001, story 1 | `test:e2e` ; a la main : Escouades, Alpha, Carte, Preparer l'assaut, Passer au deploiement, Lancer le combat, utiliser Frappe orbitale (designer un point), suivre jusqu'a la fin | fenetre de fin "Relique sécurisée" ou "Relique perdue" ; HUD, scene et journal suivent le combat |
| 2 | SC-011, story 2 | `test:e2e` ; a la main : Deploiement d'Alpha en combat terrestre, "Tout retirer", placer 2 vaisseaux et 2 mecas a la souris, puis au clavier, laisser une unite, lancer | 10 actions au plus ; emplacements bleus et verts ; refus du mauvais type ; combat avec 4 unites a leurs emplacements |
| 3 | SC-012 | `pnpm -r test` (sim) | placement automatique valide, lignes de la maquette pour chaque escouade et theatre |
| 4 | SC-002 | `pnpm -r test` puis `test:browsers` ; a la main, Edge et Safari : voir ci-dessous | 0 divergence d'empreinte sur les combats de reference |
| 5 | SC-003, story 3 | `pnpm -r test` (replay) ; `test:e2e` ; a la main : finir un combat avec des competences, "Revoir le combat" | meme deroulement, meme issue, meme empreinte (`?diag=1`) |
| 6 | SC-004 | `pnpm -r test` (horloge a 60, 120 et 144 Hz simulees) ; `test:e2e` (rendu de repli, 1280x720 et 2560x1440, onglet masque) | meme empreinte finale |
| 7 | SC-005 | a la main, sur le poste de reference : `/?diag=1&charge=1#/combat`, une minute | au moins 60 entites au releve, au moins 60 images/s en moyenne |
| 8 | SC-006 | `pnpm -r test` (performance de la sim) | mediane sous 50 ms pour 1 200 pas a 60 entites |
| 9 | SC-007 | `pnpm -r test` (proprietes) | 10 000 combats sans valeur invalide, tous finis avant 12 000 pas |
| 10 | SC-008 | `pnpm -r test` (briefing contre `derived.generated.json`) puis `test:e2e` (oracle de la maquette) | valeurs egales, aux ecarts admis pres (R9) |
| 11 | SC-009 | `test:e2e` : en fin de combat, comparer HUD, fenetre de fin et releve | memes vagues, unites restantes, relique |
| 12 | SC-010 | `captures`, puis relecture en equipe a cote de la maquette ; essai de chaque competence | ressemblance validee ; effets conformes a FR-014 |
| 13 | FR-030a | `test:e2e` ; a la main : Briefing, "Resoudre automatiquement", puis "Revoir le combat" | resultat calcule ; le replay aboutit au meme resultat |
| 14 | FR-032, cas limites | `test:e2e` : quitter l'ecran Combat puis revenir ; projet `sans-gpu` | pause puis reprise au meme pas ; sans acceleration, le combat avance et la fenetre de fin s'affiche |

## Empreintes sur Edge et Safari (SC-002, R10)

1. Lire dans `packages/sim/tests/golden/combats.json` l'empreinte attendue d'un combat sans
   commande de l'escouade Alpha, combat spatial, formation a 360 degres, graine 1
   (entree `alpha-orbital-ring-1`).
2. Ouvrir `/?diag=1&graine=1#/briefing` (escouade Alpha et combat spatial par defaut).
3. "Resoudre automatiquement" : la fenetre affiche l'empreinte (`data-fingerprint`).
4. Recommencer avec deux autres entrees (combat terrestre, arc), puis comparer.

| Navigateur | Ou | Attendu |
|---|---|---|
| Edge | poste de reference | empreintes egales a la reference |
| Safari 26 | Mac, ou service de test en ligne | empreintes egales a la reference |

Noter les resultats dans la description de la PR, avec la matrice des modes de rendu de la phase
P0 de la feuille de route, refaite pour les ecrans Deploiement et Combat.
