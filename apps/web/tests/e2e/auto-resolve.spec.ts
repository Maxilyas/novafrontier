import { combatDeReference, ecranCombat, jusquALaFin } from './combat.helpers';
import { expect, test } from './fixtures';
import { expectScreen } from './helpers';

/**
 * "Resoudre automatiquement" (FR-030a) : le combat est calcule par les regles de la sim, sans
 * affichage ; son resultat est celui du combat de reference de meme graine, et "Revoir le combat"
 * le rejoue a l'ecran avec la meme issue. Projet `sans-gpu` : le replay va jusqu'au bout.
 */

test.describe.configure({ timeout: 180_000 });

const reference = combatDeReference('alpha-orbital-ring-1');

async function resoudre(page: import('@playwright/test').Page) {
  await page.clock.install();
  await page.goto('/?diag=1&graine=1#/briefing');
  await expectScreen(page, 'briefing');
  await page.getByRole('button', { name: 'Résoudre automatiquement', exact: true }).click();
  const fenetre = page.locator('[data-modal="auto-resolve"]');
  await expect(fenetre).toBeVisible();
  return fenetre;
}

test('le resultat est celui du combat de reference, et se revoit a l ecran', async ({ page }) => {
  const fenetre = await resoudre(page);
  await expect(fenetre).toHaveAttribute('data-outcome', reference.expected.outcome);
  await expect(fenetre).toHaveAttribute('data-fingerprint', reference.expected.fingerprint);
  await expect(fenetre).toContainText(
    reference.expected.outcome === 'victory' ? 'Opération réussie' : 'Opération échouée',
  );

  await fenetre.getByRole('button', { name: 'Revoir le combat' }).click();
  await expectScreen(page, 'combat');
  await expect(ecranCombat(page)).toHaveAttribute('data-combat-mode', 'replay');
  const fin = await jusquALaFin(page);
  await expect(fin).toHaveAttribute('data-outcome', reference.expected.outcome);
  await expect(fin).toHaveAttribute('data-fingerprint-final', reference.expected.fingerprint);
});

test('Fermer referme la fenetre ; Rejouer en manuel mene au Deploiement', async ({ page }) => {
  const fenetre = await resoudre(page);
  await fenetre.getByRole('button', { name: 'Fermer' }).click();
  await expect(fenetre).toHaveCount(0);
  const deNouveau = await resoudre(page);
  await deNouveau.getByRole('button', { name: 'Rejouer en manuel' }).click();
  await expectScreen(page, 'deploiement');
});
