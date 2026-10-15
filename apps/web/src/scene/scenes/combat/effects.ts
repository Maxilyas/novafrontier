import { Container, Graphics } from 'pixi.js';

/**
 * Effets ephemeres du combat (contracts/scenes.md) : tirs, destructions, effets de competence,
 * dans des pools de Graphics reutilises. Durees de la maquette a 60 images/s : tir 0,15 s,
 * destruction 0,27 s, competence 0,5 s.
 */

interface Effet {
  g: Graphics;
  debut: number;
  duree: number;
  dessiner(g: Graphics, avancement: number): void;
}

export interface Effets {
  readonly couche: Container;
  tir(de: Point, vers: Point, couleur: number, manque: boolean, maintenant: number): void;
  destruction(en: Point, boss: boolean, maintenant: number): void;
  anneau(en: Point, rayon: number, couleur: number, maintenant: number): void;
  /** Avance les effets ; `fige` : animations reduites, chaque effet reste dans son etat final. */
  mettreAJour(maintenant: number, fige: boolean): void;
  vider(): void;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

export function creerEffets(): Effets {
  const couche = new Container();
  const actifs: Effet[] = [];
  const libres: Graphics[] = [];

  const prendre = () => {
    const g = libres.pop() ?? new Graphics();
    g.visible = true;
    if (!g.parent) couche.addChild(g);
    return g;
  };

  const ajouter = (duree: number, maintenant: number, dessiner: Effet['dessiner']) => {
    actifs.push({ g: prendre(), debut: maintenant, duree, dessiner });
  };

  return {
    couche,
    tir(de, vers, couleur, manque, maintenant) {
      ajouter(150, maintenant, (g, t) => {
        g.clear();
        const alpha = 1 - t;
        if (!manque) {
          g.moveTo(de.x, de.y).lineTo(vers.x, vers.y).stroke({ width: 1.8, color: couleur, alpha });
          return;
        }
        // Tir manque (Fumigene) : pointilles qui devient et s'arretent court.
        const dx = vers.x - de.x;
        const dy = vers.y - de.y;
        const fin = { x: de.x + dx * 0.7 - dy * 0.12, y: de.y + dy * 0.7 + dx * 0.12 };
        for (let i = 0; i < 4; i += 1) {
          const a = i / 4;
          const b = a + 0.14;
          g.moveTo(de.x + (fin.x - de.x) * a, de.y + (fin.y - de.y) * a)
            .lineTo(de.x + (fin.x - de.x) * b, de.y + (fin.y - de.y) * b)
            .stroke({ width: 1.4, color: couleur, alpha: alpha * 0.8 });
        }
      });
    },
    destruction(en, boss, maintenant) {
      ajouter(270, maintenant, (g, t) => {
        g.clear()
          .circle(en.x, en.y, t * 16 * (boss ? 5 : 2.6))
          .stroke({ width: 2, color: 0xf5a623, alpha: 1 - t });
      });
    },
    anneau(en, rayon, couleur, maintenant) {
      ajouter(500, maintenant, (g, t) => {
        g.clear()
          .circle(en.x, en.y, rayon * t + 10)
          .stroke({ width: 2, color: couleur, alpha: 1 - t });
      });
    },
    mettreAJour(maintenant, fige) {
      for (let i = actifs.length - 1; i >= 0; i -= 1) {
        const e = actifs[i];
        if (!e) continue;
        const t = Math.min(1, (maintenant - e.debut) / e.duree);
        if (t >= 1) {
          e.g.clear();
          e.g.visible = false;
          libres.push(e.g);
          actifs.splice(i, 1);
          continue;
        }
        e.dessiner(e.g, fige ? 0.5 : t);
      }
    },
    vider() {
      for (const e of actifs) {
        e.g.clear();
        e.g.visible = false;
        libres.push(e.g);
      }
      actifs.length = 0;
    },
  };
}
