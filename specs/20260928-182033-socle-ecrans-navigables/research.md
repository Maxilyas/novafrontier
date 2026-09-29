# Research: Socle de l'application : les 9 ecrans navigables et la scene

Recherche de la phase 0 du plan (`plan.md` de cette feature). Chaque point tranche une
inconnue du contexte technique. Les verifications ont ete faites le 2026-09-28 : registre
npm pour les versions, code source des paquets, essais dans Chromium 141 sans ecran
(conteneur de la session).

## R1. Versions et compatibilites

**Decision** : versions epinglees pour la phase P0 de la feuille de route.

| Outil | Version | Contrainte verifiee |
|---|---|---|
| Node | 22 LTS, >= 22.19 | Lighthouse 13 exige >= 22.19, Vitest 5 >= 22.12 ; la CI installe deja Node 22 |
| pnpm | 10.34.6 (`packageManager`) | derniere de la majeure 10, celle de la CI |
| TypeScript | 6.0.3 | `svelte-check` 4.7.6 accepte `^5 \|\| ^6`, pas la 7 |
| Vite | 8.3.1 | `plan.md` §7 |
| Svelte | 5.57.1 | `$props.id()` disponible (identifiants uniques) |
| @sveltejs/vite-plugin-svelte | 7.3.1 | pairs : vite `^8`, svelte `^5.46.4` |
| svelte-check | 4.7.6 | typecheck des composants |
| PixiJS | 8.21.0 | `plan.md` §7 demande 8.16 ou plus |
| Biome | 2.5.14 | version que `plan.md` §10 n'avait pas verifiee |
| Vitest | 5.0.2 | pair : vite `^8` |
| @playwright/test | 1.63.0 | Chromium installe par la CI |
| zod | 4.6.5 | schemas de `packages/data` (`plan.md` §7) |
| @fontsource/oswald, @fontsource/share-tech-mono | 5.3.0 | polices auto-hebergees |
| lighthouse | 13.5.0 | audit de SC-003 |

**Rationale** : TypeScript 7.0 (portage natif, derniere version publiee) n'expose pas l'API
JavaScript dont depend `svelte-check` ; une seule version de TypeScript pour tout le depot
evite deux verifications de types divergentes. pnpm 12 existe, mais la CI et les postes sont
en 10 : changer de majeure est un chantier `chore:` a part.

**Alternatives considered** : TypeScript 7 (incompatible avec `svelte-check`) ; TypeScript 7
pour les paquets et 6 pour l'application (deux compilateurs a maintenir) ; pnpm 12 (hors
sujet de cette feature) ; mode navigateur de Vitest pour les composants (Playwright couvre
deja l'interface, R15).

## R2. Organisation du depot et des paquets

**Decision** : sous-ensemble de l'arborescence de `plan.md` §8 : `apps/web`, `packages/data`,
`packages/sim`. Paquets `@nova/web`, `@nova/data`, `@nova/sim`. `apps/server` (phase P5 de la
feuille de route) et `packages/assets-src` (phase P3 de la feuille de route) ne sont pas crees. Les paquets `data` et
`sim` sont consommes en source TypeScript (`exports` vers `src/index.ts`), sans etape de
construction ; `tsconfig.base.json` porte le mode strict commun.

**Rationale** : aucun consommateur hors du depot en phase P0 de la feuille de route ; Vite et Vitest lisent le
TypeScript des paquets du workspace ; moins de scripts, moins de caches.

**Alternatives considered** : construire `data` et `sim` vers `dist/` (inutile avant le
serveur de la phase P5 de la feuille de route) ; references de projet TypeScript (`tsc -b`), plus lourdes pour trois
paquets.

## R3. Adresses des ecrans

**Decision** : routage par fragment d'URL (`#/escouades`, `#/atlas/s1`...), ecrit a la main en
Svelte 5 (runes) : lecture de `location.hash`, ecoute de `hashchange`, navigation par
affectation du fragment (une entree d'historique), adresse vide ou inconnue remplacee par
`#/escouades` sans entree d'historique. Contrat : `contracts/routes.md`.

**Rationale** : FR-006 (adresse propre, Precedent, rechargement) sans reecriture d'URL cote
serveur, donc compatible avec l'hebergement statique envisage en phase P5 de la feuille de route ; une soixantaine de
lignes, sans dependance dont la compatibilite avec Svelte 5 serait a surveiller.

**Alternatives considered** : API History avec chemins (`/escouades`), qui exige une regle de
repli vers `index.html` chez l'hebergeur ; bibliotheque de routage tierce ; SvelteKit, ecarte
par `plan.md` §7.

## R4. Montage des ecrans et transitions

**Decision** : seul l'ecran courant est monte ; le bandeau superieur reste monte. Fondu de
220 ms entre ecrans, comme la maquette, supprime quand le systeme demande de reduire les
animations (FR-035).

**Rationale** : au premier chargement, seul Escouades est construit (SC-003) ; la memoire ne
croit pas avec les ecrans visites (SC-009).

**Alternatives considered** : monter les 9 ecrans et basculer leur visibilite, comme la
maquette (demarrage plus lourd, 9 ecrans en memoire).

## R5. Mise en page fluide

**Decision** : chaque ecran est une grille CSS a zones nommees. Les colonnes laterales ont la
largeur de la maquette en `rem` (1 rem = 16 px, donc les mesures de la maquette a 1600x900) et
se resserrent par `clamp()` entre 1280 et 1600 px ; la zone centrale prend le reste. La racine
impose `min-width: 1280px` et `min-height: 720px` : en dessous, la page defile. Les listes
longues defilent dans leur panneau.

**Rationale** : FR-029 a FR-031 et `plan.md` §2 (grille fluide, `rem`/`clamp()`, plus de scene
fixe mise a l'echelle) ; a 1600x900, les mesures retombent sur celles de la maquette (SC-002).

**Alternatives considered** : garder la page de 1600x900 et la mettre a l'echelle
(`transform: scale`), que `plan.md` §2 abandonne ; unites proportionnelles a la fenetre (`vw`),
qui grossissent le texte comme une image (story 4, scenario 1).

## R6. Charte graphique

**Decision** : `src/styles/tokens.css` reprend tel quel le bloc `:root` de la maquette ;
`base.css` porte la remise a zero et la typographie ; `overlay.css` porte le voile de grain
(SVG `feTurbulence`, opacite 0,055, `mix-blend-mode: overlay`, `pointer-events: none`), fixe
au-dessus de toute la fenetre, scenes comprises (FR-009). Les primitives de la maquette
deviennent des composants de `src/ui/` (`plan.md` §8) ; les icones restent un sprite SVG de
`<symbol>` insere une fois.

**Rationale** : fidelite (FR-007, FR-008) ; `plan.md` §2 : un seul voile pour le DOM et le
canvas.

**Alternatives considered** : bibliotheque de composants tierce (charte a refaire) ; grain
dessine dans chaque scene (double voile, desynchronise de l'interface).

## R7. Illustrations generees

**Decision** : les generateurs de la maquette (`cmdArt`, `shipArt`, `mechArt`, `bldgSVG`,
`weaponGlyph`) deviennent des composants Svelte qui produisent du SVG en ligne. Chaque
identifiant de degrade est suffixe par `$props.id()`, ce qui supprime le melange de couleurs
signale par `plan.md` §11 (FR-010). Les SVG decoratifs portent `aria-hidden="true"`. La
pastille "ATLAS - N VISUELS EN CACHE" compte les visuels distincts deja rendus, via un
registre de cles.

**Rationale** : rendu synchrone, donc aucun rechargement visible au retour sur un ecran
(FR-010) ; aucune insertion de HTML brut. `$props.id()` compile sans avertissement (essai sur
Svelte 5.57.1).

**Alternatives considered** : chaines SVG inserees en HTML brut et mises en cache, comme la
maquette (identifiants dupliques, insertion de HTML brut que Biome signale) ; textures Pixi
mises en cache, qui relevent des visuels definitifs de la phase P3 de la feuille de route
(`plan.md` §4).

## R8. Donnees de jeu et etat de demonstration

**Decision** : `@nova/data` contient :

- les schemas zod des entites (`data-model.md`) et les types qui en derivent ;
- les donnees de jeu portees des constantes de la maquette : `RAR`, `WEP`, `MATRIX`, `POOL`,
  `TREES`, `BUILDINGS`, `PLANETS`, `CRATES`, `ENEMY` ;
- l'etat de demonstration : profil, ressources, cumul de revenus, composition des escouades,
  file de recherche, cible et selections par defaut ;
- les valeurs derivees de la maquette (R9).

Les schemas valident toutes les donnees dans les tests. L'application importe les donnees
deja typees, sans validation a l'execution. Le paquet est declare `"sideEffects": false`.

**Rationale** : FR-012 (source unique) ; principe IV de la constitution : les memes schemas
serviront l'API de la phase P5 de la feuille de route ; valider en test garde zod hors du chargement de l'ecran
Escouades (SC-003).

**Alternatives considered** : donnees dans `apps/web` (`plan.md` §8 les place dans
`packages/data`) ; validation a l'execution dans le navigateur (cout au demarrage pour des
donnees figees).

## R9. Valeurs calculees de la maquette

**Decision** : aucune formule de la maquette n'est portee en phase P0 de la feuille de route. Les valeurs que la
maquette calcule sont figees dans un fichier de donnees derivees de `@nova/data`. On y trouve
puissance, synthese et armement dominant de chaque escouade ; trajet, difficulte, butin et
vagues de Gemenon ; chances de victoire, contrainte, unites engagees par theatre ; etat
initial du combat. Un script de developpement genere ce fichier : Playwright charge la
maquette, bloque ses requetes externes, puis lit ses fonctions et son DOM pour chaque etat
atteignable (escouade x theatre). Un test oracle refait l'extraction et compare le resultat
au fichier (FR-013).

**Rationale** :
- Principe II : aucune regle hors de `packages/sim`, et les regles de la sim doivent etre en
  virgule fixe, sans `Math.hypot`. Porter maintenant les formules flottantes de la maquette
  serait a refaire en phase P1 de la feuille de route.
- `plan.md` : `packages/sim` sans regle en phase P0 de la feuille de route.
- La composition figee (Clarifications de la spec) rend l'ensemble des etats fini.
- Essai concluant : Playwright lit `power()` (Alpha : 2566), `winChance()` (38 %) et
  `wavesFor()` (Gemenon : 6 vagues) dans la maquette.

**Alternatives considered** : porter les formules dans `packages/sim` des maintenant (travail
refait en phase P1 de la feuille de route, et ecart a `plan.md`) ; les calculer dans l'interface (interdit par le
principe II) ; saisir les valeurs a la main (risque d'erreur, rien ne garantit l'egalite avec
la maquette).

## R10. Scene : moteur, modes de rendu, cycle de vie

**Decision** : `SceneHost.svelte` et `src/scene/renderer.ts` (`plan.md` §2 et §8). Contrat :
`contracts/scene-host.md`.

- **Chargement** : PixiJS est importe dynamiquement a la premiere ouverture d'un ecran a
  scene, jamais au demarrage (SC-003).
- **Instances** : une application Pixi par scene (Carte, Deploiement, Combat), creee a la
  premiere visite. Elle est conservee quand le joueur quitte l'ecran : animation arretee,
  canvas detache. Au retour, le canvas est rattache (FR-027, SC-009).
- **Preference** : `preference: ['webgpu', 'webgl']`, sous forme de tableau. Ordre par defaut
  de Pixi 8.21 : `webgl`, `webgpu`, `canvas`. Une preference en simple chaine y ajoute le
  rendu Canvas 2D experimental. Avec le tableau, Pixi leve "No available renderer" quand
  aucun des deux n'est disponible : c'est le mode indisponible (FR-024).
- **Mode** : lu dans `renderer.type` (WebGPU ou WebGL, avec la version du contexte WebGL).
- **Taille et densite** : `resolution` vaut min(densite de l'ecran, 2) (`plan.md` §2 et §5),
  avec `autoDensity`. Le `resizeTo` de Pixi n'ecoute que le redimensionnement de la fenetre ;
  on utilise donc un `ResizeObserver` sur la zone et une ecoute `matchMedia` de la densite,
  qui appellent `renderer.resize()` (FR-026).
- **Perte du contexte** : Pixi traite deja la perte du contexte WebGL (restauration
  automatique) et celle du peripherique WebGPU (recreation). La zone passe en mode "perdu",
  puis affiche le message si rien n'est retabli en 3 s (FR-024).
- **Arrets** : animation arretee quand l'onglet est masque ; une seule image fixe si le
  systeme demande de reduire les animations (FR-035).
- **Polices** : `document.fonts.ready` est attendu avant l'initialisation (`plan.md` §2).
- **Contenu provisoire** : degrade du fond de la maquette et environ 300 etoiles placees par
  un generateur pseudo-aleatoire a graine, qui derivent lentement (FR-022).
- **Sans multi-echantillonnage** (`antialias: false`) : le fond provisoire n'a aucun bord a
  lisser. Mesure dans Chromium sans ecran (rendu logiciel, comme en CI) : la Carte en plein
  ecran passe de 15 a 21 images par seconde, le Deploiement de 27 a 41. Les scenes des phases
  P1 et P2 de la feuille de route reconsidereront ce choix.

Essais dans Chromium 141 sans ecran, page servie en `localhost` (WebGPU exige un contexte
securise) :

| Lancement | WebGPU | WebGL | Pixi 8.21 |
|---|---|---|---|
| par defaut | pas d'adaptateur | WebGL2 (SwiftShader) | `webgl2`, image correcte, resolution 2 |
| `--enable-unsafe-webgpu` | adaptateur SwiftShader | WebGL2 | `webgpu` choisi, mais aucune image lisible |
| `--disable-gpu --disable-software-rasterizer` | non | non | erreur "No available renderer" |

**Rationale** : FR-020 a FR-028 ; `plan.md` §2 ("un canvas Pixi par scene"). Garder les
instances evite de recreer un peripherique a chaque visite, donc aucune latence au retour et
aucune accumulation.

**Alternatives considered** : un seul moteur de rendu dont le canvas passe d'un ecran a
l'autre (contraire a la lettre de `plan.md` §2, pour un gain marginal) ; detruire et recreer a
chaque visite (latence, fuites possibles) ; repli Canvas 2D de Pixi (experimental, et la spec
veut un message).

## R11. Diagnostic du mode de rendu

**Decision** : chaque zone de scene porte `data-render-mode` (`initialisation`, `webgpu`,
`webgl2`, `webgl1`, `perdu`, `indisponible`). Avec `?diag=1` dans l'adresse, un badge discret
affiche le mode, la cadence d'images et la duree du dernier changement d'ecran. `?rendu=webgl`
force le rendu de repli, pour la matrice manuelle dans Chrome et Edge : sur Chromium 141, ni
`--disable-features=WebGPU` ni `--disable-webgpu` ne coupe WebGPU. Contrat :
`contracts/scene-host.md`.

**Rationale** : FR-028 (identifiable par l'equipe, invisible pour le joueur) ; les tests lisent
l'attribut ; le badge sert aux mesures manuelles de SC-004, SC-005 et SC-009.

**Alternatives considered** : journal de la console seul (peu pratique pour un testeur) ;
indicateur toujours visible (encombre l'interface).

## R12. Commandes d'une phase ulterieure

**Decision** : ce sont de vrais boutons, qui gardent l'apparence de la maquette et portent
`data-later-phase`. Leur action unique affiche le message bref "Pas encore disponible" pendant
2,6 s, comme le message de la maquette, sans toucher a aucun etat. Inventaire :
`contracts/ui-testing.md`.

**Rationale** : Clarifications de la spec (reponse A a la question 2) ; SC-012 se verifie en
activant chaque element `data-later-phase`.

**Alternatives considered** : commandes grisees, masquees ou simulees, toutes ecartees en
clarification.

## R13. Polices auto-hebergees

**Decision** : `@fontsource/oswald` (graisses 300, 400, 500 et 600) et
`@fontsource/share-tech-mono` (400), importes en CSS. Les fichiers WOFF2 sont decoupes par
jeux de caracteres (`unicode-range`) et affiches en `font-display: swap`. Vite les embarque
dans le build. Les fichiers latins 400 des deux polices sont precharges depuis `index.html`.
Les polices de repli de la maquette (`Arial Narrow`, `Courier New`) sont conservees.

**Rationale** : FR-032 et FR-033 ; `plan.md` §2 et §11 : plus de Google Fonts, pour la
performance et le RGPD. Le latin couvre le francais : accents, oe lie, signe multiplie.

**Alternatives considered** : Google Fonts (tiers, interdit par FR-033) ; fichiers copies a la
main dans le depot (mises a jour manuelles). A verifier a l'implementation : que Vite remplace
bien les liens de prechargement par les fichiers produits ; sinon, les deux WOFF2 precharges
sont copies dans `src/assets/fonts/`.

## R14. Lint, format et verification des types

**Decision** : Biome 2.5 lint et formate TS, JS, JSON, CSS et Svelte, avec l'option
`html.experimentalFullSupportEnabled: true`. `svelte-check --fail-on-warnings` verifie les
composants : ses avertissements d'accessibilite deviennent bloquants. `tsc --noEmit` verifie
`data` et `sim`. Chaque paquet expose `lint`, `typecheck`, `test` et, pour l'application,
`build` : ce sont les commandes de `CLAUDE.md` et de la CI.

**Rationale** : essai sur un composant Svelte 5 :
- sans l'option, Biome ne lit que le `<script>` et signale a tort comme inutilisees les
  variables employees dans le gabarit ;
- avec l'option, il analyse le gabarit et y applique ses regles d'accessibilite
  (`useButtonType`, `noSvgWithoutTitle`) ;
- Svelte 5.57 signale un `div` cliquable (`a11y_click_events_have_key_events`), ce qui sert
  SC-013.

**Alternatives considered** : Biome sans l'option, avec des exceptions pour les fichiers Svelte
(faux positifs) ; ESLint et Prettier pour Svelte (`plan.md` §7 retient Biome).

## R15. Strategie de test et CI

**Decision** :

- **Vitest**, dans l'environnement Node, pour chaque paquet :
  - `data` : validation de toutes les donnees par les schemas et invariants de reference ;
  - `sim` : garde-fou de purete du principe II. Recherche de `Math.random`, `Math.sin`,
    `Math.cos`, `Math.atan2`, `Math.hypot`, `Date.now`, `performance.now` et des objets du DOM
    dans le code, et configuration TypeScript sans la bibliotheque DOM ;
  - `web` : routeur, correspondance section-entree, correspondance type de rendu-mode, absence
    de donnees de jeu en dur dans `apps/web/src` (SC-011).
- **Playwright** contre le build servi par `vite preview` :
  - trois projets Chromium : `repli` (par defaut), `webgpu` (`--enable-unsafe-webgpu`) et
    `sans-gpu` (`--disable-gpu --disable-software-rasterizer`) ;
  - parcours (SC-001), consultations (story 2), commandes d'une phase ulterieure (SC-012),
    tailles de fenetre (SC-007), modes de rendu et taille du canvas (SC-005, SC-006, SC-008),
    cycle de vie (SC-009), requetes (SC-010), clavier (SC-013), oracle de la maquette
    (FR-013) ;
  - en projet `webgpu`, les tests verifient le choix du mode, pas l'image, que Chromium sans
    ecran ne restitue pas (R10). L'image WebGPU se verifie a la main sur les quatre
    navigateurs (`quickstart.md`).
- **Captures** : `pnpm --filter @nova/web captures` produit, pour les 9 ecrans a 1600x900,
  l'application et la maquette cote a cote, pour la validation de SC-002 par l'equipe.
- **Performance** : `pnpm --filter @nova/web perf` lance Lighthouse 13 (profil ordinateur,
  performance seule) sur `#/escouades` et echoue sous 0,90 (SC-003).
- **CI** (`tests.yml`) :
  - le garde-fou "pas de package.json" disparait (piege 4 de `WORKFLOW.md`) ;
  - pnpm est lu dans `packageManager` : l'entree `version: 10` est retiree, car
    `pnpm/action-setup` refuse deux versions differentes ;
  - apres le build : installation de Chromium, tests Playwright, audit Lighthouse.
- **Dans le conteneur Claude Code**, la variable `PW_CHROMIUM_EXECUTABLE` pointe vers le
  Chromium preinstalle. La configuration Playwright la lit ; la CI ne la definit pas.

**Rationale** : chaque critere de succes a une verification (principe V et table du plan) ;
les trois modes de rendu sont reproductibles automatiquement (R10).

**Alternatives considered** : tests de composants dans jsdom (ne voit ni la mise en page ni le
rendu) ; captures de reference comparees au pixel pres dans la CI (les captures dependent du
systeme et de la revision de Chromium ; a introduire une fois la fidelite validee) ;
`@lhci/cli` (sans nouvelle version depuis 2025, alors que la CLI de Lighthouse suffit).

## R16. Clavier et acces a l'Atlas

**Decision** : tout element cliquable est un `<button>` : cartes, onglets, noeuds, batiments,
lignes d'unites, appels a l'action des coffres. Le focus visible est celui de la maquette.
Sur l'ecran Escouades, chaque carte d'unite porte un bouton "Fiche" qui mene a
`#/atlas/<unite>`. Il apparait au survol et au focus, pour que la capture au repos reste celle
de la maquette (FR-004).

**Rationale** : SC-013 ; la commande qui ouvre l'Atlas est distincte de celle qui compose
l'escouade (FR-004), laquelle affiche le message bref (FR-018).

**Alternatives considered** : une entree "Atlas" dans la navigation principale (s'ecarte des
cinq entrees de la maquette) ; un clic long ou un clic droit sur la carte (peu decouvrable,
inaccessible au clavier).

## R17. Documents de reference a mettre a jour dans la meme PR

**Decision** :

- **Des ce plan** :
  - `plan.md` §2 : hauteur minimale de 720 px et routage par fragment ;
  - `plan.md`, "Etape suivante", et `WORKFLOW.md` §5 : contenu de `packages/data` et
    `packages/sim` en phase P0 de la feuille de route.
- **A l'implementation** :
  - `plan.md` §10 : versions installees ;
  - `WORKFLOW.md` §1 : etat du depot ;
  - `WORKFLOW.md`, piege 4 : garde-fou de `tests.yml` retire ;
  - `tests.yml` lui-meme.

**Rationale** : principe I de la constitution. `WORKFLOW.md` ne doit pas contredire
`plan.md`.

**Alternatives considered** : aucune ; la constitution l'impose.
