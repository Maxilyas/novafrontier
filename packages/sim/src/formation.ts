import {
  type Combatant,
  type Formation,
  type Line,
  type Squad,
  type Theatre,
  unitById,
} from '@nova/data';
import { fmul } from './fixed';
import { cos, sin } from './trig';
import { tuning } from './tuning';
import type { Placement, Slot } from './types';

/**
 * Emplacements des formations, unites engagees, placement automatique et validation (FR-037 a
 * FR-044, data-model.md §3.1-3.2, research R18).
 */

const LIGNES: readonly Line[] = ['front', 'back'];

function construire(formation: Formation): readonly Slot[] {
  const objectif = tuning.boardObjective[formation];
  const relique = tuning.relicPosition[formation];
  const slots: Slot[] = [];
  for (const line of LIGNES) {
    const ligne = tuning.slots[formation][line];
    ligne.angles.forEach((angle, i) => {
      const dx = fmul(cos(angle), ligne.radius);
      const dy = fmul(sin(angle), ligne.radius);
      slots.push({
        index: slots.length,
        line,
        kind: tuning.slotTypes[i % 2] ?? 'ship',
        board: { x: objectif.x + dx, y: objectif.y + dy },
        arena: {
          x: relique.x + fmul(dx, tuning.boardToArena.x),
          y: relique.y + fmul(dy, tuning.boardToArena.y),
        },
      });
    });
  }
  return slots;
}

const PAR_FORMATION: Readonly<Record<Formation, readonly Slot[]>> = {
  ring: construire('ring'),
  arc: construire('arc'),
};

/** Emplacements proposes : en combat spatial, seuls ceux des vaisseaux (rangs conserves). */
export function formationSlots(formation: Formation, theatre: Theatre): readonly Slot[] {
  const tous = PAR_FORMATION[formation];
  return theatre === 'orbital' ? tous.filter((s) => s.kind === 'ship') : tous;
}

const combattant = (id: string | null): Combatant | undefined => {
  const u = id === null ? undefined : unitById(id);
  return u && u.family !== 'cmd' ? u : undefined;
};

/** Unites engageables : vaisseaux, puis mecas en combat terrestre, dans l'ordre de l'escouade. */
export function engagedUnits(squad: Squad, theatre: Theatre): readonly Combatant[] {
  const ids = theatre === 'orbital' ? squad.ships : [...squad.ships, ...squad.mechs];
  return ids.map(combattant).filter((u): u is Combatant => u !== undefined);
}

/**
 * Regle `autoPlace` de la maquette (lignes 1979-1991), appliquee type par type (FR-040) : par
 * defense decroissante, blindage moyen ou lourd en premiere ligne, leger en seconde, a defaut
 * l'autre ligne du meme type. Rendu par rang d'emplacement croissant.
 */
export function autoPlacement(squad: Squad, theatre: Theatre, formation: Formation): Placement {
  const slots = formationSlots(formation, theatre);
  const libres = (kind: string, line: Line) =>
    slots.filter((s) => s.kind === kind && s.line === line);
  const curseurs = new Map<string, number>();
  const prendre = (kind: string, line: Line): Slot | undefined => {
    const cle = `${kind}/${line}`;
    const i = curseurs.get(cle) ?? 0;
    const slot = libres(kind, line)[i];
    if (slot) curseurs.set(cle, i + 1);
    return slot;
  };
  const unites = [...engagedUnits(squad, theatre)].sort(
    (a, b) => b.stats.defense - a.stats.defense,
  );
  const placement: { unit: string; slot: number }[] = [];
  for (const u of unites) {
    const devant = u.armor !== 'Léger';
    const slot = devant
      ? (prendre(u.family, 'front') ?? prendre(u.family, 'back'))
      : (prendre(u.family, 'back') ?? prendre(u.family, 'front'));
    if (slot) placement.push({ unit: u.id, slot: slot.index });
  }
  return placement.sort((a, b) => a.slot - b.slot);
}

/** Verifie un placement (FR-044) ; la raison du refus est lisible. */
export function validatePlacement(
  squad: Squad,
  theatre: Theatre,
  formation: Formation,
  placement: Placement,
): { ok: true } | { ok: false; reason: string } {
  const engageables = new Map(engagedUnits(squad, theatre).map((u) => [u.id, u]));
  const slots = new Map(formationSlots(formation, theatre).map((s) => [s.index, s]));
  const unitesVues = new Set<string>();
  const slotsVus = new Set<number>();
  for (const { unit, slot } of placement) {
    const u = engageables.get(unit);
    if (!u) return { ok: false, reason: `unite ${unit} non engageable dans ce theatre` };
    if (unitesVues.has(unit)) return { ok: false, reason: `unite ${unit} placee deux fois` };
    const s = slots.get(slot);
    if (!s) return { ok: false, reason: `emplacement ${slot} inexistant` };
    if (s.kind !== u.family) return { ok: false, reason: `emplacement ${slot} de l'autre type` };
    if (slotsVus.has(slot)) return { ok: false, reason: `emplacement ${slot} occupe deux fois` };
    unitesVues.add(unit);
    slotsVus.add(slot);
  }
  return { ok: true };
}
