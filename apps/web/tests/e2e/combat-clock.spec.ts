import { attribut, avancer, ecranCombat, lancerCombat } from './combat.helpers';
import { expect, test } from './fixtures';
import { expectScreen, mainNav } from './helpers';

/**
 * Le combat dans la duree (FR-011, FR-032, cas limites de la spec) : ces tests avancent l'horloge
 * de plusieurs secondes. Ils tournent dans le projet `sans-gpu` : ils verifient le moteur (minuteur,
 * pause, onglet masque, animations reduites), pas le rendu, et le rendu logiciel de la scene les
 * rendrait trop lents sur la CI. C'est aussi la preuve que le combat avance sans acceleration
 * graphique.
 */

const secondes = (page: Parameters<typeof attribut>[0]) =>
  attribut(page, '[data-next-wave-seconds]', 'data-next-wave-seconds').then(Number);

test('le combat avance : minuteur, tirs et PV', async ({ page }) => {
  await lancerCombat(page);
  const pv = async () =>
    (
      await ecranCombat(page)
        .locator('[data-hp]')
        .evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-hp'))))
    ).reduce((a, b) => a + b, 0);
  const avant = await pv();
  await avancer(page, 9000);
  expect(await secondes(page)).toBeLessThan(5);
  await expect.poll(pv).toBeLessThan(avant);
});

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

test('animations reduites : le combat avance quand meme', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await lancerCombat(page);
  const avant = await secondes(page);
  await avancer(page, 4000);
  expect(await secondes(page)).toBeLessThan(avant);
});
