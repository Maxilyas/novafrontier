import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { build, preview } from 'vite';

/**
 * Audit de performance de SC-003 (`pnpm --filter @nova/web perf`) : premier chargement de l'ecran
 * Escouades, profil ordinateur de Lighthouse, categorie performance seule. Sort en erreur si le
 * score n'est pas superieur a 0,90.
 */

const APP = fileURLToPath(new URL('..', import.meta.url));
const SEUIL = 0.9;

await build({ root: APP, logLevel: 'warn' });
const serveur = await preview({ root: APP, logLevel: 'warn', preview: { port: 4181 } });
const base = serveur.resolvedUrls?.local[0] ?? 'http://localhost:4181/';
const chrome = await chromeLauncher.launch({
  chromePath: process.env.PW_CHROMIUM_EXECUTABLE ?? chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox'],
});

try {
  const resultat = await lighthouse(
    `${base}#/escouades`,
    { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance'] },
    desktopConfig,
  );
  if (!resultat) throw new Error('Lighthouse n a rendu aucun resultat');
  const { categories, audits } = resultat.lhr;
  const score = categories.performance?.score ?? 0;
  for (const id of [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
  ]) {
    console.log(`${audits[id]?.title ?? id} : ${audits[id]?.displayValue ?? '-'}`);
  }
  console.log(`Score de performance : ${Math.round(score * 100)} / 100 (attendu : plus de 90)`);
  if (!(score > SEUIL)) process.exitCode = 1;
} finally {
  chrome.kill();
  await serveur.close();
}
