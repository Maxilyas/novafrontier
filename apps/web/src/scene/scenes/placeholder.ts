import { type Application, Container, Sprite, Texture, type Ticker } from 'pixi.js';
import type { SceneModule } from '../types';

/**
 * Contenu provisoire des trois scenes (FR-022) : le degrade du fond du plateau de la maquette
 * (drawDeploy, lignes 1997-1999) et environ 300 etoiles qui derivent lentement. Les etoiles sont
 * placees par un generateur a graine : le meme ciel a chaque ouverture.
 */

const ETOILES = 300;
const GRAINE = 0x5eed;
/** Le degrade est peint au quart de la taille de la zone, puis etire : il reste lisse. */
const REDUCTION_FOND = 4;

/** Generateur pseudo-aleatoire mulberry32, reproductible pour une graine donnee. */
function mulberry32(graine: number): () => number {
  let etat = graine;
  return () => {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const placeholder: SceneModule = {
  create(app: Application) {
    const hasard = mulberry32(GRAINE);

    const toile = document.createElement('canvas');
    const texture = Texture.from(toile);
    const fond = new Sprite(texture);
    const ciel = new Container();
    const etoiles = Array.from({ length: ETOILES }, () => {
      const sprite = new Sprite(Texture.WHITE);
      sprite.width = 1;
      sprite.height = 1;
      sprite.tint = 0xc8dcff;
      sprite.alpha = 0.1 + hasard() * 0.35;
      ciel.addChild(sprite);
      // Position relative a la zone, et vitesse de derive en px/s.
      return { sprite, u: hasard(), v: hasard(), vitesse: 2 + hasard() * 6 };
    });
    app.stage.addChild(fond, ciel);

    let largeur = 1;
    let hauteur = 1;
    let temps = 0;

    function placer(): void {
      for (const etoile of etoiles) {
        let x = (etoile.u * largeur - temps * etoile.vitesse) % largeur;
        if (x < 0) x += largeur;
        etoile.sprite.position.set(Math.round(x), Math.round(etoile.v * hauteur));
      }
    }

    function peindreFond(): void {
      const l = Math.max(1, Math.ceil(largeur / REDUCTION_FOND));
      const h = Math.max(1, Math.ceil(hauteur / REDUCTION_FOND));
      texture.source.resize(l, h, 1);
      const ctx = toile.getContext('2d');
      if (!ctx) return;
      const degrade = ctx.createRadialGradient(
        l / 2,
        h / 2,
        20 / REDUCTION_FOND,
        l / 2,
        h / 2,
        Math.max(l, h) * 0.57,
      );
      degrade.addColorStop(0, '#0a1720');
      degrade.addColorStop(0.5, '#050b10');
      degrade.addColorStop(1, '#020405');
      ctx.fillStyle = degrade;
      ctx.fillRect(0, 0, l, h);
      texture.source.update();
      fond.width = largeur;
      fond.height = hauteur;
    }

    const deriver = (ticker: Ticker) => {
      temps += ticker.deltaMS / 1000;
      placer();
    };

    return {
      start() {
        app.ticker.add(deriver);
      },
      stop() {
        app.ticker.remove(deriver);
      },
      resize(width: number, height: number) {
        largeur = Math.max(1, width);
        hauteur = Math.max(1, height);
        peindreFond();
        placer();
      },
      destroy() {
        app.ticker.remove(deriver);
        app.stage.removeChild(fond, ciel);
        ciel.destroy({ children: true });
        fond.destroy();
        texture.destroy(true);
      },
    };
  },
};
