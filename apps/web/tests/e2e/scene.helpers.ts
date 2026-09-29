import type { Locator, Page } from '@playwright/test';

/** Aides des tests de scene (contracts/scene-host.md). */

export const SCENES = ['carte', 'deploiement', 'combat'] as const;
export type Scene = (typeof SCENES)[number];

export const zoneDeScene = (page: Page, scene: Scene): Locator =>
  page.locator(`[data-scene-host="${scene}"]`);

/**
 * Pixels lumineux (etoiles) dans un carre de 240 px au centre de la zone, hors panneaux. Le voile
 * de grain est masque le temps de la capture : il ajouterait son propre bruit.
 */
export async function pixelsLumineux(page: Page, scene: Scene): Promise<number> {
  const boite = await zoneDeScene(page, scene).boundingBox();
  if (!boite) throw new Error(`zone de scene ${scene} invisible`);
  const cote = 240;
  const style = await page.addStyleTag({ content: '.grain{display:none}' });
  const image = await page.screenshot({
    clip: {
      x: boite.x + boite.width / 2 - cote / 2,
      y: boite.y + boite.height / 2 - cote / 2,
      width: cote,
      height: cote,
    },
  });
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
