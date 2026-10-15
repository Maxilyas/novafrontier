import {
  type ActiveWeaponId,
  type Combatant,
  demoState,
  type Planet,
  planetById,
  planets,
  rarityById,
  type Skill,
  unitById,
} from '@nova/data';
import type { SimEvent } from './events';
import { fingerprint as empreinte } from './fingerprint';
import { distSq256, type Fixed, fmul, isqrt, mulDiv, rangeSq256, toFixed } from './fixed';
import { autoPlacement, formationSlots, validatePlacement } from './formation';
import { difficulty, lootOf } from './planet';
import { createRng, nextInt } from './rng';
import { applySkill, type SkillContext } from './skills';
import { cos, sin } from './trig';
import { tuning } from './tuning';
import type {
  CombatEnemy,
  CombatResult,
  CombatSetup,
  CombatState,
  CombatUnit,
  Command,
  Slot,
  Target,
  Tick,
} from './types';
import { wavesFor } from './waves';

/**
 * Deroulement d'un combat (FR-001 a FR-020, research R5 a R7) : pas fixe, ordre de resolution
 * ecrit (R6), entiers seulement. Le meme code tourne dans le navigateur et sous Node.
 */

export interface Combat {
  readonly state: Readonly<CombatState>;
  /** Entrees, journal de commandes a jour compris. */
  readonly setup: Readonly<CombatSetup>;
  /** Evenements du pas 0 (apparition de la premiere vague). */
  readonly initialEvents: readonly SimEvent[];
  /** Emplacements de la formation et du theatre. */
  readonly slots: readonly Slot[];
  /** Competences de la barre d'actions, dans l'ordre de leurs rangs. */
  readonly bar: readonly Skill[];
  /** Avance d'un pas ; sans effet apres la fin. */
  step(): readonly SimEvent[];
  /** Ajoute une commande pour un pas futur (journal en direct). */
  issue(command: Command): void;
  fingerprint(): string;
  result(): CombatResult | null;
}

const UINT32_MAX = 4294967295;

const CODES = {
  outcome: { running: 0, victory: 1, defeat: 2 },
  reason: { relic: 1, cleared: 2, timeout: 3 },
  line: { front: 0, back: 1 },
  kind: { ship: 0, mech: 1 },
  threat: { l: 0, m: 1, h: 2, b: 3 },
  weapon: { las: 0, art: 1, nuc: 2 },
  pillage: { pending: 0, won: 1, lost: 2 },
} as const;

const estEntier = (v: unknown): v is number => Number.isSafeInteger(v);

/** Forme de la cible attendue par la competence ; `null` si la commande est bien formee. */
function erreurDeCible(skill: Skill, target: Target | undefined): string | null {
  const attendu = skill.target;
  if (attendu === 'none') return target === undefined ? null : 'aucune cible attendue';
  if (target?.kind !== attendu) return `cible "${attendu}" attendue`;
  const champs =
    target.kind === 'point'
      ? [target.x, target.y]
      : target.kind === 'unit-slot'
        ? [target.id, target.slot]
        : [target.id];
  return champs.every(estEntier) ? null : 'coordonnees ou identifiants entiers attendus';
}

function verifierCommande(command: Command, bar: readonly Skill[], pasMin: Tick): void {
  if (!estEntier(command.tick) || command.tick < pasMin) {
    throw new Error(`Commande au pas ${command.tick} : pas entier >= ${pasMin} attendu`);
  }
  const skill = estEntier(command.skill) ? bar[command.skill] : undefined;
  if (!skill)
    throw new Error(`Commande au pas ${command.tick} : competence ${command.skill} inconnue`);
  const erreur = erreurDeCible(skill, command.target);
  if (erreur) throw new Error(`Commande au pas ${command.tick} (${skill.name}) : ${erreur}`);
}

/** max(min, ATQ x matrice x 130 / (DEF + 130)) en 16.16 (maquette, `dmg`, ligne 2204). */
function degats(attaque: Fixed, multiplicateur: Fixed, defense: Fixed): Fixed {
  const brut = fmul(attaque, multiplicateur);
  const k = tuning.defenseConstant;
  return Math.max(tuning.minDamage, mulDiv(brut, k, defense + k));
}

export function createCombat(setup: CombatSetup): Combat {
  if (!estEntier(setup.seed) || setup.seed < 0 || setup.seed > UINT32_MAX) {
    throw new Error('Graine : entier non signe sur 32 bits attendu');
  }
  const planete: Planet | undefined = planetById(setup.planet);
  if (!planete) throw new Error(`Planete inconnue : ${setup.planet}`);
  const vagues = wavesFor(planete);
  if (vagues.length === 0) throw new Error(`Aucune vague sur ${setup.planet}`);
  if (setup.placement.length === 0) throw new Error('Placement vide : au moins une unite attendue');
  const verdict = validatePlacement(setup.squad, setup.theatre, setup.formation, setup.placement);
  if (!verdict.ok) throw new Error(`Placement invalide : ${verdict.reason}`);

  const commandant = setup.squad.commander ? unitById(setup.squad.commander) : undefined;
  const rarete = commandant?.family === 'cmd' ? rarityById(commandant.rarity) : undefined;
  const bar: readonly Skill[] =
    commandant?.family === 'cmd' && rarete ? commandant.skills.slice(0, rarete.actionPoints) : [];
  let pasMin = 1;
  for (const c of setup.commands) {
    verifierCommande(c, bar, pasMin);
    pasMin = c.tick;
  }
  const journal: Command[] = [...setup.commands];
  const intervalle = setup.waveIntervalTicks ?? tuning.waveInterval;
  if (!estEntier(intervalle) || intervalle < 1) throw new Error('Intervalle de vagues invalide');

  const slots = formationSlots(setup.formation, setup.theatre);
  const parRang = new Map(slots.map((s) => [s.index, s]));
  const units: CombatUnit[] = [...setup.placement]
    .sort((a, b) => a.slot - b.slot)
    .map((p, i) => {
      const u = unitById(p.unit) as Combatant;
      const s = parRang.get(p.slot) as Slot;
      return {
        id: i + 1,
        unitId: u.id,
        slot: s.index,
        line: s.line,
        kind: s.kind,
        x: s.arena.x,
        y: s.arena.y,
        hp: toFixed(u.stats.hp * u.count),
        maxHp: toFixed(u.stats.hp * u.count),
        attack: toFixed(u.stats.attack),
        defense: toFixed(u.stats.defense),
        range: toFixed(u.stats.range),
        weapon: u.weapon,
        cooldown: 0,
        attackBuff: null,
      };
    });
  const relique = tuning.relicPosition[setup.formation];

  const state: CombatState = {
    tick: 0,
    rng: createRng(setup.seed),
    outcome: 'running',
    endReason: null,
    relic: { x: relique.x, y: relique.y, hp: tuning.relicHp, maxHp: tuning.relicHp },
    units,
    enemies: [],
    waves: vagues,
    spawned: 0,
    nextWaveIn: 0,
    nextId: units.length + 1,
    defenseBuff: null,
    frontDamageCut: null,
    enemyMiss: null,
    actionPoints: rarete?.actionPoints ?? 0,
    spentSkills: 0,
    pillage: null,
  };

  let evenements: SimEvent[] = [];
  const emit = (e: SimEvent) => {
    evenements.push(e);
  };

  function blesserEnnemi(e: CombatEnemy, d: Fixed, multiplier: Fixed): void {
    if (e.hp <= 0) return;
    e.hp = Math.max(0, e.hp - d);
    emit({ type: 'hit', tick: state.tick, target: e.id, damage: d, multiplier });
    if (e.hp === 0) {
      emit({ type: 'death', tick: state.tick, id: e.id, side: 'enemy', boss: e.threat === 'b' });
    }
  }

  function blesserUnite(u: CombatUnit, d: Fixed, multiplier: Fixed): void {
    u.hp = Math.max(0, u.hp - d);
    emit({ type: 'hit', tick: state.tick, target: u.id, damage: d, multiplier });
    if (u.hp === 0) emit({ type: 'death', tick: state.tick, id: u.id, side: 'unit', boss: false });
  }

  /** Fumigene : un tirage par tir ennemi tant que l'effet dure (research R4). */
  const rate = () => state.enemyMiss !== null && nextInt(state.rng, 65536) < state.enemyMiss.value;

  function apparition(): void {
    const vague = vagues[state.spawned];
    if (!vague) return;
    state.spawned += 1;
    state.nextWaveIn = state.spawned < vagues.length ? intervalle : 0;
    for (const u of units) u.attackBuff = null;
    emit({
      type: 'wave',
      tick: state.tick,
      index: vague.index,
      boss: vague.boss,
      composition: vague.composition,
    });
    const a = tuning.archetypes[vague.threat];
    const secteur = tuning.spawn.sector[setup.formation];
    for (let i = 0; i < a.count; i += 1) {
      const angle = secteur.full
        ? nextInt(state.rng, 1024)
        : secteur.center + nextInt(state.rng, 2 * secteur.halfWidth + 1) - secteur.halfWidth;
      const distance = vague.boss
        ? tuning.spawn.distBoss
        : tuning.spawn.distMin + nextInt(state.rng, tuning.spawn.distRange256) * 256;
      const ennemi: CombatEnemy = {
        id: state.nextId,
        wave: vague.index,
        threat: vague.threat,
        weapon: vague.weapon,
        x: state.relic.x + fmul(cos(angle), distance),
        y: state.relic.y + fmul(fmul(sin(angle), distance), tuning.spawn.squash),
        hp: a.hp,
        maxHp: a.hp,
        attack: a.attack,
        defense: a.defense,
        range: a.range,
        speed: a.speed,
        cooldown: 0,
        frozen: 0,
      };
      state.nextId += 1;
      state.enemies.push(ennemi);
      emit({
        type: 'spawn',
        tick: state.tick,
        id: ennemi.id,
        threat: a.threat,
        weapon: ennemi.weapon,
        x: ennemi.x,
        y: ennemi.y,
      });
    }
  }

  function uniteLaPlusProche(x: Fixed, y: Fixed): { u: CombatUnit; d2: number } | undefined {
    let meilleure: { u: CombatUnit; d2: number } | undefined;
    for (const u of units) {
      if (u.hp <= 0) continue;
      const d2 = distSq256(u.x, u.y, x, y);
      if (!meilleure || d2 < meilleure.d2) meilleure = { u, d2 };
    }
    return meilleure;
  }

  function avancer(e: CombatEnemy, tx: Fixed, ty: Fixed): void {
    const longueur = isqrt(distSq256(tx, ty, e.x, e.y)) * 256;
    if (longueur === 0) return;
    e.x += Math.trunc(((tx - e.x) * e.speed) / longueur);
    e.y += Math.trunc(((ty - e.y) * e.speed) / longueur);
  }

  function tirEnnemi(e: CombatEnemy, cible: CombatUnit): void {
    const manque = rate();
    emit({
      type: 'shot',
      tick: state.tick,
      from: e.id,
      to: cible.id,
      weapon: e.weapon,
      missed: manque,
    });
    if (manque) return;
    const multiplicateur = tuning.matrix[e.weapon][cible.weapon];
    const defense = state.defenseBuff
      ? fmul(cible.defense, state.defenseBuff.value)
      : cible.defense;
    let d = degats(e.attack, multiplicateur, defense);
    if (state.frontDamageCut && cible.line === 'front') d = fmul(d, state.frontDamageCut.value);
    blesserUnite(cible, d, multiplicateur);
  }

  function frappeRelique(e: CombatEnemy): void {
    const manque = rate();
    emit({ type: 'shot', tick: state.tick, from: e.id, to: 0, weapon: e.weapon, missed: manque });
    if (manque) return;
    const d = fmul(e.attack, tuning.relicStrikeShare);
    state.relic.hp = Math.max(0, state.relic.hp - d);
    emit({ type: 'objective', tick: state.tick, damage: d, hp: state.relic.hp });
  }

  function ennemis(): void {
    const r2Relique = tuning.relicStrikeRadiusSq;
    for (const e of state.enemies) {
      if (e.hp <= 0) continue;
      const proche = uniteLaPlusProche(e.x, e.y);
      const aPortee = proche !== undefined && proche.d2 < rangeSq256(e.range);
      const peutBouger = e.frozen === 0;
      if (e.frozen > 0) e.frozen -= 1;
      if (!aPortee && peutBouger) {
        if (proche) avancer(e, proche.u.x, proche.u.y);
        else if (distSq256(e.x, e.y, state.relic.x, state.relic.y) > r2Relique) {
          avancer(e, state.relic.x, state.relic.y);
        }
      }
      if (e.cooldown > 0) {
        e.cooldown -= 1;
        continue;
      }
      if (aPortee && proche) {
        tirEnnemi(e, proche.u);
        e.cooldown = tuning.cooldown.enemyVsUnit - 1;
      } else if (distSq256(e.x, e.y, state.relic.x, state.relic.y) <= r2Relique) {
        frappeRelique(e);
        e.cooldown = tuning.cooldown.enemyVsRelic - 1;
      }
    }
  }

  function tirsDesUnites(): void {
    for (const u of units) {
      if (u.hp <= 0) continue;
      if (u.cooldown > 0) {
        u.cooldown -= 1;
        continue;
      }
      const portee = rangeSq256(u.range);
      let cible: CombatEnemy | undefined;
      let meilleure = portee;
      for (const e of state.enemies) {
        if (e.hp <= 0) continue;
        const d2 = distSq256(e.x, e.y, u.x, u.y);
        if (d2 < meilleure) {
          meilleure = d2;
          cible = e;
        }
      }
      if (!cible) continue;
      const attaque =
        u.attackBuff && u.attackBuff.wave === state.spawned
          ? fmul(u.attack, u.attackBuff.value)
          : u.attack;
      const multiplicateur = tuning.matrix[u.weapon][cible.weapon as ActiveWeaponId];
      emit({
        type: 'shot',
        tick: state.tick,
        from: u.id,
        to: cible.id,
        weapon: u.weapon,
        missed: false,
      });
      blesserEnnemi(cible, degats(attaque, multiplicateur, cible.defense), multiplicateur);
      u.cooldown = tuning.cooldown.unit - 1;
    }
  }

  function finDePas(): void {
    state.enemies = state.enemies.filter((e) => e.hp > 0);
    for (const cle of ['defenseBuff', 'frontDamageCut', 'enemyMiss'] as const) {
      const effet = state[cle];
      if (effet) {
        effet.ticks -= 1;
        if (effet.ticks <= 0) state[cle] = null;
      }
    }
    const pillage = state.pillage;
    if (pillage?.status === 'pending' && !state.enemies.some((e) => e.wave === pillage.wave)) {
      pillage.status = 'won';
      emit({ type: 'skill', tick: state.tick, skill: pillage.skill, applied: true, bonus: 'loot' });
    }
  }

  function minuteur(): void {
    if (state.spawned >= vagues.length) return;
    state.nextWaveIn -= 1;
    if (state.nextWaveIn > 0) return;
    if (state.pillage?.status === 'pending') state.pillage.status = 'lost';
    apparition();
  }

  function terminer(outcome: 'victory' | 'defeat', reason: 'relic' | 'cleared' | 'timeout'): void {
    state.outcome = outcome;
    state.endReason = reason;
    if (state.pillage?.status === 'pending') state.pillage.status = 'lost';
    emit({ type: 'end', tick: state.tick, outcome, reason });
  }

  function fin(): void {
    if (state.relic.hp <= 0) terminer('defeat', 'relic');
    else if (state.spawned === vagues.length && state.enemies.length === 0) {
      terminer('victory', 'cleared');
    } else if (state.tick >= tuning.maxTicks) terminer('defeat', 'timeout');
  }

  const contexte = (): SkillContext => ({
    state,
    slots,
    tick: state.tick,
    emit,
    hurtEnemy: blesserEnnemi,
  });

  apparition();
  const initialEvents = evenements;
  let prochaineCommande = 0;

  function mots(): number[] {
    const effet = (e: { value: number; ticks: number } | null) =>
      e ? [1, e.value, e.ticks] : [0, 0, 0];
    const m: number[] = [
      state.tick,
      ...state.rng.state,
      CODES.outcome[state.outcome],
      state.endReason ? CODES.reason[state.endReason] : 0,
      state.relic.x,
      state.relic.y,
      state.relic.hp,
      state.relic.maxHp,
      state.spawned,
      state.nextWaveIn,
      state.nextId,
      state.actionPoints,
      state.spentSkills,
      ...effet(state.defenseBuff),
      ...effet(state.frontDamageCut),
      ...effet(state.enemyMiss),
      ...(state.pillage
        ? [
            1,
            state.pillage.wave,
            state.pillage.share,
            state.pillage.skill,
            CODES.pillage[state.pillage.status],
          ]
        : [0, 0, 0, 0, 0]),
      units.length,
    ];
    for (const u of units) {
      m.push(
        u.id,
        u.slot,
        CODES.line[u.line],
        CODES.kind[u.kind],
        u.x,
        u.y,
        u.hp,
        u.maxHp,
        u.attack,
        u.defense,
        u.range,
        CODES.weapon[u.weapon],
        u.cooldown,
        ...(u.attackBuff ? [1, u.attackBuff.value, u.attackBuff.wave] : [0, 0, 0]),
      );
    }
    m.push(state.enemies.length);
    for (const e of state.enemies) {
      m.push(
        e.id,
        e.wave,
        CODES.threat[e.threat],
        CODES.weapon[e.weapon],
        e.x,
        e.y,
        e.hp,
        e.maxHp,
        e.attack,
        e.defense,
        e.range,
        e.speed,
        e.cooldown,
        e.frozen,
      );
    }
    return m;
  }

  const combat: Combat = {
    state,
    get setup() {
      return { ...setup, commands: journal };
    },
    initialEvents,
    slots,
    bar,
    step() {
      if (state.outcome !== 'running') return [];
      evenements = [];
      state.tick += 1;
      while (journal[prochaineCommande]?.tick === state.tick) {
        const c = journal[prochaineCommande] as Command;
        prochaineCommande += 1;
        applySkill(contexte(), c.skill, bar[c.skill] as Skill, c.target);
      }
      ennemis();
      tirsDesUnites();
      finDePas();
      minuteur();
      fin();
      return evenements;
    },
    issue(command) {
      const dernier = journal[journal.length - 1]?.tick ?? 1;
      verifierCommande(command, bar, Math.max(state.tick + 1, dernier));
      journal.push(command);
    },
    fingerprint: () => empreinte(mots()),
    result() {
      if (state.outcome === 'running' || !state.endReason) return null;
      const victoire = state.outcome === 'victory';
      const base = lootOf(planete);
      const bonus = state.pillage?.status === 'won';
      const loot = !victoire
        ? 0
        : bonus && state.pillage
          ? base + Math.floor((2 * base * state.pillage.share + 65536) / 131072)
          : base;
      return {
        outcome: state.outcome,
        reason: state.endReason,
        ticks: state.tick,
        wavesSpawned: state.spawned,
        wavesTotal: vagues.length,
        unitsLeft: units.filter((u) => u.hp > 0).length,
        unitsEngaged: units.length,
        relicHp: state.relic.hp,
        relicMaxHp: state.relic.maxHp,
        lootBonus: bonus,
        loot,
        fingerprint: empreinte(mots()),
      };
    },
  };
  return combat;
}

/** Deroule un combat complet sans affichage (FR-018, resolution automatique). */
export function runCombat(setup: CombatSetup): CombatResult {
  const combat = createCombat(setup);
  let resultat = combat.result();
  while (!resultat) {
    combat.step();
    resultat = combat.result();
  }
  return resultat;
}

/**
 * Scenario de charge (FR-036, research R14) : escouade Alpha en combat terrestre (5 unites), 360
 * degres, placement automatique, graine 1, contre la planete hostile la plus difficile (10 vagues,
 * 79 ennemis) dont les vagues arrivent a un pas d'intervalle. Memes regles qu'un combat joue ; seul
 * le delai entre vagues est une entree du scenario. Pic de 84 entites, au moins 60 pendant 12 s.
 */
export function loadScenario(): CombatSetup {
  const squad = demoState.squads.find((s) => s.id === 'alpha');
  if (!squad) throw new Error('Escouade Alpha introuvable');
  const planete = planets
    .filter((p) => p.status === 'HOSTILE')
    .reduce<Planet | undefined>(
      (max, p) => (max === undefined || difficulty(p) > difficulty(max) ? p : max),
      undefined,
    );
  if (!planete) throw new Error('Aucune planete hostile');
  return {
    seed: 1,
    squad,
    theatre: 'sol',
    formation: 'ring',
    placement: autoPlacement(squad, 'sol', 'ring'),
    planet: planete.id,
    commands: [],
    waveIntervalTicks: 1,
  };
}
