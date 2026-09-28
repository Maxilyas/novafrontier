import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Oracle de la maquette (research R9, FR-013) : ouvre nova-frontier-v2.html et en extrait les
 * valeurs que ses regles calculent. Utilise par extract-mockup.mjs (generation du fichier des
 * valeurs derivees) et par le test tests/oracle/derived-values.spec.ts (verification).
 */

const MAQUETTE = pathToFileURL(
  fileURLToPath(new URL('../../../nova-frontier-v2.html', import.meta.url)),
).href;
const SCRIPT_DE_PAGE = fileURLToPath(new URL('./mockup-page.js', import.meta.url));

/**
 * Ouvre la maquette en file://, requetes externes bloquees (elle ne demande que Google Fonts).
 * @param {import('@playwright/test').Browser} browser
 * @returns {Promise<import('@playwright/test').Page>}
 */
export async function openMockup(browser) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route(/^https?:\/\//, (route) => route.abort());
  await page.goto(MAQUETTE);
  return page;
}

/**
 * Valeurs derivees pour chaque escouade deverrouillee et chaque theatre, au format de
 * `derivedValuesSchema` (@nova/data). Le calcul se fait dans la page (mockup-page.js).
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<unknown>}
 */
export async function extractDerivedValues(page) {
  await page.addScriptTag({ path: SCRIPT_DE_PAGE });
  return page.evaluate('extraireValeursDerivees()');
}
