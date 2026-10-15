import type { SimEvent } from '@nova/sim';

/**
 * Journal du combat (FR-029) : messages de la maquette (log(), lignes 2180-2353), construits a
 * partir des evenements de la simulation. Fonction pure : la plus recente ligne en premier, 11
 * lignes au plus.
 */

export type LogTone = '' | 'ok' | 'crit' | 'gold';

/** Morceau de ligne ; `strong` : en gras, comme les balises <b> de la maquette. */
export interface LogPart {
  readonly text: string;
  readonly strong?: boolean;
}

export interface LogLine {
  readonly id: number;
  readonly tone: LogTone;
  readonly parts: readonly LogPart[];
}

export interface LogContext {
  /** Nom d'une unite du joueur par identifiant d'entite. */
  unitName(id: number): string | undefined;
  /** Libelle de l'armement d'une entite (unite ou ennemi), en majuscules dans le message. */
  weaponLabel(id: number): string | undefined;
  /** Nom et description de la competence de ce rang. */
  skill(rank: number): { name: string; description: string } | undefined;
  /** Espacement minimal, en pas, des messages d'avantage d'armement. */
  readonly advantageEveryTicks: number;
}

export interface LogState {
  readonly lines: readonly LogLine[];
  /** Pas du dernier message d'avantage ; -Infinity avant le premier. */
  readonly lastAdvantage: number;
  readonly nextId: number;
}

export const MAX_LOG_LINES = 11;

export const emptyLog: LogState = { lines: [], lastAdvantage: Number.NEGATIVE_INFINITY, nextId: 1 };

const deux = (n: number) => String(n).padStart(2, '0');

/** Les deux premieres lignes du combat (startCombat, lignes 2180-2181). */
export function openingLines(log: LogState, engagees: number, formation: 'ring' | 'arc'): LogState {
  return ajouter(log, [
    { tone: 'ok', parts: [{ text: `Escouade déployée — ${engagees} unités en position` }] },
    {
      tone: '',
      parts: [
        {
          text: `Formation ${formation === 'ring' ? '360°' : 'en arc'} · objectif au centre du dispositif`,
        },
      ],
    },
  ]);
}

function ajouter(log: LogState, nouvelles: readonly Omit<LogLine, 'id'>[]): LogState {
  if (nouvelles.length === 0) return log;
  let id = log.nextId;
  const numerotees = nouvelles.map((l) => ({ ...l, id: id++ }));
  return {
    ...log,
    nextId: id,
    lines: [...numerotees.reverse(), ...log.lines].slice(0, MAX_LOG_LINES),
  };
}

export function appendEvents(
  log: LogState,
  events: readonly SimEvent[],
  ctx: LogContext,
): LogState {
  const nouvelles: Omit<LogLine, 'id'>[] = [];
  let dernierAvantage = log.lastAdvantage;
  const tireurs = new Map<number, number>();
  for (const e of events) {
    switch (e.type) {
      case 'wave':
        nouvelles.push({
          tone: e.boss ? 'gold' : '',
          parts: [{ text: `Vague ${deux(e.index)} — ${e.composition}${e.boss ? ' · BOSS' : ''}` }],
        });
        break;
      case 'shot':
        tireurs.set(e.to, e.from);
        break;
      case 'hit': {
        const tireur = tireurs.get(e.target);
        if (
          tireur !== undefined &&
          ctx.unitName(tireur) !== undefined &&
          e.multiplier > 65536 &&
          e.tick - dernierAvantage >= ctx.advantageEveryTicks
        ) {
          dernierAvantage = e.tick;
          const de = (ctx.weaponLabel(tireur) ?? '').toUpperCase();
          const contre = (ctx.weaponLabel(e.target) ?? '').toUpperCase();
          nouvelles.push({
            tone: 'ok',
            parts: [
              { text: `Avantage ${de} ▸ ${contre} ` },
              { text: `×${(e.multiplier / 65536).toFixed(2)}`, strong: true },
            ],
          });
        }
        break;
      }
      case 'death':
        if (e.side === 'unit') {
          nouvelles.push({
            tone: 'crit',
            parts: [{ text: `${ctx.unitName(e.id) ?? ''} détruit` }],
          });
        } else if (e.boss) {
          nouvelles.push({ tone: 'gold', parts: [{ text: 'BOSS DÉTRUIT' }] });
        }
        break;
      case 'skill': {
        const competence = ctx.skill(e.skill);
        if (!competence) break;
        const nom = competence.name.toUpperCase();
        if (e.bonus === 'loot') {
          nouvelles.push({
            tone: 'gold',
            parts: [
              { text: nom, strong: true },
              { text: ' — vague nettoyée, butin supplémentaire' },
            ],
          });
        } else if (e.applied) {
          nouvelles.push({
            tone: 'gold',
            parts: [{ text: nom, strong: true }, { text: ` — ${competence.description}` }],
          });
        } else if (e.failure === 'no-target') {
          nouvelles.push({
            tone: '',
            parts: [{ text: nom, strong: true }, { text: ' — aucune cible valide' }],
          });
        }
        break;
      }
      default:
        break;
    }
  }
  return { ...ajouter(log, nouvelles), lastAdvantage: dernierAvantage };
}
