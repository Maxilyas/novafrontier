import { enemyArchetypes, type Threat } from '@nova/data';
import { Container, Graphics, Sprite, Texture } from 'pixi.js';

/**
 * Formes provisoires du combat (contracts/scenes.md), reprises du dessin de `combatLoop` (lignes
 * 2208-2264). Coordonnees en unites d'arene ; le monde est mis a l'echelle par fit.ts.
 */

export const LIGNE_COULEUR = { front: 0xe8543f, back: 0x63d6bc } as const;
const HEX = (c: string) => Number.parseInt(c.slice(1), 16);

/** Fond peint sur une toile reduite puis etire (comme la scene provisoire de la phase P0). */
export function creerFond(): {
  sprite: Sprite;
  peindre(
    largeur: number,
    hauteur: number,
    theatre: 'orbital' | 'sol',
    centre: { x: number; y: number },
    rayon: number,
  ): void;
} {
  const toile = document.createElement('canvas');
  const texture = Texture.from(toile);
  const sprite = new Sprite(texture);
  const REDUCTION = 4;
  return {
    sprite,
    peindre(largeur, hauteur, theatre, centre, rayon) {
      const l = Math.max(1, Math.ceil(largeur / REDUCTION));
      const h = Math.max(1, Math.ceil(hauteur / REDUCTION));
      texture.source.resize(l, h, 1);
      const ctx = toile.getContext('2d');
      if (!ctx) return;
      if (theatre === 'orbital') {
        const g = ctx.createRadialGradient(
          centre.x / REDUCTION,
          centre.y / REDUCTION,
          30 / REDUCTION,
          centre.x / REDUCTION,
          centre.y / REDUCTION,
          Math.max(1, rayon / REDUCTION),
        );
        g.addColorStop(0, '#0a1620');
        g.addColorStop(0.45, '#050a10');
        g.addColorStop(1, '#010203');
        ctx.fillStyle = g;
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#111a15');
        g.addColorStop(1, '#1a1b11');
        ctx.fillStyle = g;
      }
      ctx.fillRect(0, 0, l, h);
      texture.source.update();
      sprite.width = largeur;
      sprite.height = hauteur;
    },
  };
}

/** 300 etoiles fixes de la maquette (positions et opacites deterministes, ligne 2213). */
export function etoiles(largeur: number, hauteur: number): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 300; i += 1) {
    g.rect((i * 173) % largeur, (i * 97) % hauteur, 1, 1).fill({
      color: 0xc8dcff,
      alpha: 0.08 + ((i * 37) % 40) / 140,
    });
  }
  return g;
}

/** Relique : hexagone dore ; l'anneau pulse est un Graphics a part, dont la scene regle l'opacite. */
export function relique(): { corps: Graphics; anneau: Graphics } {
  const corps = new Graphics();
  const points: number[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    points.push(Math.cos(a) * 30, Math.sin(a) * 30);
  }
  corps.poly(points).fill({ color: 0xf5a623, alpha: 0.16 }).stroke({ width: 2, color: 0xf5a623 });
  const anneau = new Graphics().circle(0, 0, 58).stroke({ width: 1, color: 0xf5a623 });
  return { corps, anneau };
}

export interface FormeUnite {
  readonly racine: Container;
  readonly corps: Graphics;
  readonly barre: Graphics;
  readonly bouclier: Graphics;
}

/** Unite du joueur : fleche de la couleur de sa ligne, barre de PV, trait d'armement, portee. */
export function unite(ligne: 'front' | 'back', couleurArme: string, portee: number): FormeUnite {
  const racine = new Container();
  const portees = new Graphics()
    .circle(0, 0, portee)
    .stroke({ width: 1, color: 0x63d6bc, alpha: 0.05 });
  const corps = new Graphics();
  dessinerFleche(corps, ligne);
  const arme = new Graphics().rect(-16, 12, 32, 2).fill({ color: HEX(couleurArme) });
  const bouclier = new Graphics()
    .circle(0, 0, 19)
    .stroke({ width: 1, color: 0x63d6bc, alpha: 0.55 });
  bouclier.visible = false;
  const barre = new Graphics();
  racine.addChild(portees, corps, arme, bouclier, barre);
  return { racine, corps, barre, bouclier };
}

export function dessinerFleche(g: Graphics, ligne: 'front' | 'back'): void {
  g.clear()
    .poly([0, -13, 10, 8, 0, 4, -10, 8])
    .fill({ color: 0x16201d, alpha: 0.95 })
    .stroke({ width: 1.5, color: LIGNE_COULEUR[ligne] });
}

export function barreUnite(g: Graphics, fraction: number): void {
  g.clear()
    .rect(-16, -24, 32, 3.5)
    .fill({ color: 0x000000, alpha: 0.6 })
    .rect(-16, -24, 32 * fraction, 3.5)
    .fill({ color: fraction > 0.4 ? 0x9fd15a : 0xe8543f });
}

export interface FormeEnnemi {
  readonly racine: Container;
  readonly corps: Graphics;
  readonly barre: Graphics | undefined;
  readonly glace: Graphics;
}

/** Ennemi : pointe orientee vers la relique, taille et couleur de son archetype. */
export function ennemi(menace: Threat): FormeEnnemi {
  const a = enemyArchetypes[menace];
  const sz = a.size;
  const couleur = HEX(a.color);
  const racine = new Container();
  const corps = new Graphics()
    .poly([-sz, -sz * 0.6, sz, 0, -sz, sz * 0.6, -sz * 0.5, 0])
    .fill({ color: 0x231412, alpha: 0.95 })
    .stroke({ width: 1.3, color: couleur });
  const glace = new Graphics().circle(0, 0, sz + 5).stroke({ width: 1, color: 0xb479ff });
  glace.visible = false;
  racine.addChild(corps, glace);
  // Barre de PV pour les menaces moyenne, lourde et le boss (maquette : PV max > 200).
  const barre = a.hp > 200 ? new Graphics() : undefined;
  if (barre) racine.addChild(barre);
  return { racine, corps, barre, glace };
}

export function barreEnnemi(g: Graphics, menace: Threat, fraction: number): void {
  const a = enemyArchetypes[menace];
  g.clear()
    .rect(-16, -a.size - 8, 32, 3)
    .fill({ color: 0x000000, alpha: 0.6 })
    .rect(-16, -a.size - 8, 32 * fraction, 3)
    .fill({ color: HEX(a.color) });
}
