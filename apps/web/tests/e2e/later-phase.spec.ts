import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { gotoScreen, laterPhaseControls, SCREENS } from './helpers';

/**
 * SC-012 : chaque commande d'une phase ulterieure affiche le message bref et ne modifie aucune
 * valeur affichee (FR-018, contracts/ui-testing.md).
 */

const CODES = [
  'collect',
  'assign-unit',
  'unassign-unit',
  'upgrade-building',
  'queue-building',
  'collect-all',
  'start-research',
  'map-move',
  'map-zoom',
  'spy-planet',
  'auto-resolve',
  'auto-deploy-toggle',
  'pick-unit',
  'auto-deploy',
  'clear-deploy',
  'commander-action',
  'ultimate',
  'open-crate',
];

/** Compte les messages brefs affiches, y compris quand le meme message est reaffiche. */
async function compterMessages(page: Page): Promise<() => Promise<number>> {
  await page.evaluate(() => {
    const zone = document.querySelector('[role="status"]');
    if (!zone) throw new Error('zone du message bref introuvable');
    const compteur = { n: 0 };
    Object.assign(window, { __messagesBrefs: compteur });
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const noeud of mutation.addedNodes) {
          if (noeud instanceof HTMLElement && noeud.classList.contains('toast')) compteur.n += 1;
        }
      }
    }).observe(zone, { childList: true, subtree: true });
  });
  return () =>
    page.evaluate(
      () => (window as unknown as { __messagesBrefs: { n: number } }).__messagesBrefs.n,
    );
}

test.describe('SC-012 : commandes d une phase ulterieure', () => {
  for (const ecran of SCREENS) {
    test(`${ecran} : message bref, aucune valeur modifiee`, async ({ page }) => {
      await gotoScreen(page, ecran);
      const section = page.locator(`[data-screen="${ecran}"]`);
      const messages = await compterMessages(page);
      const commandes = laterPhaseControls(page);
      const nombre = await commandes.count();
      expect(nombre).toBeGreaterThan(0);
      const avant = await section.innerText();
      const bandeau = await page.getByRole('banner').innerText();

      for (let i = 0; i < nombre; i++) {
        await commandes.nth(i).click();
        await expect.poll(messages).toBe(i + 1);
        await expect(page.getByRole('status')).toHaveText('Pas encore disponible');
        expect(await section.innerText()).toBe(avant);
        expect(await page.getByRole('banner').innerText()).toBe(bandeau);
      }
    });
  }

  test('toutes les commandes de contracts/ui-testing.md sont presentes', async ({ page }) => {
    const trouves = new Set<string>();
    for (const ecran of SCREENS) {
      await gotoScreen(page, ecran);
      for (const code of await laterPhaseControls(page).evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-later-phase') ?? ''),
      )) {
        trouves.add(code);
      }
    }
    expect([...trouves].sort()).toEqual([...CODES].sort());
  });
});
