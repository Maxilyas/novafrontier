import { attribut, avancer, combatDeReference, ecranCombat, jusquALaFin } from './combat.helpers';
import { expect, test } from './fixtures';
import { zoneDeScene } from './scene.helpers';

/**
 * Determinisme dans l'application (SC-002, SC-004, FR-016, FR-022, research R10) : la graine passe
 * par l'adresse, l'empreinte se lit au badge de diagnostic.
 * - projet `repli` : apres la meme duree, le meme pas et la meme empreinte en rendu accelere ou de
 *   repli, et quelle que soit la taille de la fenetre ;
 * - projet `sans-gpu` : le combat mene a son terme dans le navigateur donne l'empreinte du combat de
 *   reference calcule sous Node.
 */

/** Horloge arretee avant le chargement : seul `runFor` la fait avancer, donc le meme nombre de pas. */
const DEBUT = new Date('2026-10-01T08:00:00Z');

async function apresUneSeconde(page: import('@playwright/test').Page, recherche: string) {
  await page.clock.install({ time: DEBUT });
  await page.clock.pauseAt(new Date(DEBUT.getTime() + 1000));
  await page.goto(`/${recherche}#/combat`);
  await expect(ecranCombat(page)).toHaveAttribute('data-combat-phase', 'running');
  await avancer(page, 1000, 1000);
  await expect(page.locator('dd[data-fingerprint]')).toHaveAttribute('data-fingerprint', /.+/);
  return {
    tick: await attribut(page, 'dd[data-tick]', 'data-tick'),
    empreinte: await attribut(page, 'dd[data-fingerprint]', 'data-fingerprint'),
  };
}

test.describe('meme combat, quel que soit l affichage (SC-004)', () => {
  test.describe.configure({ timeout: 90_000 });

  test('rendu de repli force et tailles de fenetre : meme pas, meme empreinte', async ({
    browser,
  }, info) => {
    test.skip(info.project.name !== 'repli', 'comparaison des affichages dans le projet repli');
    // Contextes propres : la page garde WebGPU s'il est offert, `rendu=webgl` force le repli.
    const mesures: { cas: string; tick: string; empreinte: string }[] = [];
    for (const [cas, recherche, taille] of [
      ['1600x900', '?diag=1&graine=1', { width: 1600, height: 900 }],
      ['rendu=webgl', '?diag=1&graine=1&rendu=webgl', { width: 1600, height: 900 }],
      ['1280x720', '?diag=1&graine=1', { width: 1280, height: 720 }],
      ['2560x1440', '?diag=1&graine=1', { width: 2560, height: 1440 }],
    ] as const) {
      const contexte = await browser.newContext({ viewport: taille });
      const page = await contexte.newPage();
      mesures.push({ cas, ...(await apresUneSeconde(page, recherche)) });
      if (recherche.includes('rendu=webgl')) {
        await expect(zoneDeScene(page, 'combat')).toHaveAttribute('data-render-mode', 'webgl2');
      }
      await contexte.close();
    }
    const premiere = mesures[0];
    expect(Number(premiere?.tick)).toBeGreaterThan(10);
    for (const m of mesures) {
      expect({ tick: m.tick, empreinte: m.empreinte }, m.cas).toEqual({
        tick: premiere?.tick,
        empreinte: premiere?.empreinte,
      });
    }
  });
});

test.describe('combat de reference dans le navigateur (SC-002)', () => {
  test.describe.configure({ timeout: 180_000 });

  test('graine 1, Alpha, spatial, 360 degres : empreinte finale de la reference', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'sans-gpu', 'combat complet dans le projet sans-gpu');
    const reference = combatDeReference('alpha-orbital-ring-1');
    await page.clock.install();
    await page.goto('/?diag=1&graine=1#/combat');
    const fenetre = await jusquALaFin(page);
    await expect(fenetre).toHaveAttribute('data-outcome', reference.expected.outcome);
    await expect(fenetre).toHaveAttribute('data-fingerprint-final', reference.expected.fingerprint);
  });
});
