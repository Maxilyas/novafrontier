import { combatTuning, type Formation, type Theatre } from '@nova/data';
import { formationSlots } from '@nova/sim';
import { type Application, Container, Graphics } from 'pixi.js';
import type { SceneModule } from '../../types';
import { creerFond } from '../combat/draw';
import { type Fit, fitInto } from '../fit';
import { board, onBoardChange } from './board';

/**
 * Scene du plateau de deploiement (FR-037, contracts/scenes.md, research R18), d'apres `drawDeploy`
 * (lignes 1992-2045) : fond du theatre, lignes en pointilles, fleches d'arrivee ennemie et relique.
 * Les emplacements et tous les textes sont en DOM, par-dessus (SlotButtons.svelte), ou ils se
 * designent a la souris, au clavier et au glisser-deposer.
 */

const F = 65536;
const PLATEAU = combatTuning.board;

/** Pointilles 5/7 le long d'une suite de points (la maquette : setLineDash([5, 7])). */
function pointilles(g: Graphics, points: readonly { x: number; y: number }[], ferme: boolean) {
  const suite = ferme && points[0] ? [...points, points[0]] : points;
  let enTrait = true;
  let reste = 5;
  for (let i = 1; i < suite.length; i += 1) {
    const a = suite[i - 1];
    const b = suite[i];
    if (!a || !b) continue;
    const longueur = Math.hypot(b.x - a.x, b.y - a.y);
    let fait = 0;
    while (fait < longueur) {
      const pas = Math.min(reste, longueur - fait);
      const t0 = fait / longueur;
      const t1 = (fait + pas) / longueur;
      if (enTrait) {
        g.moveTo(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0).lineTo(
          a.x + (b.x - a.x) * t1,
          a.y + (b.y - a.y) * t1,
        );
      }
      fait += pas;
      reste -= pas;
      if (reste <= 0) {
        enTrait = !enTrait;
        reste = enTrait ? 5 : 7;
      }
    }
  }
}

function dessiner(lignes: Graphics, fleches: Graphics, formation: Formation, theatre: Theatre) {
  const obj = PLATEAU.objective[formation];
  const slots = formationSlots(formation, theatre);
  lignes.clear();
  for (const [ligne, couleur, alpha] of [
    ['front', 0xe8543f, 0.28],
    ['back', 0x63d6bc, 0.24],
  ] as const) {
    const points = slots
      .filter((s) => s.line === ligne)
      .map((s) => ({ x: s.board.x / F, y: s.board.y / F }));
    if (points.length === 0) continue;
    if (formation === 'ring') {
      const r = combatTuning.slots.ring[ligne].radius;
      const cercle = Array.from({ length: 96 }, (_, i) => ({
        x: obj.x + Math.cos((i / 96) * Math.PI * 2) * r,
        y: obj.y + Math.sin((i / 96) * Math.PI * 2) * r,
      }));
      pointilles(lignes, cercle, true);
    } else {
      pointilles(lignes, points, false);
    }
    lignes.stroke({ width: 1, color: couleur, alpha });
  }

  // Fleches d'arrivee ennemie : 8 directions en 360 degres, 3 depuis l'ouest en arc.
  fleches.clear();
  const angles =
    formation === 'ring'
      ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (i * Math.PI) / 4)
      : [0, 0.28, -0.28].map((a) => Math.PI + a);
  const [depart, arrivee] = formation === 'ring' ? [330, 290] : [430, 380];
  for (const a of angles) {
    const sx = obj.x + Math.cos(a) * depart;
    const sy = obj.y + Math.sin(a) * depart;
    const ex = obj.x + Math.cos(a) * arrivee;
    const ey = obj.y + Math.sin(a) * arrivee;
    fleches.moveTo(sx, sy).lineTo(ex, ey).stroke({ width: 1.4, color: 0xe8543f, alpha: 0.5 });
    fleches.circle(ex, ey, 3).fill({ color: 0xe8543f, alpha: 0.5 });
  }
}

function relique(): { racine: Container; anneau: Graphics } {
  const racine = new Container();
  const anneau = new Graphics().circle(0, 0, 52).stroke({ width: 1, color: 0xf5a623, alpha: 0.5 });
  const hexagone = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      return [Math.cos(a) * r, Math.sin(a) * r];
    }).flat();
  const corps = new Graphics()
    .poly(hexagone(28))
    .fill({ color: 0xf5a623, alpha: 0.14 })
    .stroke({ width: 2, color: 0xf5a623 })
    .poly(hexagone(11))
    .fill({ color: 0xf5a623 });
  racine.addChild(anneau, corps);
  return { racine, anneau };
}

/** 260 etoiles fixes (ligne 2000) ; leur opacite, tiree au hasard dans la maquette, est fixee ici. */
function etoiles(): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 260; i += 1) {
    g.rect((i * 137) % PLATEAU.width, (i * 211) % PLATEAU.height, 1, 1).fill({
      color: 0xc8dcff,
      alpha: 0.1 + ((i * 53) % 35) / 100,
    });
  }
  return g;
}

/** Quadrillage de 44 unites du combat terrestre (lignes 2005-2007). */
function quadrillage(): Graphics {
  const g = new Graphics();
  for (let x = 0; x < PLATEAU.width; x += 44) g.moveTo(x, 0).lineTo(x, PLATEAU.height);
  for (let y = 0; y < PLATEAU.height; y += 44) g.moveTo(0, y).lineTo(PLATEAU.width, y);
  g.stroke({ width: 1, color: 0x788c6e, alpha: 0.07 });
  return g;
}

export const deployScene: SceneModule = {
  create(app: Application) {
    const fond = creerFond();
    const monde = new Container();
    const ciel = etoiles();
    const grille = quadrillage();
    const lignes = new Graphics();
    const fleches = new Graphics();
    const { racine: coeur, anneau } = relique();
    monde.addChild(ciel, grille, lignes, fleches, coeur);
    app.stage.addChild(fond.sprite, monde);

    let zone = { width: 1, height: 1 };
    let fit: Fit = fitInto(PLATEAU, zone);
    let version = -1;

    function peindre(): void {
      const { formation, theatre } = board;
      const obj = PLATEAU.objective[formation];
      fond.peindre(
        zone.width,
        zone.height,
        theatre,
        { x: fit.offsetX + obj.x * fit.scale, y: fit.offsetY + obj.y * fit.scale },
        560 * fit.scale,
      );
      ciel.visible = theatre === 'orbital';
      grille.visible = theatre === 'sol';
      coeur.position.set(obj.x, obj.y);
      dessiner(lignes, fleches, formation, theatre);
      version = board.version;
    }

    function rendre(): void {
      if (version !== board.version) peindre();
      // Anneau de la relique qui respire (ligne 2036) ; immobile quand les animations sont reduites,
      // la scene ne s'animant alors plus (renderer.ts).
      anneau.scale.set(1 + Math.sin(performance.now() / 500) * (3 / 52));
    }

    app.ticker.add(rendre);
    // Changement de formation ou de theatre : nouvelle image tout de suite, que la scene s'anime ou
    // non (animations reduites : le ticker est arrete).
    const desabonner = onBoardChange(() => {
      peindre();
      app.render();
    });

    return {
      start() {},
      stop() {},
      resize(width: number, height: number) {
        zone = { width, height };
        fit = fitInto(PLATEAU, zone);
        monde.scale.set(fit.scale);
        monde.position.set(fit.offsetX, fit.offsetY);
        peindre();
      },
      destroy() {
        desabonner();
        app.ticker.remove(rendre);
      },
    };
  },
};
