import { attribut, avancer, ecranCombat, lancerCombat } from './combat.helpers';
import { expect, test } from './fixtures';
import { expectScreen, mainNav } from './helpers';

/** Cycle de vie du combat (FR-031, FR-032, cas limites de la spec). */

const secondes = (page: Parameters<typeof attribut>[0]) =>
  attribut(page, '[data-next-wave-seconds]', 'data-next-wave-seconds').then(Number);

test.describe('cycle de vie du combat', () => {
  test('quitter l ecran met en pause ; revenir reprend au meme point', async ({ page }) => {
    await lancerCombat(page);
    await avancer(page, 3000);
    const avant = await secondes(page);
    await mainNav(page).getByRole('link', { name: 'Carte', exact: true }).click();
    await expectScreen(page, 'carte');
    await avancer(page, 6000);
    await page.goBack();
    await expectScreen(page, 'combat');
    await expect(ecranCombat(page)).toHaveAttribute('data-combat-phase', 'running');
    expect(await secondes(page)).toBe(avant);
    await avancer(page, 2000);
    expect(await secondes(page)).toBeLessThan(avant);
  });

  test('onglet masque : le combat s arrete, puis repart sans rattrapage', async ({ page }) => {
    await lancerCombat(page);
    await avancer(page, 2000);
    const visibilite = (etat: 'hidden' | 'visible') =>
      page.evaluate((v) => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v });
        document.dispatchEvent(new Event('visibilitychange'));
      }, etat);
    await visibilite('hidden');
    const avant = await secondes(page);
    await avancer(page, 6000);
    expect(await secondes(page)).toBe(avant);
    await visibilite('visible');
    await avancer(page, 1500);
    expect(await secondes(page)).toBeGreaterThanOrEqual(avant - 2);
  });

  test('l adresse directe du Combat lance un combat avec les choix courants', async ({ page }) => {
    await page.clock.install();
    await page.goto('/#/combat');
    await expect(ecranCombat(page)).toHaveAttribute('data-combat-phase', 'running');
    await expect(ecranCombat(page).locator('[data-hp]')).toHaveCount(3);
  });

  test('une escouade sans unite engagee ne lance aucun combat', async ({ page }) => {
    await page.goto('/#/escouades');
    await page
      .locator('[data-screen="escouades"]')
      .getByRole('button', { name: /Charlie/ })
      .click();
    await mainNav(page).getByRole('link', { name: 'Carte', exact: true }).click();
    await page.goto('/#/combat');
    await expect(ecranCombat(page).getByRole('status')).toContainText('Aucune unité engagée');
    await expect(ecranCombat(page)).toHaveAttribute('data-combat-phase', 'idle');
  });

  test('animations reduites : le combat avance quand meme', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await lancerCombat(page);
    const avant = await secondes(page);
    await avancer(page, 4000);
    expect(await secondes(page)).toBeLessThan(avant);
  });
});
