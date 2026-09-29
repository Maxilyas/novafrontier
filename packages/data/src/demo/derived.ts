import type { DerivedValues } from '../schemas';
import donnees from './derived.generated.json' with { type: 'json' };

/**
 * Valeurs que la maquette calcule par ses regles (data-model.md §4, research R9), generees par
 * `pnpm --filter @nova/web mockup:extract` et verifiees par le test oracle. Validees par le schema
 * dans les tests du paquet, pas a l'execution (contracts/data-package.md).
 */
export const derivedValues = donnees as DerivedValues;
