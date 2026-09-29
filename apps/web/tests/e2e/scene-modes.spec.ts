import { expect, test } from './fixtures';
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

// Jusqu'a 15 s pour le choix du rendu, puis 20 s pour les etoiles.
test.describe.configure({ timeout: 60_000 });

/** Journal des modes successifs des zones de scene, tenu dans la page. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const journal: string[] = [];
    Object.assign(window, { __modesDeRendu: journal });
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const mode = (mutation.target as Element).getAttribute('data-render-mode');
        if (mode) journal.push(mode);
      }
    }).observe(document, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-render-mode'],
    });
  });
});

for (const scene of SCENES) {
  test(`${scene} : mode de rendu du navigateur`, async ({ page }, info) => {
    const attendu = ATTENDU[info.project.name] ?? 'webgl2';
    await gotoScreen(page, scene);
    const zone = zoneDeScene(page, scene);
    // Premier mode atteint apres l'initialisation : le choix du rendu (FR-023, FR-024).
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            (window as unknown as { __modesDeRendu: string[] }).__modesDeRendu.find(
              (mode) => mode !== 'initialisation',
            ),
          ),
        { timeout: 15_000 },
      )
      .toBe(attendu);

    if (attendu === 'indisponible') {
      const message = zone.getByRole('alert');
      await expect(message).toBeVisible();
      await expect(message).toContainText('Affichage de la scène indisponible');
      await expect(zone.locator('canvas')).toHaveCount(0);
      // Le reste de l'ecran et la navigation restent utilisables (SC-006).
      await mainNav(page).getByRole('link', { name: 'Base', exact: true }).click();
      await expectScreen(page, 'base');
    }

    if (attendu === 'webgl2') {
      await expect(zone).toHaveAttribute('data-render-mode', 'webgl2');
      await expect(zone.locator('canvas')).toBeVisible();
      await expect(zone.getByRole('alert')).toHaveCount(0);
      // Le fond provisoire est dessine : des etoiles se detachent du degrade (FR-022). Une
      // capture de la scene animee peut prendre plusieurs secondes en rendu logiciel.
      await expect.poll(() => pixelsLumineux(page, scene), { timeout: 20_000 }).toBeGreaterThan(20);
    }
    // En WebGPU logiciel, Chromium sans ecran perd le peripherique en quelques secondes, meme
    // sur une page sans Pixi (research R10) : seul le choix du rendu est verifie ici ; la
    // conduite a tenir apres une perte l'est par scene-lifecycle.spec.ts.
  });
}

test('?rendu=webgl force le rendu de repli', async ({ page }, info) => {
  test.skip(info.project.name !== 'webgpu', 'utile seulement quand WebGPU est disponible');
  await gotoScreen(page, 'carte', '?rendu=webgl');
  await expect(zoneDeScene(page, 'carte')).toHaveAttribute('data-render-mode', 'webgl2', {
    timeout: 15_000,
  });
});
