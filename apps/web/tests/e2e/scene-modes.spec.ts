import { expect, test } from '@playwright/test';
import { expectScreen, gotoScreen, mainNav } from './helpers';
import { pixelsLumineux, SCENES, zoneDeScene } from './scene.helpers';

/**
 * Story 3, scenarios 1 a 3 (FR-023, FR-024, FR-028, SC-005, SC-006), joue dans les projets
 * `repli` (WebGL2 logiciel), `webgpu` (--enable-unsafe-webgpu) et `sans-gpu` (aucun rendu).
 */

const ATTENDU: Record<string, string> = {
  repli: 'webgl2',
  webgpu: 'webgpu',
  'sans-gpu': 'indisponible',
};

for (const scene of SCENES) {
  test(`${scene} : mode de rendu du navigateur`, async ({ page }, info) => {
    const attendu = ATTENDU[info.project.name] ?? 'webgl2';
    await gotoScreen(page, scene);
    const zone = zoneDeScene(page, scene);
    await expect(zone).toHaveAttribute('data-render-mode', attendu, { timeout: 15_000 });

    if (attendu === 'indisponible') {
      const message = zone.getByRole('alert');
      await expect(message).toBeVisible();
      await expect(message).toContainText('Affichage de la scène indisponible');
      await expect(zone.locator('canvas')).toHaveCount(0);
      // Le reste de l'ecran et la navigation restent utilisables (SC-006).
      await mainNav(page).getByRole('link', { name: 'Base', exact: true }).click();
      await expectScreen(page, 'base');
    } else {
      await expect(zone.locator('canvas')).toBeVisible();
      await expect(zone.getByRole('alert')).toHaveCount(0);
    }

    if (info.project.name === 'repli') {
      // Le fond provisoire est dessine : des etoiles se detachent du degrade (FR-022).
      await expect.poll(() => pixelsLumineux(page, scene)).toBeGreaterThan(4);
    }
  });
}

test('?rendu=webgl force le rendu de repli', async ({ page }, info) => {
  test.skip(info.project.name !== 'webgpu', 'utile seulement quand WebGPU est disponible');
  await gotoScreen(page, 'carte', '?rendu=webgl');
  await expect(zoneDeScene(page, 'carte')).toHaveAttribute('data-render-mode', 'webgl2', {
    timeout: 15_000,
  });
});
