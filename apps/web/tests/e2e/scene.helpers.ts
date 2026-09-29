import type { Locator, Page } from '@playwright/test';

/** Aides des tests de scene (contracts/scene-host.md). */

export const SCENES = ['carte', 'deploiement', 'combat'] as const;
export type Scene = (typeof SCENES)[number];

export const zoneDeScene = (page: Page, scene: Scene): Locator =>
  page.locator(`[data-scene-host="${scene}"]`);

/**
 * Pixels lumineux (etoiles) de toute la zone de scene. Le temps de la capture, seul le canvas
 * reste peint : les panneaux poses sur la zone, leurs textes et le voile de grain ajouteraient
 * leurs propres pixels clairs, ou masqueraient des etoiles. Environ 230 pour les 300 etoiles.
 */
export async function pixelsLumineux(page: Page, scene: Scene): Promise<number> {
  // Capture de la page, decoupee a la zone : celle d'un element attendrait qu'il soit visible.
  const boite = await zoneDeScene(page, scene).boundingBox();
  if (!boite) throw new Error(`zone de scene ${scene} invisible`);
  const style = await page.addStyleTag({
    content:
      'body *{visibility:hidden!important} [data-scene-host] canvas{visibility:visible!important}',
  });
  const image = await page.screenshot({ clip: boite });
  await style.evaluate((el) => (el as Element).remove());
  return page.evaluate(async (base64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${base64}`;
    await img.decode();
    const toile = document.createElement('canvas');
    toile.width = img.width;
    toile.height = img.height;
    const ctx = toile.getContext('2d');
    if (!ctx) return 0;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, toile.width, toile.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if ((d[i] ?? 0) + (d[i + 1] ?? 0) + (d[i + 2] ?? 0) > 150) n += 1;
    }
    return n;
  }, image.toString('base64'));
}
