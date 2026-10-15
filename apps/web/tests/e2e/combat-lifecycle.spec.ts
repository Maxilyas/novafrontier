import { ecranCombat } from './combat.helpers';
import { expect, test } from './fixtures';
import { mainNav } from './helpers';

/**
 * Lancement du combat a l'ouverture de l'ecran (FR-031, cas limites de la spec). Pause, reprise et
 * onglet masque (FR-032) : combat-clock.spec.ts.
 */

test.describe('cycle de vie du combat', () => {
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
});
