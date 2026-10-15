# Contrat : reperes d'interface pour les tests (ajouts de la phase P1)

Prolonge `specs/20260928-182033-socle-ecrans-navigables/contracts/ui-testing.md`. Reperes
semantiques presents dans tous les builds, sans code reserve aux tests.

## Nouveaux reperes

| Repere | Porte par | Sert a |
|---|---|---|
| `data-wave-current`, `data-wave-total` | bandeau de vagues | FR-027, SC-009 |
| `data-relic-percent` | barre de la relique | FR-027, SC-009 |
| `data-next-wave-seconds` | minuteur | FR-003, FR-027 |
| `data-unit`, `data-hp`, `data-destroyed` | chaque ligne de la force engagee | FR-027, SC-011 |
| `data-action-points` | pastilles de points d'action | FR-012 |
| `data-skill="<rang>"`, `aria-disabled`, `aria-pressed` | chaque competence de la barre d'actions | FR-013 |
| `data-ultimate` | bouton de l'ultime de palier | FR-015 |
| `data-designating="<rang>"` | ecran Combat pendant une designation | FR-013 |
| `data-combat-phase`, `data-combat-mode` | racine de l'ecran Combat | cycle de vie, replay |
| `role="dialog"`, `data-modal="end" \| "auto-resolve"`, `data-outcome` | fenetres | FR-030, FR-030a |
| `data-fingerprint` | releve de mesures (`?diag=1`) et fenetre de resolution automatique | FR-022, R10 |
| `data-fingerprint-final` | fenetre de fin du combat | FR-021, SC-003 |
| `data-entities`, `data-tick` | releve de mesures | FR-035, FR-036 |
| `data-slot`, `data-slot-kind`, `data-slot-line`, `data-slot-unit` | boutons d'emplacements | FR-037 a FR-043 |
| `data-placed="<n>/<total>"` | en-tete de la liste "Unités à placer" | FR-042 |

## Codes `data-later-phase` retires

Ces commandes deviennent actives en phase P1 de la feuille de route : `auto-resolve`,
`auto-deploy-toggle`, `pick-unit`, `auto-deploy`, `clear-deploy`, `commander-action`.

`ultimate` quitte aussi l'inventaire : le bouton porte `data-ultimate`, reste sans effet sur le
combat et affiche le message de la maquette ("Capacité ultime — débloquée au niveau 50, réservée aux
boss") au lieu de "Pas encore disponible" (FR-015). L'ecran Combat n'a donc plus de commande d'une
phase ulterieure : le test SC-012 de la phase P0 ne le parcourt plus.

"Lancer le combat" devient un bouton (il lance le moteur avant d'ouvrir l'ecran) : les tests de
parcours de la phase P0 le cherchent comme lien ou comme bouton.

## Horloge des tests

Les tests Playwright du combat installent l'horloge de la page (`page.clock.install()`) avant le
chargement, puis l'avancent (`runFor`) : un combat de deux minutes se verifie en quelques secondes,
sans parametre d'acceleration dans l'application (`research.md` R14).

Les tests qui avancent l'horloge de plus de quelques centaines de millisecondes
(`combat-clock.spec.ts`, `combat-end.spec.ts`) tournent dans le projet `sans-gpu` : chaque image
avancee y est sans rendu, alors que le rendu logiciel de la scene, sur les 2 coeurs de la CI, leur
faisait depasser le delai de 30 s (premier passage de la CI sur la PR 7). Il en va de meme des
combats menes a leur terme de `replay.spec.ts`, `auto-resolve.spec.ts` et de la seconde partie de
`determinism.spec.ts`.

La premiere partie de `determinism.spec.ts` (SC-004) compare l'affichage : rendu accelere ou de
repli et trois tailles de fenetre, dans le projet `repli`. Elle arrete l'horloge avant le chargement
(`install` puis `pauseAt`) pour que seul `runFor` la fasse avancer, avance d'une seconde et compare
le pas et l'empreinte du badge de diagnostic : sans cet arret, le temps qui s'ecoule entre deux
lectures decale l'empreinte d'un pas. L'egalite avec Node sur un combat complet est verifiee dans le
projet `sans-gpu`.
