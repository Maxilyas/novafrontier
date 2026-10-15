import { attribut, avancer, ecranCombat } from './combat.helpers';
import { expect, test } from './fixtures';

/**
 * Releve de mesures et scenario de charge (story 5, FR-035, FR-036, research R14). Projet
 * `sans-gpu` : le scenario fait combattre plus de 60 entites et va jusqu'a sa relance. La cadence de
 * 60 images/s (SC-005) se mesure a la main sur le poste de reference (quickstart.md, scenario 7).
 */

test.describe.configure({ timeout: 120_000 });

const releve = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Diagnostic' });

async function charge(page: import('@playwright/test').Page, recherche = '?diag=1&charge=1') {
  await page.clock.install();
  await page.goto(`/${recherche}#/combat`);
  await expect(ecranCombat(page)).toHaveAttribute('data-combat-phase', 'running');
}

test('scenario de charge : au moins 60 entites au releve', async ({ page }) => {
  await charge(page);
  await expect(ecranCombat(page).locator('h1')).toContainText('TERRESTRE');
  await avancer(page, 1000, 500);
  const entites = Number(await attribut(page, 'dd[data-entities]', 'data-entities'));
  expect(entites).toBeGreaterThanOrEqual(60);
  await expect(releve(page)).toContainText('Pas');
  await expect(releve(page)).toContainText('Empreinte');
  await expect(releve(page)).toContainText('Scènes');
});

test('a la fin, le scenario reprend sans fenetre de fin', async ({ page }) => {
  await charge(page);
  // Le scenario se termine vers 21 s ; il est relance aussitot.
  await avancer(page, 25_000);
  await expect(page.locator('[data-modal="end"]')).toHaveCount(0);
  await expect(ecranCombat(page)).toHaveAttribute('data-combat-phase', 'running');
  const pas = Number(await attribut(page, 'dd[data-tick]', 'data-tick'));
  expect(pas).toBeGreaterThan(0);
  expect(pas).toBeLessThan(400);
});

test('le releve se replie puis se deplie par un clic', async ({ page }) => {
  await charge(page);
  const bascule = releve(page).getByRole('button', { name: 'Diagnostic' });
  await expect(bascule).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('dd[data-entities]')).toBeVisible();
  await bascule.click();
  await expect(bascule).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('dd[data-entities]')).toHaveCount(0);
  await bascule.click();
  await expect(bascule).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('dd[data-entities]')).toBeVisible();
});

test('sans ?diag=1, aucun releve', async ({ page }) => {
  await charge(page, '?charge=1');
  await expect(releve(page)).toHaveCount(0);
  await expect(page.locator('[data-entities]')).toHaveCount(0);
});
