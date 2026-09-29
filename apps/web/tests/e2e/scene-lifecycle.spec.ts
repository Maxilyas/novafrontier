import { expect, type Page, test } from '@playwright/test';
import { expectScreen, gotoScreen, mainNav } from './helpers';
import { zoneDeScene } from './scene.helpers';

/**
 * Story 3, scenarios 5 et 6 : cycle de vie de la scene (FR-024, FR-027, FR-035, SC-009), dans le
 * projet `repli` (WebGL2 logiciel).
 */

/** Tas JavaScript apres un ramasse-miettes force, par le protocole DevTools. */
async function tas(page: Page): Promise<number> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.collectGarbage');
  const { usedSize } = await cdp.send('Runtime.getHeapUsage');
  await cdp.detach();
  return usedSize;
}

async function carteAffichee(page: Page): Promise<void> {
  await expect(zoneDeScene(page, 'carte')).toHaveAttribute('data-render-mode', 'webgl2', {
    timeout: 15_000,
  });
}

/**
 * Allers-retours Escouades puis Carte, par l'adresse, pilotes depuis la page : les appels de
 * Playwright laissent eux-memes des objets dans le tas et fausseraient la mesure.
 */
const allersRetours = (page: Page, n: number): Promise<void> =>
  page.evaluate(async (n) => {
    const attendre = (condition: () => boolean) =>
      new Promise<void>((resolve) => {
        const verifier = () => (condition() ? resolve() : requestAnimationFrame(verifier));
        verifier();
      });
    for (let i = 0; i < n; i++) {
      window.location.hash = '#/escouades';
      await attendre(() => document.querySelector('[data-screen="escouades"]') !== null);
      window.location.hash = '#/carte';
      await attendre(
        () =>
          document.querySelector('[data-scene-host="carte"][data-render-mode="webgl2"] canvas') !==
          null,
      );
    }
  }, n);

test('50 allers-retours : une seule application, pas d accumulation (SC-009)', async ({ page }) => {
  test.setTimeout(120_000);
  const badge = page.getByLabel('Diagnostic');
  await gotoScreen(page, 'carte', '?diag=1');
  await carteAffichee(page);
  await allersRetours(page, 5);
  const depart = await tas(page);

  for (let serie = 0; serie < 5; serie++) {
    await allersRetours(page, 10);
    await expect(badge).toContainText(/Applications\s*1\b/);
  }

  const arrivee = await tas(page);
  expect(arrivee).toBeLessThanOrEqual(depart * 1.1);
});

test('retour sur la Carte en moins de 300 ms (FR-027)', async ({ page }) => {
  await gotoScreen(page, 'carte');
  await carteAffichee(page);
  await mainNav(page).getByRole('link', { name: 'Escouades', exact: true }).click();
  await expectScreen(page, 'escouades');

  const duree = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const debut = performance.now();
        window.location.hash = '#/carte';
        const verifier = () => {
          const zone = document.querySelector('[data-scene-host="carte"]');
          if (zone?.querySelector('canvas') && zone.getAttribute('data-render-mode') === 'webgl2') {
            resolve(performance.now() - debut);
          } else {
            requestAnimationFrame(verifier);
          }
        };
        requestAnimationFrame(verifier);
      }),
  );
  expect(duree).toBeLessThan(300);
});

/** Provoque la perte du contexte WebGL de la Carte ; renvoie de quoi le restaurer. */
async function perdreLeContexte(page: Page): Promise<void> {
  await page.evaluate(() => {
    const toile = document.querySelector<HTMLCanvasElement>('[data-scene-host="carte"] canvas');
    const extension = toile?.getContext('webgl2')?.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('WEBGL_lose_context indisponible');
    Object.assign(window, { __perteDeContexte: extension });
    extension.loseContext();
  });
}

test('perte puis restauration du contexte : perdu, puis webgl2 (FR-024)', async ({ page }) => {
  await gotoScreen(page, 'carte');
  await carteAffichee(page);
  const zone = zoneDeScene(page, 'carte');
  await perdreLeContexte(page);
  await expect(zone).toHaveAttribute('data-render-mode', 'perdu');
  await page.evaluate(() =>
    (
      window as unknown as { __perteDeContexte: WEBGL_lose_context }
    ).__perteDeContexte.restoreContext(),
  );
  await expect(zone).toHaveAttribute('data-render-mode', 'webgl2');
  await expect(zone.locator('canvas')).toBeVisible();
});

test('perte sans restauration : message apres 3 s (FR-024)', async ({ page }) => {
  await gotoScreen(page, 'carte');
  await carteAffichee(page);
  const zone = zoneDeScene(page, 'carte');
  await perdreLeContexte(page);
  await expect(zone).toHaveAttribute('data-render-mode', 'perdu');
  await expect(zone).toHaveAttribute('data-render-mode', 'indisponible', { timeout: 6_000 });
  await expect(zone.getByRole('alert')).toBeVisible();
});

test.describe('animations reduites (FR-035)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('la scene provisoire reste immobile', async ({ page }) => {
    await gotoScreen(page, 'deploiement');
    const zone = zoneDeScene(page, 'deploiement');
    await expect(zone).toHaveAttribute('data-render-mode', 'webgl2', { timeout: 15_000 });
    await page.addStyleTag({ content: '.grain{display:none}' });
    await page.waitForTimeout(300);
    const avant = await zone.screenshot();
    await page.waitForTimeout(700);
    const apres = await zone.screenshot();
    expect(apres.equals(avant)).toBe(true);
  });
});
