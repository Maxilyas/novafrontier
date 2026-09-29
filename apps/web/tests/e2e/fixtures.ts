import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/**
 * Base commune des tests de bout en bout. Dans le projet `repli`, la page ne propose pas WebGPU
 * (`navigator.gpu` absent, comme un navigateur sans WebGPU) : le rendu de repli est ainsi exerce
 * quelle que soit la version de Chromium, meme si elle offrait un adaptateur WebGPU logiciel.
 */
export const test = base.extend<{ sansWebGPU: undefined }>({
  sansWebGPU: [
    async ({ page }, use, info) => {
      if (info.project.name === 'repli') {
        await page.addInitScript(() => {
          Object.defineProperty(Navigator.prototype, 'gpu', {
            configurable: true,
            get: () => undefined,
          });
        });
      }
      await use(undefined);
    },
    { auto: true },
  ],
});
