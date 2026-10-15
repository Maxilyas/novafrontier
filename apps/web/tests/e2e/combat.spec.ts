import { avancer, ecranCombat, lancerCombat } from './combat.helpers';
import { expect, test } from './fixtures';

/**
 * Story 1 : un combat se deroule a l'ecran (FR-001 a FR-015, FR-027 a FR-029, SC-001). Rendu de
 * repli, horloge avancee de quelques centaines de millisecondes au plus ; ce qui demande plusieurs
 * secondes de combat est dans combat-clock.spec.ts et combat-end.spec.ts (projet sans-gpu).
 */

test.describe('combat a l ecran', () => {
  test('le lancement annonce la vague 1, la relique intacte et le minuteur a 12 s', async ({
    page,
  }) => {
    await lancerCombat(page);
    await expect(page.locator('[data-wave-current]')).toHaveAttribute('data-wave-current', '1');
    await expect(page.locator('[data-wave-total]')).toHaveAttribute('data-wave-total', '6');
    await expect(page.locator('[data-relic-percent]')).toHaveAttribute('data-relic-percent', '100');
    await expect(page.locator('[data-next-wave-seconds]')).toContainText('0:12');
    const journal = ecranCombat(page).locator('.clog .ll');
    await expect(journal.first()).toHaveText('Vague 01 — Intercepteurs ×12');
    await expect(journal.nth(2)).toHaveText('Escouade déployée — 3 unités en position');
  });

  test('une competence non ciblee coute un point et devient inactive', async ({ page }) => {
    await lancerCombat(page);
    const bouclier = ecranCombat(page).locator('[data-skill="1"]');
    await bouclier.click();
    await avancer(page, 200, 200);
    await expect(ecranCombat(page).locator('[data-action-points]')).toHaveAttribute(
      'data-action-points',
      '4',
    );
    await expect(bouclier).toHaveAttribute('aria-disabled', 'true');
    await expect(ecranCombat(page).locator('.clog .ll').first()).toHaveText(
      'BOUCLIER DE FLOTTE — +70% DÉF pendant 7 s',
    );
  });

  test('Frappe orbitale : designation dans la scene, puis application', async ({ page }) => {
    await lancerCombat(page);
    await ecranCombat(page).locator('[data-skill="0"]').click();
    await expect(ecranCombat(page)).toHaveAttribute('data-designating', '0');
    const scene = page.locator('[data-scene-host="combat"] canvas');
    const boite = await scene.boundingBox();
    if (!boite) throw new Error('scene absente');
    await scene.click({ position: { x: boite.width / 2, y: boite.height / 2 } });
    await expect(ecranCombat(page)).not.toHaveAttribute('data-designating', /.*/);
    await avancer(page, 200, 200);
    await expect(ecranCombat(page).locator('[data-action-points]')).toHaveAttribute(
      'data-action-points',
      '4',
    );
    await expect(ecranCombat(page).locator('.clog .ll').first()).toContainText('FRAPPE ORBITALE');
  });

  test('Echap annule la designation sans rien consommer', async ({ page }) => {
    await lancerCombat(page);
    await ecranCombat(page).locator('[data-skill="0"]').click();
    await expect(ecranCombat(page)).toHaveAttribute('data-designating', '0');
    await page.keyboard.press('Escape');
    await expect(ecranCombat(page)).not.toHaveAttribute('data-designating', /.*/);
    await avancer(page, 200, 200);
    await expect(ecranCombat(page).locator('[data-action-points]')).toHaveAttribute(
      'data-action-points',
      '5',
    );
  });

  test('l ultime de palier reste verrouille et affiche le message de la maquette', async ({
    page,
  }) => {
    await lancerCombat(page);
    await ecranCombat(page).locator('[data-ultimate]').click();
    await expect(page.getByRole('status').first()).toHaveText(
      'Capacité ultime — débloquée au niveau 50, réservée aux boss',
    );
  });
});
