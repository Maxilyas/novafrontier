import type { ScreenId } from '@nova/data';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { adresse, expectScreen, gotoScreen, mainNav, SCREENS } from './helpers';

/**
 * Story 1 : parcourir les 9 ecrans (FR-001 a FR-006, SC-001, contracts/routes.md).
 * Les donnees de jeu ne sont pas importees : les unites sont reperees par `data-unit`.
 */

type Action = (page: Page) => Promise<void>;

const nav =
  (libelle: string): Action =>
  (page) =>
    mainNav(page).getByRole('link', { name: libelle, exact: true }).click();

const lien =
  (libelle: string): Action =>
  (page) =>
    page.getByRole('link', { name: libelle, exact: true }).click();

/**
 * Bouton "Fiche" d'une carte des effectifs d'Escouades (FR-004). Il apparait au survol de la
 * carte (research R16) : le survol precede le clic et ne compte pas comme une action.
 */
const fiche =
  (unite: string): Action =>
  async (page) => {
    const carte = page
      .locator('[data-screen="escouades"] .card-wrap')
      .filter({ has: page.locator(`[data-unit="${unite}"]`) });
    await carte.hover();
    await carte.getByRole('button', { name: /^Fiche/ }).click();
  };

/** Chemins du jeu depuis l'ouverture de l'application, sans barre d'adresse (SC-001). */
const PARCOURS: Record<ScreenId, Action[]> = {
  escouades: [],
  atlas: [fiche('c1')],
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

const ACTIONS_MAX: Record<ScreenId, number> = {
  escouades: 0,
  atlas: 1,
  base: 1,
  recherche: 1,
  carte: 1,
  briefing: 2,
  deploiement: 3,
  combat: 4,
  butin: 1,
};

/** Entree de la navigation principale mise en evidence (FR-003). */
const SECTION: Record<ScreenId, string> = {
  escouades: 'Escouades',
  atlas: 'Escouades',
  base: 'Base',
  recherche: 'Recherche',
  carte: 'Carte',
  briefing: 'Carte',
  deploiement: 'Carte',
  combat: 'Carte',
  butin: 'Butin',
};

async function expectSection(page: Page, libelle: string): Promise<void> {
  const courante = mainNav(page).locator('[aria-current="page"]');
  await expect(courante).toHaveCount(1);
  await expect(courante).toHaveText(libelle);
  await expect(courante).toHaveClass(/\bon\b/);
}

/** Un seul ecran monte, et le bandeau superieur reste en place (FR-002). */
async function expectSeul(page: Page, ecran: ScreenId): Promise<void> {
  await expectScreen(page, ecran);
  await expect(page.locator('[data-screen]')).toHaveCount(1);
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(mainNav(page)).toBeVisible();
}

test.describe('story 1 : parcourir les 9 ecrans', () => {
  test("scenario 1 : l'application s'ouvre sur Escouades", async ({ page }) => {
    await page.goto('/');
    await expectSeul(page, 'escouades');
    await expect(page).toHaveURL(/#\/escouades$/);
    await expectSection(page, 'Escouades');
  });

  test('scenario 2 : la navigation principale remplace l ecran, le bandeau reste', async ({
    page,
  }) => {
    await gotoScreen(page, 'combat');
    for (const [ecran, libelle] of [
      ['base', 'Base'],
      ['recherche', 'Recherche'],
      ['carte', 'Carte'],
      ['butin', 'Butin'],
      ['escouades', 'Escouades'],
    ] as const) {
      await nav(libelle)(page);
      await expectSeul(page, ecran);
      await expect(page).toHaveURL(new RegExp(`#/${ecran}$`));
      await expectSection(page, libelle);
    }
  });

  test("scenario 3 : la fiche d'une unite ouvre l'Atlas sur cette unite", async ({ page }) => {
    await gotoScreen(page, 'escouades');
    await fiche('c2')(page);
    await expectSeul(page, 'atlas');
    await expect(page).toHaveURL(/#\/atlas\/c2$/);
    await expect(page.locator('[data-screen="atlas"] [data-unit="c2"]').first()).toBeVisible();
    await expectSection(page, 'Escouades');
  });

  test('scenario 4 : le parcours de mission mene de la Carte au Combat', async ({ page }) => {
    await gotoScreen(page, 'carte');
    await lien("Préparer l'assaut")(page);
    await expectSeul(page, 'briefing');
    await expect(page.locator('[data-screen="briefing"] .tag')).toContainText('ASSAUT SUR GEMENON');
    await expectSection(page, 'Carte');

    await lien('Passer au déploiement')(page);
    await expectSeul(page, 'deploiement');
    await expectSection(page, 'Carte');

    await lien('Lancer le combat')(page);
    await expectSeul(page, 'combat');
    await expectSection(page, 'Carte');
  });

  test("scenario 4 : Espionner et l'operation proposee menent aussi au Briefing", async ({
    page,
  }) => {
    for (const commande of ['Espionner', 'Assaut sur Gemenon']) {
      await gotoScreen(page, 'carte');
      await page
        .locator('[data-screen="carte"]')
        .getByRole('link', { name: new RegExp(`^${commande}`, 'i') })
        .click();
      await expectSeul(page, 'briefing');
    }
  });

  test('scenario 5 : Precedent ramene a l ecran precedent', async ({ page }) => {
    await page.goto('/');
    await expectScreen(page, 'escouades');
    await nav('Base')(page);
    await expectScreen(page, 'base');
    await nav('Carte')(page);
    await expectScreen(page, 'carte');
    await lien("Préparer l'assaut")(page);
    await expectScreen(page, 'briefing');

    await page.goBack();
    await expectSeul(page, 'carte');
    await page.goBack();
    await expectSeul(page, 'base');
    await page.goBack();
    await expectSeul(page, 'escouades');
    await page.goForward();
    await expectSeul(page, 'base');
  });

  for (const ecran of SCREENS) {
    test(`scenario 6 : ${ecran} s'ouvre par son adresse et au rechargement`, async ({ page }) => {
      await page.goto(adresse(ecran));
      await expectSeul(page, ecran);
      await expectSection(page, SECTION[ecran]);
      await page.reload();
      await expectSeul(page, ecran);
      await expectSection(page, SECTION[ecran]);
    });
  }
});

test.describe('SC-001 : chaque ecran en 4 actions au plus', () => {
  for (const ecran of SCREENS) {
    test(`${ecran} en ${ACTIONS_MAX[ecran]} action(s)`, async ({ page }) => {
      expect(PARCOURS[ecran]).toHaveLength(ACTIONS_MAX[ecran]);
      await page.goto('/');
      await expectScreen(page, 'escouades');
      for (const action of PARCOURS[ecran]) await action(page);
      await expectSeul(page, ecran);
      await expectSection(page, SECTION[ecran]);
    });
  }
});

test.describe('adresses inconnues (contracts/routes.md, regles 1 et 2)', () => {
  test('#/inconnu est remplace par #/escouades sans nouvelle entree', async ({ page }) => {
    await gotoScreen(page, 'base');
    const avant = await page.evaluate(() => history.length);
    await page.evaluate(() => {
      window.location.hash = '#/inconnu';
    });
    await expectSeul(page, 'escouades');
    await expect(page).toHaveURL(/#\/escouades$/);
    // Seule la navigation demandee ajoute une entree ; la redirection la remplace.
    expect(await page.evaluate(() => history.length)).toBe(avant + 1);
    await page.goBack();
    await expectSeul(page, 'base');
  });

  test('une adresse vide ou inconnue a l ouverture mene a Escouades', async ({ page }) => {
    for (const fragment of ['', '#', '#/', '#/inconnu', '#/escouades/xyz']) {
      await page.goto(`/${fragment}`);
      await expectSeul(page, 'escouades');
      await expect(page).toHaveURL(/#\/escouades$/);
    }
  });

  test('#/atlas/zz est remplace par #/atlas/s1', async ({ page }) => {
    await page.goto('/#/atlas/zz');
    await expectSeul(page, 'atlas');
    await expect(page).toHaveURL(/#\/atlas\/s1$/);
    await expect(page.locator('[data-screen="atlas"] [data-unit="s1"]').first()).toBeVisible();
  });

  test('#/atlas sans unite ouvre s1', async ({ page }) => {
    await page.goto('/#/atlas');
    await expectSeul(page, 'atlas');
    await expect(page).toHaveURL(/#\/atlas\/s1$/);
  });
});
