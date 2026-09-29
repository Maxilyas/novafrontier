import type { ScreenId } from '@nova/data';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
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

/** Une commande a atteindre au clavier, et l'ecran qu'elle ouvre. */
interface Etape {
  cible: (page: Page) => Locator;
  ecran: ScreenId;
}

const nav = (libelle: string, ecran: ScreenId): Etape => ({
  cible: (page) => mainNav(page).getByRole('link', { name: libelle, exact: true }),
  ecran,
});

const lien = (libelle: string, ecran: ScreenId): Etape => ({
  cible: (page) => page.getByRole('link', { name: libelle, exact: true }),
  ecran,
});

const VERS_BRIEFING = [nav('Carte', 'carte'), lien("Préparer l'assaut", 'briefing')];
const VERS_DEPLOIEMENT = [...VERS_BRIEFING, lien('Passer au déploiement', 'deploiement')];

const PARCOURS: Record<ScreenId, Etape[]> = {
  escouades: [nav('Base', 'base'), nav('Escouades', 'escouades')],
  atlas: [
    {
      cible: (page) =>
        page
          .locator('[data-screen="escouades"] .card-wrap')
          .first()
          .getByRole('button', { name: /^Fiche/ }),
      ecran: 'atlas',
    },
  ],
  base: [nav('Base', 'base')],
  recherche: [nav('Recherche', 'recherche')],
  carte: [nav('Carte', 'carte')],
  briefing: VERS_BRIEFING,
  deploiement: VERS_DEPLOIEMENT,
  combat: [...VERS_DEPLOIEMENT, lien('Lancer le combat', 'combat')],
  butin: [nav('Butin', 'butin')],
};

/**
 * Le test verifie le contour lui-meme, pas son apparition : les transitions de la maquette (0,14 s
 * sur les boutons et la navigation) sont coupees, sinon chaque tabulation attendrait leur fin. Les
 * scenes sont immobiles (voir plus bas) pour la meme raison.
 */
async function ouvrir(page: Page, adresse: string): Promise<void> {
  await page.goto(adresse);
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; }',
  });
}

test.describe('SC-013 : les 9 ecrans au clavier seul', () => {
  // Scenes immobiles (FR-035) : en rendu logiciel, une scene animee retarde chaque tabulation
  // d'une image ou deux, soit des dizaines de secondes par parcours sur la CI.
  test.use({ reducedMotion: 'reduce' });
  test.describe.configure({ timeout: 60_000 });

  for (const ecran of SCREENS) {
    test(`${ecran} atteint par Tab et Entree`, async ({ page }) => {
      await ouvrir(page, '/');
      await expectScreen(page, 'escouades');
      for (const etape of PARCOURS[ecran]) {
        await activerAuClavier(page, etape.cible(page));
        // Attendre le nouvel ecran avant de tabuler de nouveau.
        await expectScreen(page, etape.ecran);
      }
      await expectScreen(page, ecran);
    });
  }

  test('le focus passe au nouvel ecran quand la commande activee disparait', async ({ page }) => {
    await ouvrir(page, '/#/carte');
    await expectScreen(page, 'carte');
    await activerAuClavier(page, lien("Préparer l'assaut", 'briefing').cible(page));
    await expectScreen(page, 'briefing');
    await expect(page.locator('[data-screen="briefing"]')).toBeFocused();
  });
});
