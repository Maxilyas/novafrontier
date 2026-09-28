# Contrat : reperes d'interface pour les tests

Reperes stables que les tests Playwright utilisent. Ce sont des attributs semantiques presents
dans tous les builds, sans code reserve aux tests (`research.md` R12, R15 et R16).

## Reperes

| Repere | Porte par | Sert a |
|---|---|---|
| `data-screen="<ScreenId>"` et `aria-label` = nom de l'ecran | racine de chaque ecran (`<section>`) | ecran affiche (SC-001) |
| `<nav aria-label="Navigation principale">`, `aria-current="page"` | navigation principale | section mise en evidence (FR-003) |
| `data-scene-host="<SceneId>"`, `data-render-mode` | zone de scene | mode de rendu (SC-005, SC-006) |
| `data-later-phase="<code>"` | chaque commande d'une phase ulterieure | inventaire de SC-012 |
| `role="status"`, `aria-live="polite"` | message bref | texte "Pas encore disponible" |
| `data-panel` | chaque panneau principal d'un ecran | absence de chevauchement (SC-007) |

## Commandes d'une phase ulterieure (FR-018)

Chaque ligne est un bouton qui porte `data-later-phase`. L'activer affiche le message bref et
ne change aucune valeur affichee.

| Code | Ecran | Commande |
|---|---|---|
| `collect` | bandeau | "Collecter" |
| `assign-unit` | Escouades | carte d'unite des effectifs |
| `unassign-unit` | Escouades | carte d'unite du plateau |
| `upgrade-building` | Base | "Ameliorer" |
| `queue-building` | Base | "File" |
| `collect-all` | Base | "Tout collecter" |
| `start-research` | Recherche | bouton du dossier de recherche, quel que soit son libelle |
| `map-move` | Carte | fleches N, S, E, O |
| `map-zoom` | Carte | "Secteur", "Bras", "Galaxie" |
| `spy-planet` | Briefing | "Espionner la planete" |
| `auto-resolve` | Briefing | "Resoudre automatiquement" |
| `auto-deploy-toggle` | Briefing | interrupteur "Deploiement automatique" |
| `pick-unit` | Deploiement | ligne d'une unite a placer |
| `auto-deploy` | Deploiement | "Deploiement automatique" |
| `clear-deploy` | Deploiement | "Tout retirer" |
| `commander-action` | Combat | chaque competence de la barre d'actions |
| `ultimate` | Combat | "Ultime de palier" |
| `open-crate` | Butin | appel a l'action de chaque coffre |

## Commandes de consultation (FR-015, FR-016)

| Ecran | Commandes |
|---|---|
| Escouades | onglets Alpha, Bravo, Charlie (Delta et Echo inactifs) ; filtre Commandants, Vaisseaux, Mecas ; emplacements vides ; "Fixes"/"Achetables" ; "360 degres"/"Arc" ; bouton "Fiche" des cartes |
| Atlas | cartes des effectifs ; paliers 1 a 4 (hors commandants) ; armements actifs |
| Base | batiments du plan et de la liste |
| Recherche | onglets Armement, Flotte, Commandement ; noeuds |
| Briefing | "Combat spatial"/"Combat terrestre" ; "360 degres"/"Arc" |
| Deploiement | "360 degres"/"Arc" |

## Commandes de parcours

Voir `contracts/routes.md` : navigation principale, "Preparer l'assaut", "Espionner" (Carte),
operation proposee, "Passer au deploiement", "Lancer le combat".
