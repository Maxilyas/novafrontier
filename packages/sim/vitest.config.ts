import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Trois projets (research R10, R11) :
 * - `node` : tous les tests, sous Node (`pnpm test`) ;
 * - `navigateurs` : les combats de reference dans Chromium, Firefox et WebKit
 *   (`pnpm test:browsers`) ;
 * - `golden` : regeneration des combats de reference (`pnpm golden:update`), jamais lancee par
 *   les verifications.
 * Dans le conteneur Claude Code, PW_CHROMIUM_EXECUTABLE designe le Chromium preinstalle, comme pour
 * les tests Playwright de l'application.
 */
const executablePath = process.env.PW_CHROMIUM_EXECUTABLE;

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'navigateurs',
          include: ['tests/golden.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [
              {
                browser: 'chromium',
                ...(executablePath
                  ? { provider: playwright({ launchOptions: { executablePath } }) }
                  : {}),
              },
              { browser: 'firefox' },
              { browser: 'webkit' },
            ],
          },
        },
      },
      {
        test: {
          name: 'golden',
          environment: 'node',
          include: ['scripts/golden-update.test.ts'],
        },
      },
    ],
  },
});
