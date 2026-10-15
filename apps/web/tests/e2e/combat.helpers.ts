import type { Locator, Page } from '@playwright/test';
import { expect } from './fixtures';
import { expectScreen } from './helpers';

/**
 * Aides des tests du combat (contracts/ui-testing.md) : l'horloge de la page est installee avant
 * le chargement, puis avancee a la main (research R14) ; aucun parametre d'acceleration.
 */

export const ecranCombat = (page: Page): Locator => page.locator('[data-screen="combat"]');

/** Ouvre le Deploiement avec l'horloge de la page, puis lance le combat. */
export async function lancerCombat(page: Page, recherche = '?graine=1'): Promise<void> {
  await page.clock.install();
  await page.goto(`/${recherche}#/deploiement`);
  await expectScreen(page, 'deploiement');
  await page.getByRole('button', { name: 'Lancer le combat', exact: true }).click();
  await expectScreen(page, 'combat');
  await expect(ecranCombat(page)).toHaveAttribute('data-combat-phase', 'running');
}

/** Avance l'horloge de la page par tranches, pour laisser l'interface se mettre a jour. */
export async function avancer(page: Page, ms: number, tranche = 5000): Promise<void> {
  for (let reste = ms; reste > 0; reste -= tranche) {
    await page.clock.runFor(Math.min(tranche, reste));
  }
}

/** Avance jusqu'a la fenetre de fin. */
export async function jusquALaFin(page: Page, maximumMs = 200_000): Promise<Locator> {
  const fenetre = page.locator('[data-modal="end"]');
  for (let ecoule = 0; ecoule < maximumMs; ecoule += 10_000) {
    if (await fenetre.isVisible()) return fenetre;
    await page.clock.runFor(10_000);
  }
  await expect(fenetre).toBeVisible();
  return fenetre;
}

export const attribut = async (page: Page, selecteur: string, nom: string): Promise<string> =>
  (await page.locator(selecteur).first().getAttribute(nom)) ?? '';
