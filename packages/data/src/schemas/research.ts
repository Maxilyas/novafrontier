import { z } from 'zod';
import { durationSchema } from './building';
import {
  iconIdSchema,
  nonNegativeIntSchema,
  positiveIntSchema,
  researchStateSchema,
  researchTreeIdSchema,
} from './common';

export const researchNodeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    icon: iconIdSchema,
    /** Coordonnees de l'arbre de la maquette. */
    position: z.object({ x: nonNegativeIntSchema, y: nonNegativeIntSchema }),
    state: researchStateSchema,
    level: z
      .object({ current: nonNegativeIntSchema, max: positiveIntSchema })
      .refine((l) => l.current <= l.max, { message: '`current <= max`' }),
    /** Noeuds du meme arbre, sans cycle (invariant teste). */
    prerequisites: z.array(z.string().min(1)),
    description: z.string().min(1),
    openDecision: z.boolean(),
    legendary: z.boolean(),
    cost: z.object({
      alloy: positiveIntSchema,
      credits: positiveIntSchema,
      artefacts: positiveIntSchema.optional(),
    }),
    duration: durationSchema,
    labLevel: positiveIntSchema,
    effect: z.string().min(1),
  })
  .refine((n) => (n.cost.artefacts !== undefined) === n.legendary, {
    message: '`artefacts` present si et seulement si `legendary`',
  });
export type ResearchNode = z.infer<typeof researchNodeSchema>;

export const researchTreeSchema = z.object({
  id: researchTreeIdSchema,
  label: z.string().min(1),
  nodes: z.array(researchNodeSchema).min(1),
});
export type ResearchTree = z.infer<typeof researchTreeSchema>;
