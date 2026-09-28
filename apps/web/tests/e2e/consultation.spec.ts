import { readFileSync } from 'node:fs';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { gotoScreen, mainNav } from './helpers';

/**
 * Story 2, scenarios 2 a 4 et 7 a 9 : les commandes de consultation (FR-015 a FR-017) et les
 * valeurs derivees affichees (FR-013). Les valeurs attendues sont lues dans le fichier des
 * valeurs derivees, par fs : les tests Playwright n'importent pas @nova/data.
 */

interface Derivees {
  squads: Record<string, { power: number; unitCount: number }>;
  route: { distance: number };
  briefing: Record<string, { winChance: number | null }>;
  combat: { titles: Record<'orbital' | 'sol', string> };
}

const derivees: Derivees = JSON.parse(
  readFileSync(
    new URL('../../../../packages/data/src/demo/derived.generated.json', import.meta.url),
    'utf8',
  ),
);

/** Nombre a la francaise, quel que soit l'espace des milliers (2 566, 2 566...). */
const motif = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\\s');

const ecran = (page: Page, id: string): Locator => page.locator(`[data-screen="${id}"]`);

const lien = (page: Page, libelle: string) =>
  page.getByRole('link', { name: libelle, exact: true }).click();

async function versBriefing(page: Page): Promise<void> {
  await mainNav(page).getByRole('link', { name: 'Carte', exact: true }).click();
  await lien(page, "Préparer l'assaut");
  await expect(ecran(page, 'briefing')).toBeVisible();
}

test.describe('story 2 : consultations', () => {
  test('scenario 2 : une escouade deverrouillee se choisit, une verrouillee non', async ({
    page,
  }) => {
    await gotoScreen(page, 'escouades');
    const esc = ecran(page, 'escouades');
    const plateau = esc.locator('.board');
    await expect(plateau).toContainText('Escouade Alpha');
    await expect(plateau).toContainText(
      new RegExp(`PUISSANCE ${motif(derivees.squads.alpha?.power ?? 0)} · ARMEMENT DOMINANT LASER`),
    );

    await esc.getByRole('button', { name: /Bravo/ }).click();
    await expect(plateau).toContainText('Escouade Bravo');
    await expect(plateau).toContainText(
      new RegExp(`PUISSANCE ${motif(derivees.squads.bravo?.power ?? 0)}`),
    );
    await expect(esc.locator('.sumry')).toContainText(`${derivees.squads.bravo?.unitCount} UNITÉS`);
    await expect(esc.locator('.roster [data-unit="c2"]')).toHaveClass(/\bsel\b/);

    const delta = esc.getByRole('button', { name: /Delta/ });
    await expect(delta).toContainText('Grade 5');
    await delta.click({ force: true });
    await expect(plateau).toContainText('Escouade Bravo');
  });

  test('scenario 2 : un emplacement vide filtre les effectifs sur sa famille', async ({ page }) => {
    await gotoScreen(page, 'escouades');
    const esc = ecran(page, 'escouades');
    await esc.getByRole('button', { name: /Bravo/ }).click();
    await esc.locator('.board').getByRole('button', { name: /Méca/ }).first().click();
    await expect(esc.getByRole('button', { name: 'Mécas', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(esc.locator('.roster [data-unit^="m"]').first()).toBeVisible();
  });

  test("scenario 3 : l'Atlas change d'unite, de palier et d'armement", async ({ page }) => {
    await gotoScreen(page, 'atlas');
    const atlas = ecran(page, 'atlas');
    const grande = atlas.locator('.card.big');
    await expect(grande).toHaveAttribute('data-unit', 's1');

    const caracteristiques = atlas.locator('.atl-left [data-panel]').nth(1);
    const avant = await caracteristiques.innerText();
    await atlas.locator('.atl-left [data-unit="s2"]').click();
    await expect(grande).toHaveAttribute('data-unit', 's2');
    await expect(page).toHaveURL(/#\/atlas\/s2$/);
    await expect(caracteristiques).not.toHaveText(avant);

    const illustration = await grande.innerHTML();
    const palier = atlas.getByRole('button', { name: /Palier 4/ });
    await palier.click();
    await expect(palier).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => grande.innerHTML()).not.toBe(illustration);

    const arme = atlas.getByRole('button', { name: /Nucléaire/ });
    const avantArme = await grande.innerHTML();
    await arme.click();
    await expect(arme).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => grande.innerHTML()).not.toBe(avantArme);

    await atlas.locator('.atl-left [data-unit="c1"]').click();
    await expect(grande).toHaveAttribute('data-unit', 'c1');
    await expect(atlas.getByRole('button', { name: /Palier/ })).toHaveCount(0);
  });

  test('scenario 4 : la Base montre le batiment choisi, sur le plan ou dans la liste', async ({
    page,
  }) => {
    await gotoScreen(page, 'base');
    const base = ecran(page, 'base');
    const detail = base.locator('.bdet');
    await base
      .locator('.blist')
      .getByRole('button', { name: /Laboratoire central/ })
      .click();
    await expect(detail).toContainText('Laboratoire central');
    await base
      .locator('.bfield')
      .getByRole('button', { name: /Chantier orbital/ })
      .click();
    await expect(detail).toContainText('Chantier orbital');
  });

  test("scenario 4 : la Recherche change d'arbre et de noeud", async ({ page }) => {
    await gotoScreen(page, 'recherche');
    const recherche = ecran(page, 'recherche');
    const dossier = recherche.locator('.rdet');
    const flotte = recherche.getByRole('button', { name: 'Flotte', exact: true });
    await flotte.click();
    await expect(flotte).toHaveAttribute('aria-pressed', 'true');
    await expect(dossier).toContainText('Coque renforcée');
    await recherche
      .locator('.tree')
      .getByRole('button', { name: /Porte-nefs/ })
      .click();
    await expect(dossier).toContainText('Porte-nefs');
  });

  test('scenario 7 : le parcours de mission presente l escouade choisie', async ({ page }) => {
    await gotoScreen(page, 'escouades');
    await ecran(page, 'escouades').getByRole('button', { name: /Bravo/ }).click();
    await versBriefing(page);
    await expect(ecran(page, 'briefing')).toContainText('ESCOUADE BRAVO');

    await lien(page, 'Passer au déploiement');
    const pool = ecran(page, 'deploiement').locator('.upool');
    await expect(pool.locator('[data-unit]')).toHaveCount(1);
    await expect(pool.locator('[data-unit="s3"]')).toBeVisible();

    await lien(page, 'Lancer le combat');
    const forces = ecran(page, 'combat').locator('.cforce');
    await expect(forces.locator('[data-unit]')).toHaveCount(1);
    await expect(forces.locator('[data-unit="s3"]')).toBeVisible();
  });

  test('scenario 8 : la formation en arc suit du plateau au Deploiement', async ({ page }) => {
    await gotoScreen(page, 'escouades');
    const esc = ecran(page, 'escouades');
    await expect(esc.locator('.miniform')).toContainText("360° AUTOUR DE L'OBJECTIF");
    await esc.getByRole('button', { name: 'Arc', exact: true }).click();
    await expect(esc.locator('.miniform')).toContainText('ARC DEPUIS UN BORD');

    await versBriefing(page);
    await expect(
      ecran(page, 'briefing').getByRole('button', { name: 'Arc', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await lien(page, 'Passer au déploiement');
    await expect(
      ecran(page, 'deploiement').getByRole('button', { name: 'Arc', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('scenario 9 : le combat terrestre engage aussi les mecas', async ({ page }) => {
    await gotoScreen(page, 'escouades');
    await versBriefing(page);
    const terrestre = ecran(page, 'briefing').getByRole('button', { name: 'Combat terrestre' });
    await terrestre.click();
    await expect(terrestre).toHaveAttribute('aria-pressed', 'true');

    await lien(page, 'Passer au déploiement');
    const pool = ecran(page, 'deploiement').locator('.upool');
    await expect(pool.locator('[data-unit="m1"]')).toBeVisible();
    await expect(pool.locator('[data-unit="m2"]')).toBeVisible();

    await lien(page, 'Lancer le combat');
    await expect(ecran(page, 'combat').locator('.tag')).toContainText(derivees.combat.titles.sol);
  });
});

test.describe('valeurs derivees affichees (FR-013)', () => {
  test('Carte : distance de la planete visee', async ({ page }) => {
    await gotoScreen(page, 'carte');
    await expect(ecran(page, 'carte').locator('.holo')).toContainText(
      new RegExp(`${motif(derivees.route.distance)} UA`),
    );
  });

  test('Briefing : chances de victoire', async ({ page }) => {
    await gotoScreen(page, 'briefing');
    await expect(ecran(page, 'briefing').locator('.gauge')).toContainText(
      `${derivees.briefing.alpha?.winChance}%`,
    );
  });

  test('Combat : intitule orbital par defaut', async ({ page }) => {
    await gotoScreen(page, 'combat');
    await expect(ecran(page, 'combat').locator('.tag')).toContainText(
      derivees.combat.titles.orbital,
    );
  });
});

test.describe('SC-013 : consultations au clavier', () => {
  test('onglet d escouade et selecteur de formation', async ({ page }) => {
    await gotoScreen(page, 'escouades');
    const esc = ecran(page, 'escouades');
    await esc.getByRole('button', { name: /Bravo/ }).focus();
    await page.keyboard.press('Enter');
    await expect(esc.locator('.board')).toContainText('Escouade Bravo');
    await esc.getByRole('button', { name: '360°', exact: true }).focus();
    await page.keyboard.press('Space');
    await expect(esc.getByRole('button', { name: '360°', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('arbre et noeud de recherche', async ({ page }) => {
    await gotoScreen(page, 'recherche');
    const recherche = ecran(page, 'recherche');
    await recherche.getByRole('button', { name: 'Commandement', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(
      recherche.getByRole('button', { name: 'Commandement', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
