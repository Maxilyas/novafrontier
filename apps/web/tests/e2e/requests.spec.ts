import { expect, test } from './fixtures';
import { expectScreen, mainNav, recordHosts } from './helpers';

/**
 * SC-010 et FR-033 : au chargement puis pendant le parcours des 9 ecrans, aucune requete n'est
 * adressee a un autre hote que celui de l'application (polices comprises, FR-032).
 */
test('aucune requete hors de localhost pendant le parcours des 9 ecrans', async ({ page }) => {
  const hotes = recordHosts(page);
  const nav = (libelle: string) =>
    mainNav(page).getByRole('link', { name: libelle, exact: true }).click();
  const lien = (libelle: string) => page.getByRole('link', { name: libelle, exact: true }).click();

  await page.goto('/');
  await expectScreen(page, 'escouades');
  const carte = page.locator('[data-screen="escouades"] .card-wrap').first();
  await carte.hover();
  await carte.getByRole('button', { name: /^Fiche/ }).click();
  await expectScreen(page, 'atlas');
  for (const [libelle, ecran] of [
    ['Base', 'base'],
    ['Recherche', 'recherche'],
    ['Butin', 'butin'],
    ['Carte', 'carte'],
  ] as const) {
    await nav(libelle);
    await expectScreen(page, ecran);
  }
  await lien("Préparer l'assaut");
  await expectScreen(page, 'briefing');
  await lien('Passer au déploiement');
  await expectScreen(page, 'deploiement');
  await lien('Lancer le combat');
  await expectScreen(page, 'combat');
  await page.waitForLoadState('networkidle');

  expect(hotes.length).toBeGreaterThan(0);
  expect([...new Set(hotes)]).toEqual(['localhost']);
});
