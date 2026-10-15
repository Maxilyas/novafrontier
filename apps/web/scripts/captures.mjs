import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { build, preview } from 'vite';

/**
 * Captures cote a cote de l'application et de la maquette, a 1600x900, pour la validation de
 * SC-002 par l'equipe (`pnpm --filter @nova/web captures`). Resultat : apps/web/captures/NN-ecran.png.
 * Phase P1 (SC-010) : en plus, le Deploiement avec le placement automatique dans les quatre
 * combinaisons de theatre et de formation, et un combat en cours apres 5 s (graine 1, horloge de la
 * page avancee ; la maquette, elle, tire au hasard et tourne en temps reel).
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

/** Deploiement : theatre et formation, en plus de la capture par defaut (spatial, 360 degres). */
const VARIANTES = [
  ['sol', 'ring'],
  ['orbital', 'arc'],
  ['sol', 'arc'],
];

const LIBELLES = {
  orbital: 'Combat spatial',
  sol: 'Combat terrestre',
  ring: '360°',
  arc: 'Arc',
};

/** Duree du combat en cours capture. */
const COMBAT_MS = 5000;

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

/**
 * Deploiement de la maquette pour un theatre et une formation (globales `theatre` et `SQUADS`).
 * @param {import('@playwright/test').Page} page @param {string} theatre @param {string} formation
 */
async function capturerDeploiementMaquette(page, theatre, formation) {
  await page.evaluate(
    ([t, f]) => {
      const w = /** @type {any} */ (window);
      w.eval(`theatre = '${t}'; SQUADS[curSquad].form = '${f}'`);
      w.startDeploy();
    },
    [theatre, formation],
  );
  await page.waitForTimeout(400);
  return page.locator('#stage').screenshot();
}

/**
 * Deploiement de l'application : theatre et formation choisis au Briefing, placement automatique.
 * @param {import('@playwright/test').Page} page @param {string} base
 * @param {'orbital' | 'sol'} theatre @param {'ring' | 'arc'} formation
 */
async function capturerDeploiementApplication(page, base, theatre, formation) {
  await page.goto(`${base}#/briefing`);
  await page.locator('[data-screen="briefing"]').waitFor();
  await page.getByRole('button', { name: LIBELLES[theatre], exact: true }).click();
  await page.getByRole('button', { name: LIBELLES[formation], exact: true }).click();
  return capturerApplication(page, base, 'deploiement');
}

/**
 * Combat en cours dans la maquette : lance, puis arrete apres COMBAT_MS en temps reel.
 * @param {import('@playwright/test').Page} page
 */
async function capturerCombatMaquette(page) {
  await page.evaluate(() => {
    const w = /** @type {any} */ (window);
    w.eval(`theatre = 'orbital'; SQUADS[curSquad].form = 'ring'`);
    w.startDeploy();
    w.startCombat();
  });
  await page.waitForTimeout(COMBAT_MS);
  await page.evaluate(() => {
    const w = /** @type {any} */ (window);
    w.eval('CB.run = false');
  });
  await page.waitForTimeout(100);
  return page.locator('#stage').screenshot();
}

/**
 * Combat en cours dans l'application : graine 1, horloge de la page avancee de COMBAT_MS, donc le
 * meme etat a chaque capture.
 * @param {import('@playwright/test').Browser} navigateur @param {string} base
 */
async function capturerCombatApplication(navigateur, base) {
  const page = await navigateur.newPage({ viewport: { width: 1600, height: 900 } });
  try {
    await page.clock.install();
    await page.goto(`${base}?graine=1#/combat`);
    await page.locator('[data-screen="combat"][data-combat-phase="running"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (let ecoule = 0; ecoule < COMBAT_MS; ecoule += 500) await page.clock.runFor(500);
    await page.waitForTimeout(300);
    return await page.screenshot();
  } finally {
    await page.close();
  }
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
  let rang = 0;
  /** @param {string} nom @param {Buffer} app @param {Buffer} maq */
  const ecrire = async (nom, app, maq) => {
    rang += 1;
    const fichier = `${SORTIE}${String(rang).padStart(2, '0')}-${nom}.png`;
    writeFileSync(fichier, await assembler(planche, app, maq, nom));
    console.log(`Capture ecrite : ${fichier}`);
  };
  for (const [ecran, code] of ECRANS) {
    await ecrire(
      ecran,
      await capturerApplication(application, base, ecran),
      await capturerMaquette(maquette, code),
    );
  }
  for (const [theatre, formation] of VARIANTES) {
    await ecrire(
      `deploiement-${theatre}-${formation}`,
      await capturerDeploiementApplication(
        application,
        base,
        /** @type {'orbital' | 'sol'} */ (theatre),
        /** @type {'ring' | 'arc'} */ (formation),
      ),
      await capturerDeploiementMaquette(maquette, theatre, formation),
    );
  }
  await ecrire(
    'combat-en-cours',
    await capturerCombatApplication(navigateur, base),
    await capturerCombatMaquette(maquette),
  );
} finally {
  await navigateur.close();
  await serveur.close();
}
