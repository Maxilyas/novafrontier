# Contrat : paquet `@nova/data`

Source unique des donnees affichees (FR-012, FR-013 ; `research.md` R8 et R9). Les entites sont
decrites dans `data-model.md`.

## Exports publics (`packages/data/src/index.ts`)

```ts
// Schemas zod, et types derives par z.infer
export {
  raritySchema, weaponSchema, damageMatrixSchema, enemySchema, unitSchema,
  squadSchema, buildingSchema, researchTreeSchema, planetSchema, planetIncomeSchema,
  crateSchema, demoStateSchema, derivedValuesSchema,
} from './schemas';
export type {
  Rarity, RarityId, Weapon, WeaponId, ActiveWeaponId, DamageMatrix, Enemy,
  Unit, Commander, Combatant, Squad, SquadId, Formation, Theatre, ActionPointsMode,
  Building, ResearchTree, ResearchNode, Planet, PlanetIncome, Crate,
  DemoState, DerivedValues, IconId, ScreenId,
} from './schemas';

// Donnees de jeu portees de la maquette (lecture seule)
export {
  rarities, weapons, damageMatrix, enemy, engines, units, buildings, buildingSlots,
  researchTrees, planets, planetIncome, crates, launchPool,
} from './game';

// Etat de demonstration et valeurs derivees de la maquette
export { demoState, derivedValues } from './demo';

// Acces par identifiant : lectures, aucune regle de jeu
export { unitById, rarityById, weaponById, planetById, nodeById, basePlanet } from './lookup';
```

## Garanties

1. **Lecture seule** : les donnees sont des constantes en `readonly` ; aucun consommateur ne les
   modifie.
2. **Validees en test** : chaque constante passe son schema dans les tests Vitest du paquet, qui
   verifient aussi les invariants de `data-model.md` §7. L'application ne revalide pas a
   l'execution.
3. **Sans effet de bord** : `"sideEffects": false`. Seules dependances d'execution : `zod`, pour
   les schemas. Un ecran qui n'importe que des donnees n'embarque pas zod.
4. **Aucune regle de jeu** : les fonctions `*ById` et `basePlanet` (l'unique planete au statut
   `BASE`) sont des lectures. Les regles (puissance,
   degats, vagues, chances de victoire...) vivent dans `@nova/sim` a partir de la phase P1 de la
   feuille de route. D'ici la, leurs resultats sont dans `derivedValues`.
5. **Valeurs derivees tracables** : `demo/derived.generated.json` est produit par
   `pnpm --filter @nova/web mockup:extract`, jamais edite a la main. Le test oracle
   (`apps/web/tests/oracle/`) echoue s'il s'ecarte de la maquette.
6. **Aucune donnee de jeu en dur ailleurs** : `apps/web/src` ne contient aucun nom d'unite, de
   batiment, de planete ni de noeud de recherche. Un test de `@nova/web` le verifie (SC-011).

## Evolution

La phase P5 de la feuille de route reutilisera les schemas pour l'API (principe IV). L'etat de
demonstration sera alors remplace par l'etat servi par le serveur, avec la meme forme.
