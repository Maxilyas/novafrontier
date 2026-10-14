# Contrat : ajouts a `@nova/data`

Prolonge `specs/20260928-182033-socle-ecrans-navigables/contracts/data-package.md`. Formes et
valeurs : `data-model.md` §2. Les regles restent dans `@nova/sim` (`research.md` R8).

## Nouveaux exports

```ts
// schemas/combat.ts
export const combatTuningSchema: z.ZodType<CombatTuning>;
export const enemyArchetypeSchema: z.ZodType<EnemyArchetype>;
export const threatSchema = z.enum(['l', 'm', 'h', 'b']);
export const slotKindSchema = z.enum(['ship', 'mech']);

// schemas/unit.ts (etendu)
export const skillTargetSchema = z.enum(['none', 'point', 'unit', 'enemy', 'unit-slot']);
export const skillEffectSchema: z.ZodDiscriminatedUnion<...>;   // data-model.md §2.3
// skillSchema gagne `target` et `effect`

// game/combat.ts
export const combatTuning: CombatTuning;
export const enemyArchetypes: Readonly<Record<Threat, EnemyArchetype>>;
```

## Modifications

| Fichier | Changement |
|---|---|
| `game/units.ts` | les 15 competences recoivent `target` et `effect` (table FR-014) ; description de Bouclier de flotte : "+70% DÉF pendant 7 s" |
| `schemas/derived.ts`, `demo/derived.generated.json` | inchanges : instantane de la maquette, lu par les tests seulement |

## Regles

- Aucune fonction de calcul : seules des lectures (`lookup.ts`) et des constantes.
- Les durees sont en millisecondes et les vitesses en unites d'arene par seconde ; la conversion en
  pas et en virgule fixe appartient a la sim.
- Les tests du paquet valident `combatTuning`, `enemyArchetypes` et les competences par leurs
  schemas, plus les invariants de `data-model.md` §6.
