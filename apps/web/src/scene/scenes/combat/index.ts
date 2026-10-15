import { combatTuning, type Threat, weaponById } from '@nova/data';
import type { Combat, SimEvent } from '@nova/sim';
import { type Application, Container, type FederatedPointerEvent, Graphics } from 'pixi.js';
import { combatRuntime } from '../../../state/combat-runtime';
import type { SceneModule } from '../../types';
import { type Fit, fitInto, toLogical, toZone } from '../fit';
import { cibleSousPointeur, ciblesValides, rayonDeZone } from './designation';
import {
  barreEnnemi,
  barreUnite,
  creerFond,
  dessinerFleche,
  etoiles,
  type FormeEnnemi,
  type FormeUnite,
  ennemi as formeEnnemi,
  unite as formeUnite,
  relique,
} from './draw';
import { creerEffets } from './effects';

/**
 * Scene du combat (FR-024 a FR-026, contracts/scenes.md, research R13). Elle lit le moteur et ses
 * evenements a chaque image, interpole les ennemis entre deux pas et convertit les clics de
 * designation en cibles ; elle ne modifie jamais le combat (principe III).
 */

const F = 65536;
const ARENE = combatTuning.arena;
const HEX = (c: string) => Number.parseInt(c.slice(1), 16);

/** Couleur et rayon de l'anneau d'un effet de competence (contracts/scenes.md). */
const ANNEAUX: Record<string, { couleur: number; rayon: number }> = {
  degats: { couleur: 0xf5a623, rayon: 150 },
  protection: { couleur: 0x63d6bc, rayon: 280 },
  soin: { couleur: 0x9fd15a, rayon: 260 },
  immobilisation: { couleur: 0xb479ff, rayon: 420 },
  renforcement: { couleur: 0xe8543f, rayon: 240 },
};

const FAMILLE: Record<string, keyof typeof ANNEAUX> = {
  'strike-point': 'degats',
  'strike-nearest-relic': 'degats',
  'strike-enemy': 'degats',
  charge: 'degats',
  'defense-buff': 'protection',
  'front-damage-cut': 'protection',
  'heal-unit': 'soin',
  'heal-all': 'soin',
  'heal-point': 'soin',
  freeze: 'immobilisation',
  'enemy-miss': 'immobilisation',
  'attack-buff-unit': 'renforcement',
  'loot-bonus': 'renforcement',
  relocate: 'renforcement',
};

const animationsReduites = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const combatScene: SceneModule = {
  animateWhenReducedMotion: true,
  init: { antialias: true },
  create(app: Application) {
    const fond = creerFond();
    const monde = new Container();
    const ciel = etoiles(ARENE.width, ARENE.height);
    const coucheRelique = new Container();
    const { corps: corpsRelique, anneau: anneauRelique } = relique();
    coucheRelique.addChild(anneauRelique, corpsRelique);
    const coucheUnites = new Container();
    const coucheEnnemis = new Container();
    const effets = creerEffets();
    const designation = new Graphics();
    monde.addChild(ciel, coucheRelique, coucheUnites, coucheEnnemis, effets.couche, designation);
    app.stage.addChild(fond.sprite, monde);

    let zone = { width: 1, height: 1 };
    let fit: Fit = fitInto(ARENE, zone);
    let courant: Combat | undefined;
    let theatrePeint: string | undefined;
    let pointeur: { x: number; y: number } | undefined;
    const unites = new Map<number, FormeUnite & { pv: number }>();
    const ennemis = new Map<number, FormeEnnemi & { pv: number; menace: Threat }>();

    const peindreFond = () => {
      const theatre = courant?.setup.theatre ?? 'orbital';
      const centre = courant
        ? toZone(fit, courant.state.relic.x / F, courant.state.relic.y / F)
        : toZone(fit, ARENE.width / 2, ARENE.height / 2);
      fond.peindre(zone.width, zone.height, theatre, centre, 900 * fit.scale);
      theatrePeint = theatre;
      ciel.visible = theatre === 'orbital';
    };

    function changerDeCombat(c: Combat | undefined): void {
      courant = c;
      for (const u of unites.values()) u.racine.destroy({ children: true });
      for (const e of ennemis.values()) e.racine.destroy({ children: true });
      unites.clear();
      ennemis.clear();
      effets.vider();
      if (c) coucheRelique.position.set(c.state.relic.x / F, c.state.relic.y / F);
      peindreFond();
    }

    /** Position affichee d'une entite, interpolee entre le pas precedent et le pas courant. */
    function position(id: number, x: number, y: number, alpha: number) {
      const avant = combatRuntime.previousPosition(id);
      if (!avant) return { x: x / F, y: y / F };
      return { x: (avant.x + (x - avant.x) * alpha) / F, y: (avant.y + (y - avant.y) * alpha) / F };
    }

    const positionDe = (c: Combat, id: number) => {
      if (id === 0) return { x: c.state.relic.x / F, y: c.state.relic.y / F };
      const e = c.state.units.find((u) => u.id === id) ?? c.state.enemies.find((x) => x.id === id);
      if (e) return { x: e.x / F, y: e.y / F };
      const avant = combatRuntime.previousPosition(id);
      return avant ? { x: avant.x / F, y: avant.y / F } : undefined;
    };

    const desabonner = combatRuntime.onStep((evenements: readonly SimEvent[], c: Combat) => {
      if (c !== courant) changerDeCombat(c);
      const maintenant = performance.now();
      for (const e of evenements) {
        if (e.type === 'shot') {
          const de = positionDe(c, e.from);
          const vers = positionDe(c, e.to);
          const couleur = e.to === 0 ? 0xe8543f : HEX(weaponById(e.weapon)?.color ?? '#ffffff');
          if (de && vers) effets.tir(de, vers, couleur, e.missed, maintenant);
        } else if (e.type === 'death' && e.side === 'enemy') {
          const ou = positionDe(c, e.id);
          if (ou) effets.destruction(ou, e.boss, maintenant);
        } else if (e.type === 'skill' && e.applied && e.at && !e.bonus) {
          const effet = c.bar[e.skill]?.effect;
          const famille = ANNEAUX[effet ? (FAMILLE[effet.kind] ?? 'degats') : 'degats'];
          const rayon = effet && 'radius' in effet ? effet.radius : famille?.rayon;
          if (famille && rayon !== undefined) {
            effets.anneau({ x: e.at.x / F, y: e.at.y / F }, rayon, famille.couleur, maintenant);
          }
        }
      }
    });

    // Designation : le clic gauche designe, le clic droit annule (FR-013).
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    const versArene = (e: FederatedPointerEvent) => toLogical(fit, e.global.x, e.global.y);
    app.stage.on('pointermove', (e: FederatedPointerEvent) => {
      pointeur = versArene(e);
    });
    app.stage.on('pointerleave', () => {
      pointeur = undefined;
    });
    app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
      const d = combatRuntime.designation;
      const c = combatRuntime.combat;
      if (!d || !c) return;
      if (e.button === 2) {
        combatRuntime.cancelDesignation();
        return;
      }
      if (e.button !== 0) return;
      const cible = cibleSousPointeur(c, d, versArene(e));
      if (cible) combatRuntime.designate(cible);
    });
    const sansMenu = (e: Event) => {
      if (combatRuntime.designation) e.preventDefault();
    };
    app.canvas.addEventListener('contextmenu', sansMenu);

    function dessinerDesignation(c: Combat): void {
      designation.clear();
      const d = combatRuntime.designation;
      app.canvas.style.cursor = d ? 'crosshair' : '';
      if (!d) return;
      for (const r of ciblesValides(c, d)) {
        designation.circle(r.x, r.y, r.rayon).stroke({ width: 1.5, color: 0xf5a623, alpha: 0.8 });
      }
      const rayon = d.step === 'point' ? rayonDeZone(c, d) : undefined;
      if (rayon !== undefined && pointeur) {
        designation
          .circle(pointeur.x, pointeur.y, rayon)
          .fill({ color: 0xf5a623, alpha: 0.08 })
          .stroke({ width: 1.5, color: 0xf5a623, alpha: 0.7 });
      }
    }

    function rendre(): void {
      const c = combatRuntime.combat;
      if (c !== courant) changerDeCombat(c);
      const maintenant = performance.now();
      const fige = animationsReduites();
      anneauRelique.alpha = fige ? 0.32 : 0.25 + 0.15 * Math.sin(maintenant / 366);
      effets.mettreAJour(maintenant, fige);
      if (!c) return;
      if (theatrePeint !== c.setup.theatre) peindreFond();
      const alpha = combatRuntime.alpha(maintenant);
      const s = c.state;

      for (const u of s.units) {
        let forme = unites.get(u.id);
        if (!forme) {
          const arme = weaponById(u.weapon)?.color ?? '#ffffff';
          forme = { ...formeUnite(u.line, arme, u.range / F), pv: -1 };
          unites.set(u.id, forme);
          coucheUnites.addChild(forme.racine);
        }
        forme.racine.visible = u.hp > 0;
        forme.racine.position.set(u.x / F, u.y / F);
        if (forme.pv !== u.hp) {
          forme.pv = u.hp;
          barreUnite(forme.barre, u.hp / u.maxHp);
          dessinerFleche(forme.corps, u.line);
        }
        forme.bouclier.visible = s.defenseBuff !== null;
      }

      const presents = new Set<number>();
      for (const e of s.enemies) {
        presents.add(e.id);
        let forme = ennemis.get(e.id);
        if (!forme) {
          forme = { ...formeEnnemi(e.threat), pv: -1, menace: e.threat };
          ennemis.set(e.id, forme);
          coucheEnnemis.addChild(forme.racine);
        }
        const p = position(e.id, e.x, e.y, alpha);
        forme.racine.position.set(p.x, p.y);
        forme.corps.rotation = Math.atan2(s.relic.y / F - p.y, s.relic.x / F - p.x);
        forme.glace.visible = e.frozen > 0;
        if (forme.barre && forme.pv !== e.hp) {
          forme.pv = e.hp;
          barreEnnemi(forme.barre, forme.menace, e.hp / e.maxHp);
        }
      }
      for (const [id, forme] of ennemis) {
        if (!presents.has(id)) {
          forme.racine.destroy({ children: true });
          ennemis.delete(id);
        }
      }
      dessinerDesignation(c);
    }

    app.ticker.add(rendre);

    return {
      start() {},
      stop() {},
      resize(width: number, height: number) {
        zone = { width, height };
        fit = fitInto(ARENE, zone);
        monde.scale.set(fit.scale);
        monde.position.set(fit.offsetX, fit.offsetY);
        peindreFond();
        rendre();
      },
      destroy() {
        desabonner();
        app.ticker.remove(rendre);
        app.canvas.removeEventListener('contextmenu', sansMenu);
      },
    };
  },
};
