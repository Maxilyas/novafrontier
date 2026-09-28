import { defineConfig } from '@playwright/test';

/**
 * Tests de bout en bout (research R15). Trois projets Chromium reproduisent les modes de rendu :
 * repli (WebGL2 logiciel par defaut), webgpu (--enable-unsafe-webgpu) et sans-gpu (aucune
 * acceleration). Dans le conteneur Claude Code, PW_CHROMIUM_EXECUTABLE designe le Chromium
 * preinstalle ; la CI utilise celui de Playwright.
 */
const executablePath = process.env.PW_CHROMIUM_EXECUTABLE;
const lancement = (args: string[]) => ({ ...(executablePath ? { executablePath } : {}), args });

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'oracle/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1600, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'repli', use: { launchOptions: lancement([]) } },
    {
      name: 'webgpu',
      testMatch: 'e2e/scene-modes.spec.ts',
      use: { launchOptions: lancement(['--enable-unsafe-webgpu']) },
    },
    {
      name: 'sans-gpu',
      testMatch: 'e2e/scene-modes.spec.ts',
      use: { launchOptions: lancement(['--disable-gpu', '--disable-software-rasterizer']) },
    },
  ],
});
