import type { ScreenId } from '@nova/data';
import { expect, type Page, test } from '@playwright/test';
import { gotoScreen, SCREENS } from './helpers';

/**
 * Story 4 et SC-007 : l'interface occupe toute la fenetre de 1280x720 a 2560x1440, sans
 * chevauchement de panneaux ni defilement de la page ; en dessous, la page defile (FR-029 a
 * FR-031).
 */

const TAILLES = [
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
];

interface Bilan {
  defilementHorizontal: boolean;
  defilementVertical: boolean;
  racine: { largeur: number; hauteur: number };
  chevauchements: string[];
  /** Panneaux qui depassent de l'ecran sans conteneur defilant pour les atteindre. */
  inaccessibles: string[];
  panneaux: number;
}

/** Panneaux visibles de l'ecran qui se recouvrent deux a deux (au-dela d'un pixel). */
const bilan = (page: Page, ecran: ScreenId): Promise<Bilan> =>
  page.evaluate((ecran) => {
    const nom = (el: Element) =>
      `${el.className.toString().split(' ').slice(0, 3).join('.')} "${(el.textContent ?? '').trim().slice(0, 24)}"`;
    const panneaux = [...document.querySelectorAll(`[data-screen="${ecran}"] [data-panel]`)]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.height > 0);
    const chevauchements: string[] = [];
    for (let i = 0; i < panneaux.length; i++) {
      for (let j = i + 1; j < panneaux.length; j++) {
        const a = panneaux[i];
        const b = panneaux[j];
        if (!a || !b) continue;
        const l = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (l > 1 && h > 1) chevauchements.push(`${nom(a.el)} / ${nom(b.el)}`);
      }
    }
    const zone = document.querySelector(`[data-screen="${ecran}"]`);
    const cadre = zone?.getBoundingClientRect();
    const defilable = (el: Element) => {
      for (let p = el.parentElement; p && p !== zone; p = p.parentElement) {
        const style = getComputedStyle(p);
        if (/(auto|scroll)/.test(style.overflowY + style.overflowX)) return true;
      }
      return false;
    };
    const inaccessibles = cadre
      ? panneaux
          .filter(
            ({ r }) =>
              r.left < cadre.left - 1 ||
              r.top < cadre.top - 1 ||
              r.right > cadre.right + 1 ||
              r.bottom > cadre.bottom + 1,
          )
          .filter(({ el }) => !defilable(el))
          .map(({ el }) => nom(el))
      : [];
    const racine = document.querySelector('.app')?.getBoundingClientRect();
    const doc = document.documentElement;
    return {
      defilementHorizontal: doc.scrollWidth > window.innerWidth,
      defilementVertical: doc.scrollHeight > window.innerHeight,
      racine: { largeur: racine?.width ?? 0, hauteur: racine?.height ?? 0 },
      chevauchements,
      inaccessibles,
      panneaux: panneaux.length,
    };
  }, ecran);

for (const taille of TAILLES) {
  test.describe(`${taille.width}x${taille.height}`, () => {
    test.use({ viewport: taille });

    for (const ecran of SCREENS) {
      test(`${ecran} occupe la fenetre, sans chevauchement`, async ({ page }) => {
        await gotoScreen(page, ecran);
        const resultat = await bilan(page, ecran);
        expect(resultat.panneaux).toBeGreaterThan(0);
        expect(resultat.chevauchements).toEqual([]);
        expect(resultat.inaccessibles).toEqual([]);
        expect(resultat.defilementHorizontal).toBe(false);
        expect(resultat.defilementVertical).toBe(false);
        expect(resultat.racine).toEqual({ largeur: taille.width, hauteur: taille.height });
      });
    }
  });
}

test.describe('1100x650, sous les dimensions minimales', () => {
  test.use({ viewport: { width: 1100, height: 650 } });

  for (const ecran of SCREENS) {
    test(`${ecran} garde ses dimensions minimales et la page defile`, async ({ page }) => {
      await gotoScreen(page, ecran);
      const resultat = await bilan(page, ecran);
      expect(resultat.chevauchements).toEqual([]);
      expect(resultat.defilementHorizontal).toBe(true);
      expect(resultat.defilementVertical).toBe(true);
      expect(resultat.racine).toEqual({ largeur: 1280, hauteur: 720 });
    });
  }
});
