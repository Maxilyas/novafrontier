import { z } from 'zod';
import { buildingIdSchema, durationSchema } from './building';
import {
  actionPointsModeSchema,
  activeWeaponIdSchema,
  engineSchema,
  iconIdSchema,
  nonNegativeIntSchema,
  positiveIntSchema,
  researchTreeIdSchema,
  squadIdSchema,
  theatreSchema,
  unitFamilySchema,
} from './common';
import { planetIdSchema } from './planet';
import { squadSchema } from './squad';
import { enemySchema } from './weapon';

const ratioSchema = z.number().min(0).max(1);

export const profileSchema = z.object({
  name: z.string().min(1),
  rank: z.string().min(1),
  wing: z.string().min(1),
  badge: z.string().min(1),
  level: positiveIntSchema,
  xpProgress: ratioSchema,
  nextUltimateLevel: positiveIntSchema,
});
export type Profile = z.infer<typeof profileSchema>;

export const resourcesSchema = z.object({
  credits: nonNegativeIntSchema,
  alloy: nonNegativeIntSchema,
  fuel: nonNegativeIntSchema,
  artefacts: nonNegativeIntSchema,
});
export type Resources = z.infer<typeof resourcesSchema>;

export const pendingIncomeSchema = z
  .object({
    amount: nonNegativeIntSchema,
    cap: positiveIntSchema,
    untilCap: z.string().min(1),
    gauge: ratioSchema,
  })
  .refine((p) => p.amount <= p.cap, { message: '`amount <= cap`' });
export type PendingIncome = z.infer<typeof pendingIncomeSchema>;

export const researchQueueSlotSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('active'),
    label: z.string().min(1),
    icon: iconIdSchema,
    progress: ratioSchema,
    remaining: durationSchema,
  }),
  z.object({ kind: z.literal('free'), label: z.string().min(1) }),
]);
export type ResearchQueueSlot = z.infer<typeof researchQueueSlotSchema>;

export const researchQueueSchema = z.object({
  header: z.string().min(1),
  slots: z.array(researchQueueSlotSchema).length(3),
});
export type ResearchQueue = z.infer<typeof researchQueueSchema>;

export const missionSchema = z.object({
  target: planetIdSchema,
  enemy: enemySchema,
  relicHp: positiveIntSchema,
  /** Portee du moteur, en UA. */
  reach: positiveIntSchema,
  engine: engineSchema,
  /** Consommation, en unites de carburant par UA. */
  fuelRate: z.number().positive(),
});
export type Mission = z.infer<typeof missionSchema>;

export const defaultsSchema = z.object({
  squad: squadIdSchema,
  rosterFilter: unitFamilySchema,
  actionPointsMode: actionPointsModeSchema,
  theatre: theatreSchema,
  atlas: z.object({
    unit: z.string().min(1),
    tier: z.number().int().min(1).max(4),
    weapon: activeWeaponIdSchema,
  }),
  building: buildingIdSchema,
  tree: researchTreeIdSchema,
  node: z.string().min(1),
  map: z.object({
    scale: z.string().min(1),
    zone: z.string().min(1),
    coords: z.string().min(1),
  }),
});
export type Defaults = z.infer<typeof defaultsSchema>;

export const demoStateSchema = z.object({
  profile: profileSchema,
  resources: resourcesSchema,
  pendingIncome: pendingIncomeSchema,
  squads: z.array(squadSchema).length(5),
  researchQueue: researchQueueSchema,
  mission: missionSchema,
  defaults: defaultsSchema,
});
export type DemoState = z.infer<typeof demoStateSchema>;
