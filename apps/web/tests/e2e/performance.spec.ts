import type { ScreenId } from '@nova/data';
import { expect, test } from './fixtures';
import { gotoScreen, mainNav } from './helpers';
import { zoneDeScene } from './scene.helpers';

/**
 * SC-003 et SC-004, partie automatique. Les mesures du poste de reference se font au badge de
 * diagnostic (`quickstart.md`) ; ici, Chromium sans ecran et rendu logiciel.
 */

/** Chaine de pixi.js, stable a la minification : elle signale le morceau de Pixi. */
const MARQUE_PIXI = 'No available renderer';

test.describe('changements d ecran (SC-004)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('chaque changement d ecran se termine en moins de 300 ms', async ({ page }) => {
    // Premiere ouverture des trois scenes (mesuree par le test suivant), puis mesure en regime
    // etabli : la creation d'un contexte graphique en rendu logiciel bloque la page un moment.
    for (const scene of ['carte', 'deploiement', 'combat'] as const) {
      await gotoScreen(page, scene);
      await expect(zoneDeScene(page, scene)).not.toHaveAttribute(
        'data-render-mode',
        'initialisation',
      );
    }
    await gotoScreen(page, 'escouades');
    const ordre: ScreenId[] = [
      'atlas',
      'base',
      'recherche',
      'carte',
      'briefing',
      'deploiement',
      'combat',
      'butin',
      'escouades',
    ];
    // Trois tours, et la mediane de chaque changement : un a-coup isole de la machine (ramasse-
    // miettes, autre test en parallele) ne fait pas echouer le test.
    const durees = await page.evaluate(async (ecrans) => {
      const resultat: Record<string, number[]> = {};
      for (let tour = 0; tour < 3; tour++) {
        for (const ecran of ecrans) {
          const debut = performance.now();
          window.location.hash = `#/${ecran === 'atlas' ? 'atlas/s1' : ecran}`;
          await new Promise<void>((resolve) => {
            const verifier = () =>
              document.querySelector(`[data-screen="${ecran}"]`)
                ? resolve()
                : requestAnimationFrame(verifier);
            verifier();
          });
          // L'ecran est peint a l'image suivante.
          await new Promise((resolve) => requestAnimationFrame(resolve));
          resultat[ecran] = [...(resultat[ecran] ?? []), performance.now() - debut];
        }
      }
      return resultat;
    }, ordre);
    const mediane = (valeurs: number[] = []) => [...valeurs].sort((a, b) => a - b)[1] ?? Infinity;
    for (const ecran of ordre) {
      expect(mediane(durees[ecran]), `${ecran} : ${durees[ecran]?.map(Math.round)}`).toBeLessThan(
        300,
      );
    }
  });

  test('a la premiere ouverture de la Carte, la scene s affiche en moins d une seconde', async ({
    page,
  }) => {
    await gotoScreen(page, 'escouades');
    const duree = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const debut = performance.now();
          window.location.hash = '#/carte';
          const verifier = () => {
            const mode = document
              .querySelector('[data-scene-host="carte"]')
              ?.getAttribute('data-render-mode');
            if (mode && mode !== 'initialisation') resolve(performance.now() - debut);
            else requestAnimationFrame(verifier);
          };
          verifier();
        }),
    );
    expect(duree).toBeLessThan(1000);
  });
});

test('pixi.js ne se charge qu a la premiere ouverture d un ecran a scene (SC-003)', async ({
  page,
}) => {
  const scripts: string[] = [];
  page.on('response', (reponse) => {
    if (reponse.request().resourceType() === 'script') scripts.push(reponse.url());
  });
  const contientPixi = async (urls: string[]) => {
    for (const url of urls) {
      if ((await (await page.request.get(url)).text()).includes(MARQUE_PIXI)) return true;
    }
    return false;
  };

  await gotoScreen(page, 'escouades');
  await page.waitForLoadState('networkidle');
  const auDemarrage = [...scripts];
  expect(auDemarrage.length).toBeGreaterThan(0);
  expect(await contientPixi(auDemarrage)).toBe(false);

  await mainNav(page).getByRole('link', { name: 'Carte', exact: true }).click();
  await expect(zoneDeScene(page, 'carte')).not.toHaveAttribute(
    'data-render-mode',
    'initialisation',
  );
  expect(await contientPixi(scripts.slice(auDemarrage.length))).toBe(true);
});
