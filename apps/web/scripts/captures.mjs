import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { build, preview } from 'vite';

/**
 * Captures cote a cote de l'application et de la maquette, a 1600x900, pour la validation de
 * SC-002 par l'equipe (`pnpm --filter @nova/web captures`). Resultat : apps/web/captures/NN-ecran.png.
 *
 * La maquette demande ses polices a Google Fonts : ces requetes sont servies ici avec les fichiers
 * @fontsource de l'application, pour comparer a polices egales sans contacter de service tiers.
 */

const APP = fileURLToPath(new URL('..', import.meta.url));
const SORTIE = fileURLToPath(new URL('../captures/', import.meta.url));
const POLICES = fileURLToPath(new URL('../node_modules/@fontsource/', import.meta.url));
const MAQUETTE = pathToFileURL(
  fileURLToPath(new URL('../../../nova-frontier-v2.html', import.meta.url)),
).href;

/** Ecran de l'application, identifiant de la maquette, commande qui l'ouvre dans la maquette. */
const ECRANS = [
  ['escouades', 'esc'],
  ['atlas', 'atlas'],
  ['base', 'base'],
  ['recherche', 'rech'],
  ['carte', 'carte'],
  ['briefing', 'brief'],
  ['deploiement', 'depl'],
  ['combat', 'combat'],
  ['butin', 'butin'],
];

const FICHIERS_POLICES = {
  'oswald-300.woff2': 'oswald/files/oswald-latin-300-normal.woff2',
  'oswald-400.woff2': 'oswald/files/oswald-latin-400-normal.woff2',
  'oswald-500.woff2': 'oswald/files/oswald-latin-500-normal.woff2',
  'oswald-600.woff2': 'oswald/files/oswald-latin-600-normal.woff2',
  'share-tech-mono-400.woff2': 'share-tech-mono/files/share-tech-mono-latin-400-normal.woff2',
};

const CSS_POLICES = [
  ...[300, 400, 500, 600].map(
    (poids) =>
      `@font-face{font-family:'Oswald';font-style:normal;font-weight:${poids};src:url(https://fonts.gstatic.com/local/oswald-${poids}.woff2) format('woff2')}`,
  ),
  "@font-face{font-family:'Share Tech Mono';font-style:normal;font-weight:400;src:url(https://fonts.gstatic.com/local/share-tech-mono-400.woff2) format('woff2')}",
].join('\n');

const CORS = { 'Access-Control-Allow-Origin': '*' };

/** @param {import('@playwright/test').Browser} navigateur */
async function ouvrirMaquette(navigateur) {
  // A 1600x998, la maquette met sa scene de 1600x900 a l'echelle 1 (fit(), ligne 854).
  const page = await navigateur.newPage({ viewport: { width: 1600, height: 998 } });
  await page.route(/^https?:\/\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'fonts.googleapis.com') {
      return route.fulfill({ contentType: 'text/css', body: CSS_POLICES, headers: CORS });
    }
    const fichier =
      FICHIERS_POLICES[
        /** @type {keyof typeof FICHIERS_POLICES} */ (url.pathname.split('/').at(-1))
      ];
    if (url.hostname === 'fonts.gstatic.com' && fichier) {
      return route.fulfill({
        contentType: 'font/woff2',
        body: readFileSync(POLICES + fichier),
        headers: CORS,
      });
    }
    return route.abort();
  });
  await page.goto(MAQUETTE);
  await page.addStyleTag({ content: '#pager,#notes{display:none!important}' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/** @param {import('@playwright/test').Page} page @param {string} ecran */
async function capturerMaquette(page, ecran) {
  await page.evaluate((code) => {
    // Globales de la maquette, dans la page.
    const w = /** @type {any} */ (window);
    if (code === 'depl') {
      w.startDeploy();
    } else if (code === 'combat') {
      w.startDeploy();
      w.startCombat();
      w.eval('CB.run = false');
    } else {
      w.go(code);
    }
  }, ecran);
  await page.waitForTimeout(400);
  return page.locator('#stage').screenshot();
}

/** @param {import('@playwright/test').Page} page @param {string} base @param {string} ecran */
async function capturerApplication(page, base, ecran) {
  await page.goto(`${base}#/${ecran === 'atlas' ? 'atlas/s1' : ecran}`);
  await page.locator(`[data-screen="${ecran}"]`).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  return page.screenshot();
}

/** @param {Buffer} image */
const enLigne = (image) => `data:image/png;base64,${image.toString('base64')}`;

/**
 * @param {import('@playwright/test').Page} page
 * @param {Buffer} application
 * @param {Buffer} maquette
 * @param {string} titre
 */
async function assembler(page, application, maquette, titre) {
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#111;color:#ddd;font:14px sans-serif">
    <div style="display:flex;gap:16px;padding:12px">
      <figure style="margin:0"><figcaption style="padding:4px 0">Application — ${titre}</figcaption>
        <img src="${enLigne(application)}" width="1600" height="900"></figure>
      <figure style="margin:0"><figcaption style="padding:4px 0">Maquette — ${titre}</figcaption>
        <img src="${enLigne(maquette)}" width="1600" height="900"></figure>
    </div></body></html>`);
  return page.screenshot({ fullPage: true });
}

await build({ root: APP, logLevel: 'warn' });
const serveur = await preview({ root: APP, logLevel: 'warn', preview: { port: 4180 } });
const base = serveur.resolvedUrls?.local[0] ?? 'http://localhost:4180/';
const executablePath = process.env.PW_CHROMIUM_EXECUTABLE;
const navigateur = await chromium.launch(executablePath ? { executablePath } : {});

try {
  mkdirSync(SORTIE, { recursive: true });
  const application = await navigateur.newPage({ viewport: { width: 1600, height: 900 } });
  const maquette = await ouvrirMaquette(navigateur);
  const planche = await navigateur.newPage({ viewport: { width: 3248, height: 960 } });
  for (const [index, [ecran, code]] of ECRANS.entries()) {
    const image = await assembler(
      planche,
      await capturerApplication(application, base, ecran),
      await capturerMaquette(maquette, code),
      ecran,
    );
    const fichier = `${SORTIE}${String(index + 1).padStart(2, '0')}-${ecran}.png`;
    writeFileSync(fichier, image);
    console.log(`Capture ecrite : ${fichier}`);
  }
} finally {
  await navigateur.close();
  await serveur.close();
}
