import { avancer, ecranCombat, jusquALaFin, lancerCombat } from './combat.helpers';
import { expect, test } from './fixtures';

/**
 * "Revoir le combat" (story 3, FR-021, SC-003) : le combat se rejoue a l'identique, competences
 * comprises, et le joueur ne peut plus agir pendant le replay. Projet `sans-gpu` : deux combats
 * complets.
 */

test.describe.configure({ timeout: 240_000 });

test('un combat avec competences se revoit a l identique', async ({ page }) => {
  await lancerCombat(page, '?diag=1&graine=3');
  // Deux competences a des moments differents : Bouclier de flotte, puis Impulsion EM.
  await ecranCombat(page).locator('[data-skill="1"]').click();
  await avancer(page, 5000);
  await ecranCombat(page).locator('[data-skill="3"]').click();
  await avancer(page, 200, 200);
  await expect(ecranCombat(page).locator('[data-action-points]')).toHaveAttribute(
    'data-action-points',
    '3',
  );

  const fin = await jusquALaFin(page);
  const issue = await fin.getAttribute('data-outcome');
  const empreinte = await fin.getAttribute('data-fingerprint-final');
  expect(empreinte).toMatch(/^[0-9a-f]{16}$/);

  await fin.getByRole('button', { name: 'Revoir le combat' }).click();
  await expect(ecranCombat(page)).toHaveAttribute('data-combat-mode', 'replay');
  await expect(ecranCombat(page).getByRole('status').filter({ hasText: 'REPLAY' })).toBeVisible();
  await expect(page.locator('[data-modal="end"]')).toHaveCount(0);
  await expect(ecranCombat(page).locator('[data-skill="0"]')).toHaveAttribute(
    'aria-disabled',
    'true',
  );

  const refin = await jusquALaFin(page);
  await expect(refin).toHaveAttribute('data-outcome', issue ?? '');
  await expect(refin).toHaveAttribute('data-fingerprint-final', empreinte ?? '');
});
