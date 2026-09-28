import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { extractDerivedValues, openMockup } from '../../scripts/mockup-oracle.mjs';

/**
 * Oracle de FR-013 (research R9) : les valeurs derivees figees dans @nova/data sont celles que
 * la maquette calcule. Le fichier est lu par fs : les tests Playwright n'importent pas @nova/data.
 */
const FICHIER = new URL(
  '../../../../packages/data/src/demo/derived.generated.json',
  import.meta.url,
);

test('la maquette calcule les memes valeurs que derived.generated.json', async ({ browser }) => {
  const page = await openMockup(browser);
  const extraites = await extractDerivedValues(page);
  const figees: unknown = JSON.parse(readFileSync(FICHIER, 'utf8'));
  expect(extraites).toEqual(figees);
  await page.close();
});
