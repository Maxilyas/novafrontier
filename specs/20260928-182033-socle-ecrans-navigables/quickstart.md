# Quickstart : valider le socle (phase P0 de la feuille de route)

Guide de validation de la feature : installation, commandes, puis scenarios qui prouvent chaque
critere de succes de `spec.md`. Les reperes et contrats sont decrits dans `contracts/`.

## Prerequis

- Node 22, version 22.19 ou plus (`node --version`).
- pnpm 10 : la version exacte est fixee par `packageManager` dans `package.json`, et pnpm la
  telecharge seul. Jamais npm ni yarn (`CLAUDE.md`).
- Pour les tests de bout en bout : le Chromium de Playwright, installe une fois par
  `pnpm --filter @nova/web exec playwright install chromium`.
  - Dans une session Claude Code dans le cloud, ne rien installer : exporter
    `PW_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`.

## Installation et commandes

```bash
pnpm install --frozen-lockfile
pnpm dev                                  # http://localhost:5173/#/escouades
pnpm -r lint                              # Biome, fichiers Svelte compris
pnpm -r typecheck                         # tsc (data, sim) et svelte-check (web)
pnpm -r test                              # Vitest
pnpm -r build                             # build de production de apps/web
pnpm --filter @nova/web test:e2e          # Playwright : projets repli, webgpu, sans-gpu
pnpm --filter @nova/web perf              # Lighthouse, profil ordinateur, sur #/escouades
pnpm --filter @nova/web captures          # captures application et maquette cote a cote
pnpm --filter @nova/web mockup:extract    # regenere les valeurs derivees (packages/data)
```

Resultat attendu : les huit commandes passent. La CI (`.github/workflows/tests.yml`) enchaine
les memes : lint, typecheck, test, build, puis Playwright et Lighthouse.

## Scenarios de validation

| # | Critere | Comment | Attendu |
|---|---|---|---|
| 1 | SC-001, story 1 | `test:e2e`, puis a la main : depuis l'ouverture, rejoindre chaque ecran avec la souris, puis Precedent et rechargement | Escouades a l'ouverture ; Atlas, Base, Recherche, Carte, Butin en 1 action ; Briefing en 2 ; Deploiement en 3 ; Combat en 4 ; Precedent et rechargement gardent l'ecran |
| 2 | SC-002 | `captures`, puis relecture en equipe de `apps/web/captures/*.png` | 9 ecrans valides ; seuls ecarts, ceux de FR-011 |
| 3 | SC-003 | `perf` (ou panneau Lighthouse de Chrome, "Ordinateur", "Performances") | score superieur a 90 |
| 4 | SC-004 | a la main, sur le poste de reference, avec `/?diag=1#/escouades` : changer d'ecran, ouvrir la Carte une premiere fois | badge : changement d'ecran < 300 ms ; premiere scene < 1 s |
| 5 | SC-005 | `test:e2e` (projets `webgpu` et `repli`), puis la matrice manuelle ci-dessous | scene affichee, identique a l'oeil dans les deux modes, 60 images/s au badge |
| 6 | SC-006 | `test:e2e` (projet `sans-gpu`) ; a la main, Chrome sans acceleration materielle | message dans chaque zone de scene ; navigation intacte |
| 7 | SC-007 | `test:e2e` (tailles 1280x720, 1600x900, 1920x1080, 2560x1440) | ni chevauchement, ni defilement horizontal, fenetre remplie |
| 8 | SC-008 | `test:e2e` ; a la main, deplacer la fenetre vers un ecran de densite differente | canvas a la taille de la zone multipliee par min(densite, 2) ; image nette |
| 9 | SC-009 | `test:e2e` (50 allers-retours) ; a la main, 50 allers-retours Carte / Escouades avec `?diag=1` | nombre d'applications de scene stable, memoire sans croissance, 60 images/s |
| 10 | SC-010 | `test:e2e` : journal des requetes pendant le parcours des 9 ecrans | aucune requete hors de `localhost` |
| 11 | SC-011 | `pnpm -r test` (aucune donnee de jeu en dur dans `apps/web/src`) ; a la main, renommer une unite dans `packages/data` puis parcourir les ecrans | nouveau nom partout, sans autre modification |
| 12 | SC-012 | `test:e2e` : activation de chaque element `data-later-phase` | message "Pas encore disponible" ; valeurs inchangees |
| 13 | SC-013 | `test:e2e` (parcours au clavier) ; `pnpm -r typecheck` (avertissements d'accessibilite bloquants) | 9 ecrans atteints au clavier seul ; focus visible |
| 14 | FR-013 | `test:e2e` (oracle) | valeurs affichees egales a celles de la maquette |

## Matrice manuelle des navigateurs (SC-005)

A faire sur le poste de reference, avec les dernieres versions stables, en ouvrant
`/?diag=1#/carte`, puis `#/deploiement` et `#/combat`. Le badge doit indiquer le mode attendu,
la scene doit s'afficher et le reste de l'ecran rester utilisable.

| Navigateur | Rendu accelere | Rendu de repli | Sans acceleration (SC-006, facultatif) |
|---|---|---|---|
| Chrome | reglages par defaut | `?rendu=webgl` (`contracts/scene-host.md`) | Parametres > Systeme > desactiver l'acceleration graphique, puis relancer |
| Edge | reglages par defaut | `?rendu=webgl` | Parametres > Systeme et performances > desactiver l'acceleration graphique |
| Firefox | reglages par defaut (Windows, macOS) | `about:config` : `dom.webgpu.enabled` a `false` | `about:config` : `webgl.disabled` a `true` et `dom.webgpu.enabled` a `false` |
| Safari 26 (Mac, ou service de test en ligne) | reglages par defaut | menu Developpement > Feature Flags : WebGPU desactive | - |

Noter pour chaque case le mode du badge et la cadence d'images, dans la description de la PR.
