import { combatDeReference, ecranCombat, jusquALaFin, lancerCombat } from './combat.helpers';
import { expect, test } from './fixtures';
import { expectScreen } from './helpers';

/**
 * Combats complets jusqu'a la fenetre de fin (FR-010, FR-030, SC-001, SC-009). Ces tests tournent
 * dans le projet `sans-gpu` : le combat avance sans rendu (cas limite de la spec), et un combat de
 * deux minutes se verifie en quelques secondes d'horloge avancee.
 */

test.describe.configure({ timeout: 180_000 });

test('un combat va jusqu a la fenetre de fin, qui reprend l etat final', async ({ page }) => {
  // Graine 1, Alpha, spatial, 360 degres, placement automatique : le combat de reference.
  const reference = combatDeReference('alpha-orbital-ring-1');
  await lancerCombat(page, '?diag=1&graine=1');
  const fenetre = await jusquALaFin(page);
  await expect(fenetre).toHaveAttribute('data-fingerprint-final', reference.expected.fingerprint);
  const issue = await fenetre.getAttribute('data-outcome');
  expect(['victory', 'defeat']).toContain(issue);
  await expect(fenetre).toContainText(issue === 'victory' ? 'Relique sécurisée' : 'Relique perdue');

  // SC-009 : la fenetre, le HUD et la force engagee disent la meme chose.
  const vivantes = await ecranCombat(page).locator('[data-destroyed="false"]').count();
  const engagees = await ecranCombat(page).locator('[data-hp]').count();
  await expect(fenetre.locator('[data-units-left]')).toHaveText(`${vivantes}/${engagees}`);
  const vague = await page.locator('[data-wave-current]').getAttribute('data-wave-current');
  await expect(fenetre.locator('[data-waves]')).toHaveText(`${vague}/6`);
  // Integrite de la relique : celle de l'etat final, en victoire comme en defaite.
  const relique = await fenetre.getAttribute('data-relic-final');
  await expect(ecranCombat(page).locator('[data-relic-percent]')).toHaveAttribute(
    'data-relic-percent',
    relique ?? '',
  );
  if (issue === 'defeat') {
    expect(relique).toBe('0');
    await expect(fenetre.locator('[data-loot]')).toHaveText('0');
  }
  // Releve de mesures : dernier pas et empreinte finale du combat.
  await expect(page.locator('dd[data-tick]')).toHaveAttribute(
    'data-tick',
    String(reference.expected.ticks),
  );
  await expect(page.locator('dd[data-fingerprint]')).toHaveAttribute(
    'data-fingerprint',
    reference.expected.fingerprint,
  );
});

test('Redéployer et Retour a la carte quittent la fenetre de fin', async ({ page }) => {
  await lancerCombat(page);
  const fenetre = await jusquALaFin(page);
  await fenetre.getByRole('button', { name: 'Redéployer' }).click();
  await expectScreen(page, 'deploiement');
  await page.getByRole('button', { name: 'Lancer le combat', exact: true }).click();
  await expectScreen(page, 'combat');
  const seconde = await jusquALaFin(page);
  await seconde.getByRole('button', { name: 'Retour à la carte' }).click();
  await expectScreen(page, 'carte');
});
