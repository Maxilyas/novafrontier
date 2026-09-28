import type { ScreenId } from '@nova/data';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { expectScreen, mainNav, SCREENS } from './helpers';

/**
 * SC-013, partie navigation : les 9 ecrans atteints au clavier seul (Tab, Entree), avec un
 * contour de focus visible a chaque etape (FR-034).
 */

const TABULATIONS_MAX = 150;

interface EtatFocus {
  /** Aucun element n'a le focus (retour au debut du document apres le dernier element). */
  vide: boolean;
  visible: boolean;
  description: string;
}

/**
 * Le contour de la maquette (`:focus-visible`, 2 px) doit se voir : un element aux coins coupes
 * (clip-path) le dessine a l'interieur, sinon la decoupe l'effacerait.
 */
const etatFocus = (page: Page): Promise<EtatFocus> =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement) || el === document.body) {
      return { vide: true, visible: false, description: 'aucun' };
    }
    const style = getComputedStyle(el);
    const boite = el.getBoundingClientRect();
    const visible =
      el.matches(':focus-visible') &&
      style.outlineStyle !== 'none' &&
      Number.parseFloat(style.outlineWidth) >= 2 &&
      (style.clipPath === 'none' || Number.parseFloat(style.outlineOffset) < 0) &&
      Number.parseFloat(style.opacity) > 0 &&
      boite.width > 0 &&
      boite.height > 0;
    return { vide: false, visible, description: el.outerHTML.slice(0, 160) };
  });

/** Tabule jusqu'a la cible en verifiant le contour a chaque etape, puis l'active par Entree. */
async function activerAuClavier(page: Page, cible: Locator): Promise<void> {
  for (let i = 0; i < TABULATIONS_MAX; i++) {
    await page.keyboard.press('Tab');
    const etat = await etatFocus(page);
    if (etat.vide) continue;
    // Le contour s'installe avec la transition de 0,14 s de la maquette (.btn, navigation).
    await expect
      .poll(async () => (await etatFocus(page)).visible, {
        message: `contour de focus invisible sur ${etat.description}`,
        timeout: 1000,
      })
      .toBe(true);
    if (await cible.evaluate((el) => el === document.activeElement)) {
      await page.keyboard.press('Enter');
      return;
    }
  }
  throw new Error(`cible non atteinte en ${TABULATIONS_MAX} tabulations`);
}

type Etape = (page: Page) => Locator;

const nav =
  (libelle: string): Etape =>
  (page) =>
    mainNav(page).getByRole('link', { name: libelle, exact: true });

const lien =
  (libelle: string): Etape =>
  (page) =>
    page.getByRole('link', { name: libelle, exact: true });

const PARCOURS: Record<ScreenId, Etape[]> = {
  escouades: [nav('Base'), nav('Escouades')],
  atlas: [
    (page) =>
      page
        .locator('[data-screen="escouades"] .card-wrap')
        .first()
        .getByRole('button', { name: /^Fiche/ }),
  ],
  base: [nav('Base')],
  recherche: [nav('Recherche')],
  carte: [nav('Carte')],
  briefing: [nav('Carte'), lien("Préparer l'assaut")],
  deploiement: [nav('Carte'), lien("Préparer l'assaut"), lien('Passer au déploiement')],
  combat: [
    nav('Carte'),
    lien("Préparer l'assaut"),
    lien('Passer au déploiement'),
    lien('Lancer le combat'),
  ],
  butin: [nav('Butin')],
};

test.describe('SC-013 : les 9 ecrans au clavier seul', () => {
  for (const ecran of SCREENS) {
    test(`${ecran} atteint par Tab et Entree`, async ({ page }) => {
      await page.goto('/');
      await expectScreen(page, 'escouades');
      for (const etape of PARCOURS[ecran]) await activerAuClavier(page, etape(page));
      await expectScreen(page, ecran);
    });
  }

  test('le focus passe au nouvel ecran quand la commande activee disparait', async ({ page }) => {
    await page.goto('/#/carte');
    await expectScreen(page, 'carte');
    await activerAuClavier(page, lien("Préparer l'assaut")(page));
    await expectScreen(page, 'briefing');
    await expect(page.locator('[data-screen="briefing"]')).toBeFocused();
  });
});
