# Contrat : adresses des ecrans et navigation

Couvre FR-001 a FR-006, la story 1 et SC-001 (`research.md` R3).

## Format

`#/<ecran>[/<parametre>]`, dans le fragment de l'adresse. Le parametre `?diag=1`, place avant le
fragment (`/?diag=1#/carte`), active le badge de diagnostic (`contracts/scene-host.md`).

| Ecran | Adresse | Parametre | Entree mise en evidence | Atteint depuis |
|---|---|---|---|---|
| Escouades | `#/escouades` | - | Escouades | ouverture de l'application ; navigation principale |
| Atlas | `#/atlas/<unite>` | id d'unite (`s1` si absent) | Escouades | bouton "Fiche" d'une carte d'unite d'Escouades |
| Base | `#/base` | - | Base | navigation principale |
| Recherche | `#/recherche` | - | Recherche | navigation principale |
| Carte | `#/carte` | - | Carte | navigation principale |
| Briefing | `#/briefing` | - | Carte | Carte : "Preparer l'assaut", "Espionner", operation proposee |
| Deploiement | `#/deploiement` | - | Carte | Briefing : "Passer au deploiement" |
| Combat | `#/combat` | - | Carte | Deploiement : "Lancer le combat" |
| Butin | `#/butin` | - | Butin | navigation principale |

## Regles

1. **Adresse vide ou inconnue** : remplacee par `#/escouades`, sans nouvelle entree
   d'historique.
2. **Unite inconnue** (`#/atlas/zz`) : remplacee par `#/atlas/s1`, sans nouvelle entree.
3. **Navigation** : chaque changement d'ecran ajoute une entree d'historique ; naviguer vers
   l'adresse courante n'en ajoute pas. Precedent et Suivant du navigateur rejouent l'historique.
4. **Rechargement ou ouverture directe** : l'ecran de l'adresse s'affiche avec l'etat de
   demonstration par defaut (FR-014). Briefing, Deploiement et Combat s'ouvrent pour l'escouade
   Alpha, la cible Gemenon et le theatre spatial.
5. **Contexte de mission** : l'escouade, le theatre et la formation choisis restent en memoire
   pendant la session, sans figurer dans l'adresse. Ils sont perdus au rechargement.
6. **Navigation principale** : `<nav aria-label="Navigation principale">`, cinq liens
   `<a href="#/...">` dans l'ordre de la maquette. Le lien de la section courante porte
   `aria-current="page"` et le style `on` de la maquette.
7. **Commandes de parcours** : "Preparer l'assaut", "Espionner" (Carte), l'operation proposee,
   "Passer au deploiement" et "Lancer le combat" sont des liens vers l'adresse cible, avec
   l'apparence des boutons de la maquette. "Lancer le combat" est inactif quand l'escouade
   n'engage aucune unite (FR-019).
8. **Changement d'ecran** : seul l'ecran courant est monte, avec un fondu de 220 ms, supprime
   quand les animations sont reduites. Le changement doit etre termine en moins de 300 ms
   (SC-004).
