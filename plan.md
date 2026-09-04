# NOVA FRONTIER — Technologies de rendu et plan de mise en place

## Contexte

- La maquette `C:\Users\antoi\Downloads\nova-frontier-v2.html` (2 509 lignes, 9 écrans) est 100 % procédurale : UI en DOM/CSS, illustrations d'unités en SVG généré, scènes (carte, déploiement, combat) en Canvas 2D. Aucun bitmap, aucun asset externe (2 polices Google), aucune persistance, aucun backend. Scène fixe 1600×900 mise à l'échelle par `transform: scale()`, sans tactile ni media query.
- Le dépôt `F:\Github\novafrontier` est vide (README d'une ligne, branche `dev`).
- Choix de l'équipe (réponses du 4 sept. 2026) : **2D stylisée haut de gamme**, **desktop d'abord puis mobile**, **framework UI à définir (je tranche)**, **PvE solo + backend Node/TS**.
- Objectif : le meilleur rendu graphique possible en navigateur pour ce jeu, avec une pile tenable pour une petite équipe. Sur validation, la première étape concrète est la phase P0 (socle du dépôt).

## 1. Diagnostic : où est le levier graphique

- 7 écrans sur 9 sont de l'interface (panneaux, cartes, arbres, listes). Leur qualité visuelle dépend du design system CSS, déjà très abouti dans la maquette (coins coupés, phosphore, grain, or réservé au légendaire), et des illustrations (portraits, vaisseaux, mécas). Aucun moteur n'améliore ces écrans : il faut les garder en DOM/CSS.
- 3 écrans sont des scènes temps réel (carte galactique, déploiement, combat) plus la base en fausse iso. C'est là que le Canvas 2D plafonne : pas de bloom, pas de particules, fond redessiné à chaque frame, filtres impossibles à bon coût. Un renderer GPU (WebGL2/WebGPU) apporte bloom, particules, shaders de planètes et nébuleuses, 60 fps stables.
- Le levier n° 1 est donc les assets (sprites modulaires, portraits peints), le n° 2 le post-traitement et le « juice » (bloom, particules, shake, flash), le n° 3 la stabilité (60 fps, DPR, chargement). Le moteur 3D n'apporte rien à la branche 2D retenue.

## 2. Architecture recommandée : hybride DOM + GPU

| Couche | Technologie | Rôle |
|---|---|---|
| UI | **Svelte 5 + TypeScript** (SPA Vite 8) | Tous les panneaux, cartes, arbres, HUD. Design system porté depuis le CSS de la maquette. |
| Scènes | **PixiJS v8** (WebGPU, repli WebGL2 automatique) + pixi-filters + ParticleContainer | Carte, déploiement, combat, base (iso) ; effets et particules. |
| Simulation | `packages/sim` en TS pur, déterministe, sans DOM | Règles de combat, vagues, dégâts, compétences, résolution hors ligne. Même code côté client et serveur. |
| Données | `packages/data` (TS/JSON typés + schémas zod) | Unités, armes, matrice, arbres, planètes, coffres. |
| Serveur | Node LTS + Fastify + PostgreSQL (Drizzle) + Redis si besoin | Comptes, économie, timers, gacha, validation des combats. |

Pourquoi Svelte 5 plutôt que React (l'équipe n'a pas de préférence) :
- Le portage de la maquette est quasi direct : HTML natif, CSS scopé intégré, pas de JSX ni de `className`, les classes `.panel .notched .btn .bar .card .pill .seg` se conservent telles quelles.
- Réactivité fine (runes `$state`/`$derived`) : le HUD de combat se met à jour sans VDOM ni mémoïsation, ce qui compte pour des valeurs qui changent à chaque tick.
- Bundle nettement plus léger, utile pour la phase mobile. Transitions intégrées (`fade`, `fly`, `scale`, `crossfade`) pour les animations d'écran et de panneaux.
- Alternative acceptable : React 19, si le recrutement React devient prioritaire. L'architecture isole l'UI de la scène et de la sim, donc le choix reste réversible à faible coût.

Assemblage :
- Un composant `SceneHost.svelte` monte un `<canvas>` Pixi par scène ; le HUD est du DOM positionné par-dessus (`pointer-events` ciblés). Un seul overlay CSS fixe (grain + vignette, `pointer-events:none`) couvre DOM et canvas.
- État : modules `.svelte.ts` avec runes. La scène Pixi lit un instantané de la sim à chaque frame (interpolation entre deux ticks) et émet des événements (tir, impact, mort, compétence) vers les effets et le journal.
- Résolution : `resolution` = min(devicePixelRatio, 2) sur desktop, 1,5 sur mobile ; `autoDensity`, `ResizeObserver`.
- Polices : Oswald et Share Tech Mono auto-hébergées en WOFF2 (préchargées, `document.fonts.ready` avant l'init Pixi). Texte dans la scène en `BitmapText` MSDF généré depuis les mêmes polices ; tout le reste en DOM.
- Responsive : abandon du stage 1600×900 scalé. Grille CSS fluide (`grid-template-areas`), scène en `flex:1`, unités `rem`/`clamp()`, largeur mini 1280 px sur desktop. Sur mobile (P6), les panneaux latéraux deviennent des tiroirs et onglets.

## 3. Comparatif des candidats pour la couche scène

| Candidat | Pour | Contre | Verdict pour Nova Frontier |
|---|---|---|---|
| **PixiJS v8** (8.16) | Renderer 2D le plus rapide du web, WebGPU + repli WebGL2 auto, filtres prêts (bloom, CRT, glitch, RGB split, shockwave, godray), `ParticleContainer` très performant, `MeshRope` pour les traînées, AssetPack pour le pipeline d'assets, coexiste naturellement avec un HUD DOM. | Pas de 3D ; pas d'éditeur de scène (le code est l'éditeur). | **Retenu.** Couvre exactement les besoins de la branche 2D. |
| Three.js (WebGPURenderer stable depuis r171, r184 en mars 2026) | 3D complète, TSL (shaders compilés WGSL/GLSL), post-traitement riche, compute shaders. | Surcoût inutile en 2D pure (caméra, matériaux, éclairage) ; le 2D sprite n'est pas son cœur. | À garder pour une évolution 3D éventuelle des combats orbitaux ; pas maintenant. |
| Babylon.js (9.2, avril 2026) | Moteur 3D complet, WebGPU natif, inspecteur intégré. | Même remarque que Three.js, API plus lourde. | Non. |
| PlayCanvas (2.21) | Éditeur web collaboratif, 3D, WebGPU complet. | Éditeur hébergé et modèle de licence pour les projets privés, orienté 3D. | Non. |
| Phaser 4 (4.1.0, avril 2026) | Framework 2D complet (scènes, input, tweens, particules, physique), nouveau renderer WebGL2. | Pas de WebGPU ; framework « tout inclus » qui pousse à mettre l'UI dans le canvas, ce qui ferait perdre le design system CSS ; moins de contrôle bas niveau que Pixi. | Non : trop de recouvrement avec ce que Svelte et la sim font déjà mieux. |
| Godot 4.6/4.7 export web | Éditeur complet, 2D et 3D. | Export web limité au renderer Compatibility (WebGL2) d'après la documentation officielle (des sources tierces évoquent un WebGPU expérimental en 4.6, non confirmé) ; bundles WASM lourds ; en-têtes COOP/COEP pour SharedArrayBuffer ; mobile navigateur fragile ; toute l'UI serait à refaire dans Godot. | Non pour un jeu de gestion à UI dense en navigateur. |
| Unity 6 Web | Outillage industriel. | Poids de téléchargement, temps de chargement, mobile navigateur médiocre, licence. | Non. |

Support WebGPU constaté (sept. 2026) : Chrome/Edge 113+ (Android 121+), Firefox 141 Windows et 145 macOS (Linux et Android annoncés pour 2026), Safari 26 sur macOS/iOS 26. Le repli WebGL2 reste obligatoire (Linux, Android Firefox, iOS antérieurs) ; Pixi le gère seul.

## 4. Pipeline d'assets (branche 2D)

- **Guide de style** à écrire en premier (1 page) : silhouettes lisibles en top-down, contour phosphore, ombrage plat « militaire usé », or uniquement légendaire/critique, palette de la maquette.
- **Unités modulaires par calques**, pour respecter « même silhouette sur 4 paliers » et la combinatoire silhouette × palier × arme × rareté :
  - 6 coques de vaisseaux + 5 châssis de mécas (calque de base), 5 calques d'arme (bouche/canons), calques additifs T2 canons, T3 structures, T4 escorte. Environ 30 textures au lieu de 120 combinaisons.
  - La rareté est une teinte (`tint`) et un halo, jamais une texture dupliquée.
  - Composition à l'exécution dans un `Container` Pixi, puis rendu en `RenderTexture` mise en cache (équivalent du cache `ATLAS` de la maquette) pour alimenter les cartes DOM via `<img>`.
- **Sprites de combat** top-down 96 à 192 px (vue orbitale et terrestre), 3 gabarits ennemis + boss, propulseurs et impacts en particules.
- **Portraits de commandants** : illustrations 2:3 (600×900 @2x), en DOM avec `srcset` WebP/AVIF.
- **Planètes, nébuleuses, champ d'étoiles** : shaders procéduraux (bruit FBM, terminateur, halo atmosphérique, rotation lente) plutôt que des images. Meilleur rendu, poids nul, zoom sans pixellisation.
- **Atlas et compression** : PixiJS AssetPack (texture packer, variantes @1x/@2x, WebP/AVIF, KTX2/Basis optionnel, manifeste chargé par `Assets.init`). Chargement par écran (bundles) avec écran de transition.
- **Animation** : tweens (ticker Pixi + `@tweenjs/tween.js` ou GSAP) pour idle, hover, recul de tir. Spine (runtime `@esotericsoftware/spine-pixi-v8`) seulement si l'on veut des commandants animés (licence éditeur payante).
- **Icônes** : conserver le sprite SVG `<symbol>` en DOM ; versions raster dans l'atlas pour la scène.
- **Polices** : WOFF2 auto-hébergées ; police bitmap MSDF pour les chiffres du HUD dans la scène.

## 5. Effets pour le style rétro-tech

| Effet | Où | Coût |
|---|---|---|
| Coins coupés, bordures, glow des boutons et cartes, cadres de rareté | CSS existant | nul |
| Grain + vignette globaux | un overlay CSS fixe (SVG `feTurbulence`, `mix-blend-mode`) sur DOM et canvas | nul |
| Scanlines des hologrammes | CSS `repeating-linear-gradient` | nul |
| Transitions d'écran, compteurs animés, barres | transitions Svelte + tween | faible |
| Bloom sélectif (lasers, propulseurs, relique, boss) | calque « émissif » rendu à demi-résolution + `AdvancedBloomFilter`, composé en `add` | moyen (1 passe) |
| CRT léger sur la scène (lignes, bruit, vignette) | `CRTFilter` (courbure 0) ou shader maison combiné avec le grain pour une seule passe | moyen |
| Aberration chromatique, glitch | `RGBSplitFilter` / `GlitchFilter` 100 à 200 ms sur critique, ultime, relique touchée | faible |
| Ondes de choc | `ShockwaveFilter` ou anneau sprite scale/alpha | faible |
| Explosions, débris, étincelles, propulseurs | `ParticleContainer` v8 + `@spd789562/particle-emitter`, un seul atlas | faible jusqu'à ~5 000 particules |
| Traînées de projectiles et missiles | `MeshRope` sur l'historique de positions, ou sprite étiré avec fondu | faible |
| Flash d'impact | `tint` blanc sur 2 frames | nul |
| Tremblement d'écran | décalage du container monde avec décroissance quadratique | nul |
| Contour glow par rareté dans la scène | sprite de halo pré-rendu derrière l'unité (éviter `GlowFilter` par objet) | nul |
| Planètes, nébuleuses, hologrammes | shaders (`Filter` / `Mesh` avec `GlProgram` + `GpuProgram`) | faible à moyen |

Budget : mobile milieu de gamme = 2 passes plein écran maximum (bloom demi-résolution + CRT/grain), DPR ≤ 1,5, ≤ 2 000 particules, ≤ 60 entités, cible 60 fps. Desktop : DPR 2, bloom pleine résolution. Réglage « effets réduits » exposé dans les options et respect de `prefers-reduced-motion`.

## 6. Simulation partagée (`packages/sim`)

Remplace la duplication actuelle entre `combatLoop` (rendu temps réel) et `autoResolve` (comparaison de puissance).

- Pas fixe de 50 ms (20 ticks/s) ; le renderer interpole à 60 fps ou plus.
- Déterminisme garanti entre V8 (Chrome, Node) et JavaScriptCore (Safari) : RNG seedé (`xoshiro128**` ou `mulberry32`), positions et distances en virgule fixe 16.16, angles en 1/1024 de tour avec tables sinus/cosinus, aucun appel à `Math.sin/cos/atan2/hypot` dans la sim.
- Entrées : `seed`, escouade, formation, théâtre, vagues (issues de `packages/data`), journal de commandes `{tick, action}` du joueur.
- Sorties : état par tick (positions, PV, cooldowns) et événements typés : `wave`, `spawn`, `shot`, `hit`, `death`, `skill`, `objective`, `end`. Le renderer consomme les événements pour les effets, le HUD lit l'état.
- Résolution hors ligne = même sim exécutée sans renderer côté serveur (ou estimation rapide par puissance, puis sim complète pour le résultat définitif).
- Validation anti-triche : le serveur fournit le seed, le client renvoie le journal de commandes et le hash de l'état final, le serveur rejoue et compare. Coût serveur : ~1 200 ticks pour 60 entités, quelques millisecondes.
- Tests Vitest : même seed → même hash ; replays dorés versionnés ; propriétés (jamais de NaN, PV bornés) ; test de performance (1 000 ticks sous un seuil).

## 7. Pile complète

| Domaine | Choix | Notes |
|---|---|---|
| Langage | TypeScript strict partout | types partagés client/serveur/sim |
| Build | Vite 8 (Rolldown) | SPA sans SSR ; SvelteKit inutile ici |
| UI | Svelte 5 | runes, transitions ; CSS variables de la maquette dans `tokens.css` |
| Scène | PixiJS 8.16+, pixi-filters, `@spd789562/particle-emitter` | WebGPU auto, repli WebGL2 |
| Assets | PixiJS AssetPack | atlas, compression, manifeste |
| Serveur | Node LTS, Fastify, Drizzle ORM, PostgreSQL | REST + JSON ; pas de WebSocket (PvE solo, sim déterministe validée) |
| Files et timers | calcul paresseux à partir des horodatages (revenu accumulé, plafond 7 jours, file de recherche) ; Redis + BullMQ seulement si des tâches planifiées deviennent nécessaires | évite un scheduler dès le départ |
| Auth | sessions cookie `httpOnly` (better-auth ou implémentation maison) | à préciser en P5 |
| Validation | zod (schémas dans `packages/data`) | mêmes schémas pour l'API et les données de jeu |
| Qualité | Biome (lint/format), Vitest, Playwright, GitHub Actions | captures d'écran de régression sur les 9 écrans |
| Mobile (P6) | PWA (manifest, service worker) puis Capacitor si passage sur les stores | même code |
| Hébergement | statique (CDN) pour le client, conteneur Node pour l'API, Postgres managé | à décider en P5 |

## 8. Structure du dépôt cible

```
novafrontier/
  package.json  pnpm-workspace.yaml  tsconfig.base.json  biome.json  .github/workflows/ci.yml
  apps/
    web/                       Vite 8 + Svelte 5 + TS (SPA)
      src/app/                 écrans : Escouades, Atlas, Base, Recherche, Carte, Briefing, Deploiement, Combat, Butin
      src/ui/                  design system : Panel, Notched, Btn, Bar, Card, Pill, Seg, Modal, Toast, Stars
      src/scene/               Pixi : SceneHost.svelte, renderer.ts, scenes/{map,deploy,combat,base}, fx/{bloom,crt,particles,shake}
      src/state/               stores runes (.svelte.ts) : player, squads, research, map, mission, combat
      src/styles/              tokens.css (variables de la maquette), base.css, overlay.css (grain, vignette)
      public/assets/           sorties d'AssetPack (généré)
    server/                    Fastify + TS
      src/routes/              auth, player, squads, research, base, map, missions, crates
      src/domain/              economy, timers, gacha (pitié), combat-validation (re-sim)
      src/db/                  schéma Drizzle + migrations
  packages/
    sim/                       simulation déterministe + tests + replays dorés
    data/                      données de jeu typées + schémas zod
    assets-src/                sources d'art + assetpack.config.ts → apps/web/public/assets
```

Réutilisation depuis la maquette : les constantes `RAR`, `WEP`, `MATRIX`, `POOL`, `SQUADS`, `TREES`, `BUILDINGS`, `PLANETS`, `CRATES` deviennent `packages/data` ; les formules `dmg`, `modOf`, `wavesFor`, `diffOf`, `lootOf`, `fuelOf`, `power`, `winChance` deviennent `packages/sim` ; le bloc `:root` et les primitives CSS (lignes 17-146 de la maquette) deviennent `tokens.css` et les composants `src/ui`.

## 9. Feuille de route et vérification

| Phase | Contenu | Vérification |
|---|---|---|
| **P0 Socle** (1 à 2 sem.) | Monorepo pnpm, Vite + Svelte + TS, Biome, CI. Portage de `tokens.css` et des primitives. Layout responsive, navigation entre les 9 écrans alimentés par `packages/data`. `SceneHost` Pixi (détection WebGPU/WebGL2, DPR, resize). | `pnpm build` et CI verts ; les 9 écrans rendus en composants ; captures Playwright comparées à la maquette ; Lighthouse performance > 90 sur l'écran Escouades. |
| **P1 Sim + combat** (2 à 3 sem.) | `packages/sim` (règles portées de `combatLoop`, vagues, compétences, sans rendu) et tests. Scène combat Pixi avec placeholders vectoriels (`Graphics`) et HUD DOM branché sur le store. | Même seed → même hash sur Chrome, Firefox, Safari et Node ; 60 fps avec 60 entités (overlay de stats) ; un replay se rejoue à l'identique. |
| **P2 Carte, déploiement, base** | Champ d'étoiles parallaxe et planètes en shader, routes, pan/zoom fluides (molette, pincement), plateau de déploiement en drag & drop (Pointer Events), base en iso Pixi ou DOM/SVG conservé. | Pan/zoom à 60 fps ; interactions tactiles vérifiées sur tablette ; aucune régression des tests P1. |
| **P3 Assets définitifs** | Guide de style, calques modulaires, atlas AssetPack, portraits, sprites de combat, polices MSDF. Remplacement des placeholders. | Premier écran < 5 Mo transférés ; chargement progressif par écran ; comparaison visuelle avant/après validée par l'équipe. |
| **P4 Post-traitement et juice** | Bloom, CRT, particules, traînées, shake, flash, transitions Svelte, option « effets réduits ». | Budget tenu sur un Android milieu de gamme (Chrome) et un iPhone (Safari 26) : 60 fps en combat, profil GPU ; `prefers-reduced-motion` respecté. |
| **P5 Backend** (parallélisable dès P1) | Fastify, Postgres, auth, économie et timers, gacha serveur avec pitié, validation des combats par re-simulation, résolution hors ligne. | Tests d'intégration ; un journal de commandes falsifié est rejeté ; taux et pitié conformes sur 10 000 tirages simulés ; revenu plafonné à 7 jours. |
| **P6 Mobile** | Layouts tactiles (tiroirs, onglets), PWA, Capacitor si stores. | Audit PWA ; parcours complet sur 3 appareils ; 60 fps en combat avec DPR 1,5. |

## 10. Versions constatées (WebSearch, 4 sept. 2026)

| Bibliothèque | Constat | Source |
|---|---|---|
| PixiJS | v8.16.0 (renderer Canvas expérimental, texte balisé) ; WebGPU avec repli WebGL | pixijs.com/blog/8.16.0 |
| Three.js | WebGPURenderer stable depuis r171 (sept. 2025), r184 en mars 2026 | utsubo.com (bilan 2026) |
| Phaser | 4.1.0 stable le 30 avril 2026, WebGL2, pas de WebGPU | phaser.io/news, gamefromscratch.com |
| Godot | 4.6 : WebGPU web expérimental ; 4.7 (juin 2026) : export wasm64 ; renderer Compatibility par défaut | docs.godotengine.org, cinevva.com |
| Vite | 8.0 stable le 12 mars 2026 (Rolldown) | vite.dev/blog/announcing-vite8 |
| Svelte | 5.5x en 2026 (stable depuis oct. 2024) | pkgpulse.com, nitorinfotech.com |
| WebGPU | Chrome 113+, Firefox 141/145, Safari 26 | gpuweb wiki, web.dev, developer.chrome.com |
| pixi-filters, AssetPack, `@spd789562/particle-emitter` | disponibles pour Pixi v8 (particle-emitter exige pixi.js ≥ 8.5) | github.com/pixijs/filters, pixijs.io/assetpack, npm |
| Fastify | 5.12.x (v5 reste la version majeure courante) | npmjs.com/package/fastify |
| Drizzle ORM | v1 stable (sortie mi-2025) | orm.drizzle.team |
| better-auth | 1.7.x, maintenance active | npmjs.com/package/better-auth |
| Babylon.js | 9.2.x (avril 2026), WebGPU natif | github.com/BabylonJS/Babylon.js/releases |
| PlayCanvas | 2.21.x, WebGPU complet | npmjs.com/package/playcanvas |

Non vérifié aujourd'hui : version exacte de Biome et des runtimes Spine pour Pixi v8. À contrôler au moment de l'installation (P0/P3).

## 11. Risques et points d'attention

- **Déterminisme** : c'est la contrainte qui structure la sim ; toute fonction flottante non contrôlée casse la validation serveur. Tests multi-navigateurs dès P1.
- **Filtres plein écran sur mobile** : chaque passe coûte cher ; ne jamais empiler plus de deux passes, mesurer sur appareil réel, pas dans l'émulateur.
- **Polices dans le canvas** : sans MSDF ni attente de `document.fonts.ready`, les textes de la scène s'affichent en police de secours au premier rendu.
- **IDs SVG dupliqués** de la maquette (`cg0`, `bm`, `bd`) : à corriger lors du portage des illustrations, sinon les dégradés se mélangent entre cartes.
- **Pager de maquette** (`#pager`) et notes : outils de démo, à ne pas porter.
- **Google Fonts** : à remplacer par des fichiers auto-hébergés (performance, RGPD).

## Étape suivante sur validation

Mettre en place la phase P0 dans `F:\Github\novafrontier` (branche `dev`) : monorepo, application web Svelte 5 + Vite 8, portage des tokens et primitives CSS de la maquette, `packages/data` et `packages/sim` vides mais typés, `SceneHost` Pixi avec détection WebGPU/WebGL2, CI. Aucun asset définitif ni backend à ce stade.