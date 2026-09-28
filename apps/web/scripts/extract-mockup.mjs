import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { extractDerivedValues, openMockup } from './mockup-oracle.mjs';

/**
 * Genere packages/data/src/demo/derived.generated.json a partir de la maquette
 * (`pnpm --filter @nova/web mockup:extract`). Ne jamais editer ce fichier a la main : le test
 * oracle echoue s'il s'ecarte de la maquette.
 */

const SORTIE = fileURLToPath(
  new URL('../../../packages/data/src/demo/derived.generated.json', import.meta.url),
);
const executablePath = process.env.PW_CHROMIUM_EXECUTABLE;

const browser = await chromium.launch(executablePath ? { executablePath } : {});
try {
  const page = await openMockup(browser);
  const valeurs = await extractDerivedValues(page);
  writeFileSync(SORTIE, `${JSON.stringify(valeurs, null, 2)}\n`);
  console.log(`Valeurs derivees ecrites dans ${SORTIE}`);
} finally {
  await browser.close();
}
