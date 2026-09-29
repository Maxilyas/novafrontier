import { expect, type Page, test } from '@playwright/test';
import { gotoScreen } from './helpers';
import { zoneDeScene } from './scene.helpers';

/**
 * Story 3, scenarios 4 et 5 (FR-025, FR-026, SC-008) : la scene occupe toute sa zone, a la
 * densite de l'ecran plafonnee a 2, avant et apres un redimensionnement de la fenetre.
 */

interface Mesure {
  /** Pixels du canvas par pixel CSS de la zone, arrondis au dixieme. */
  densiteL: number;
  densiteH: number;
  /** La taille CSS du canvas est celle de la zone, au pixel pres. */
  tailleCss: boolean;
}

const mesurer = (page: Page): Promise<Mesure> =>
  page.evaluate(() => {
    const zone = document.querySelector('[data-scene-host="deploiement"]');
    const toile = zone?.querySelector('canvas');
    if (!zone || !toile) return { densiteL: 0, densiteH: 0, tailleCss: false };
    const z = zone.getBoundingClientRect();
    const c = toile.getBoundingClientRect();
    return {
      densiteL: Math.round((toile.width / z.width) * 10) / 10,
      densiteH: Math.round((toile.height / z.height) * 10) / 10,
      tailleCss: Math.abs(c.width - z.width) < 1 && Math.abs(c.height - z.height) < 1,
    };
  });

async function verifier(page: Page, densite: number): Promise<void> {
  await gotoScreen(page, 'deploiement');
  await expect(zoneDeScene(page, 'deploiement')).toHaveAttribute('data-render-mode', 'webgl2', {
    timeout: 15_000,
  });
  const attendu = { densiteL: densite, densiteH: densite, tailleCss: true };
  await expect.poll(() => mesurer(page)).toEqual(attendu);
  await page.setViewportSize({ width: 1360, height: 780 });
  await expect.poll(() => mesurer(page)).toEqual(attendu);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect.poll(() => mesurer(page)).toEqual(attendu);
}

test.describe('ecran de densite 2', () => {
  test.use({ deviceScaleFactor: 2 });
  test('le canvas suit la zone, a la densite 2', async ({ page }) => {
    await verifier(page, 2);
  });
});

test.describe('ecran de densite 3', () => {
  test.use({ deviceScaleFactor: 3 });
  test('la densite du canvas est plafonnee a 2', async ({ page }) => {
    await verifier(page, 2);
  });
});

test('ecran de densite 1', async ({ page }) => {
  await verifier(page, 1);
});
