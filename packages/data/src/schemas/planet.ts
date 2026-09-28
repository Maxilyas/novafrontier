import { z } from 'zod';
import {
  hexColorSchema,
  nonNegativeIntSchema,
  planetStatusSchema,
  positiveIntSchema,
} from './common';

export const planetIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const planetSchema = z.object({
  id: planetIdSchema,
  name: z.string().min(1),
  /** Coordonnees du monde de la maquette. */
  position: z.object({ x: positiveIntSchema, y: positiveIntSchema }),
  radius: positiveIntSchema,
  colors: z.object({ light: hexColorSchema, dark: hexColorSchema }),
  status: planetStatusSchema,
  resources: z.array(z.string().min(1)),
  operations: nonNegativeIntSchema,
  description: z.string().min(1),
});
export type Planet = z.infer<typeof planetSchema>;

export const planetIncomeSchema = z.object({
  planet: planetIdSchema,
  label: z.string().min(1),
  daily: positiveIntSchema,
});
export type PlanetIncome = z.infer<typeof planetIncomeSchema>;
