import type { ScreenId } from '@nova/data';
import { expect, type Locator, type Page } from '@playwright/test';

/** Aides communes aux tests de bout en bout (contracts/ui-testing.md). */

export const SCREENS: readonly ScreenId[] = [
  'escouades',
  'atlas',
  'base',
  'recherche',
  'carte',
  'briefing',
  'deploiement',
  'combat',
  'butin',
];

/** Adresse d'un ecran, avec d'eventuels parametres de diagnostic (`?diag=1`). */
export const adresse = (ecran: ScreenId, recherche = ''): string =>
  `/${recherche}#/${ecran === 'atlas' ? 'atlas/s1' : ecran}`;

export async function expectScreen(page: Page, ecran: ScreenId): Promise<void> {
  await expect(page.locator(`[data-screen="${ecran}"]`)).toBeVisible();
}

export async function gotoScreen(page: Page, ecran: ScreenId, recherche = ''): Promise<void> {
  await page.goto(adresse(ecran, recherche));
  await expectScreen(page, ecran);
}

export const laterPhaseControls = (page: Page): Locator => page.locator('[data-later-phase]');

export const mainNav = (page: Page): Locator =>
  page.getByRole('navigation', { name: 'Navigation principale' });

/** Journal des hotes contactes par la page, pour SC-010. */
export function recordHosts(page: Page): string[] {
  const hotes: string[] = [];
  page.on('request', (requete) => {
    const url = new URL(requete.url());
    if (url.protocol.startsWith('http')) hotes.push(url.hostname);
  });
  return hotes;
}
