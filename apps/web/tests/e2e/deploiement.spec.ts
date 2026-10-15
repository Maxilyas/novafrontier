import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { expectScreen, mainNav } from './helpers';

/**
 * Story 2 : placer ses unites avant le combat (FR-037 a FR-043, SC-011). Le parcours passe par les
 * liens de l'application : un rechargement remettrait le theatre et le plateau a zero (FR-014).
 */

const ecran = (page: Page): Locator => page.locator('[data-screen="deploiement"]');
const ligne = (page: Page, unite: string) => ecran(page).locator(`.urow[data-unit="${unite}"]`);
const emplacement = (page: Page, rang: number) => ecran(page).locator(`[data-slot="${rang}"]`);
const bouton = (page: Page, nom: string) => page.getByRole('button', { name: nom, exact: true });

/** Rangs des emplacements libres d'un type et d'une ligne. */
async function libres(page: Page, type: 'ship' | 'mech', ligneDuSlot: 'front' | 'back') {
  return ecran(page)
    .locator(`[data-slot-kind="${type}"][data-slot-line="${ligneDuSlot}"]:not([data-slot-unit])`)
    .evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-slot'))));
}

async function versBriefing(page: Page, terrestre: boolean): Promise<void> {
  await page.goto('/#/escouades');
  await mainNav(page).getByRole('link', { name: 'Carte', exact: true }).click();
  await page.getByRole('link', { name: "Préparer l'assaut", exact: true }).click();
  await expectScreen(page, 'briefing');
  if (terrestre) await bouton(page, 'Combat terrestre').click();
}

async function versDeploiement(page: Page, terrestre = true): Promise<void> {
  await versBriefing(page, terrestre);
  await page.getByRole('link', { name: 'Passer au déploiement', exact: true }).click();
  await expectScreen(page, 'deploiement');
}

const places = (page: Page) => ecran(page).locator('[data-placed]');

test.describe('plateau de deploiement', () => {
  test('emplacements bleus et verts en terrestre, bleus seuls en spatial', async ({ page }) => {
    await versDeploiement(page, true);
    await expect(ecran(page).locator('[data-slot-kind="ship"]')).toHaveCount(8);
    await expect(ecran(page).locator('[data-slot-kind="mech"]')).toHaveCount(8);
    await expect(ecran(page).locator('.urow')).toHaveCount(5);

    await page.getByRole('link', { name: 'Carte', exact: true }).click();
    await page.getByRole('link', { name: "Préparer l'assaut", exact: true }).click();
    await bouton(page, 'Combat spatial').click();
    await page.getByRole('link', { name: 'Passer au déploiement', exact: true }).click();
    await expect(ecran(page).locator('[data-slot-kind="ship"]')).toHaveCount(8);
    await expect(ecran(page).locator('[data-slot-kind="mech"]')).toHaveCount(0);
    await expect(ecran(page).locator('.urow')).toHaveCount(3);
  });

  test('interrupteur actif : chaque unite sur un emplacement de son type, blindes devant', async ({
    page,
  }) => {
    await versDeploiement(page);
    await expect(places(page)).toHaveAttribute('data-placed', '5/5');
    for (const [unite, type, cote] of [
      ['s4', 'ship', 'front'],
      ['s2', 'ship', 'front'],
      ['s1', 'ship', 'back'],
      ['m1', 'mech', 'front'],
      ['m2', 'mech', 'back'],
    ] as const) {
      const slot = ecran(page).locator(`[data-slot-unit="${unite}"]`);
      await expect(slot).toHaveAttribute('data-slot-kind', type);
      await expect(slot).toHaveAttribute('data-slot-line', cote);
    }
  });

  test('interrupteur coupe : le plateau arrive vide et Lancer le combat est inactif', async ({
    page,
  }) => {
    await versBriefing(page, true);
    const interrupteur = page.getByRole('switch', { name: 'Déploiement automatique' });
    await interrupteur.click();
    await expect(interrupteur).toHaveAttribute('aria-checked', 'false');
    await page.getByRole('link', { name: 'Passer au déploiement', exact: true }).click();
    await expect(places(page)).toHaveAttribute('data-placed', '0/5');
    await expect(bouton(page, 'Lancer le combat')).toBeDisabled();
    await bouton(page, 'Déploiement automatique').click();
    await expect(places(page)).toHaveAttribute('data-placed', '5/5');
  });

  test('a la souris, 4 unites en 8 actions, puis le combat les engage seules (SC-011)', async ({
    page,
  }) => {
    await versDeploiement(page);
    await bouton(page, 'Tout retirer').click();
    await expect(places(page)).toHaveAttribute('data-placed', '0/5');
    await expect(bouton(page, 'Lancer le combat')).toBeDisabled();

    const [vaisseauArriere, autre] = await libres(page, 'ship', 'back');
    const [mecaAvant] = await libres(page, 'mech', 'front');
    const [mecaArriere] = await libres(page, 'mech', 'back');
    const poses: [string, number | undefined][] = [
      ['s1', vaisseauArriere],
      ['s2', autre],
      ['m1', mecaAvant],
      ['m2', mecaArriere],
    ];
    for (const [unite, rang] of poses) {
      await ligne(page, unite).click();
      await emplacement(page, rang ?? -1).click();
      await expect(emplacement(page, rang ?? -1)).toHaveAttribute('data-slot-unit', unite);
    }
    await expect(places(page)).toHaveAttribute('data-placed', '4/5');

    await bouton(page, 'Lancer le combat').click();
    await expectScreen(page, 'combat');
    const forces = page.locator('[data-screen="combat"] .cforce [data-unit]');
    await expect(forces).toHaveCount(4);
    await expect(page.locator('[data-screen="combat"] .cforce [data-unit="s4"]')).toHaveCount(0);
  });

  test('un emplacement de l autre type refuse l unite choisie', async ({ page }) => {
    await versDeploiement(page);
    await bouton(page, 'Tout retirer').click();
    await ligne(page, 's1').click();
    const [meca] = await libres(page, 'mech', 'front');
    await expect(emplacement(page, meca ?? -1)).toHaveAttribute('aria-disabled', 'true');
    await emplacement(page, meca ?? -1).click({ force: true });
    await expect(emplacement(page, meca ?? -1)).not.toHaveAttribute('data-slot-unit', /.*/);
    await expect(places(page)).toHaveAttribute('data-placed', '0/5');
  });

  test('retirer : par l emplacement occupe ou par la ligne de la liste', async ({ page }) => {
    await versDeploiement(page);
    const occupe = ecran(page).locator('[data-slot-unit="s4"]');
    await occupe.click();
    await expect(places(page)).toHaveAttribute('data-placed', '4/5');
    await ligne(page, 'm1').click();
    await expect(places(page)).toHaveAttribute('data-placed', '3/5');
  });

  test('glisser-deposer : de la liste vers un emplacement, puis echange entre emplacements', async ({
    page,
  }) => {
    await versDeploiement(page);
    await bouton(page, 'Tout retirer').click();
    const [a, b] = await libres(page, 'ship', 'back');
    const glisser = async (de: Locator, vers: Locator) => {
      const depart = await de.boundingBox();
      const arrivee = await vers.boundingBox();
      if (!depart || !arrivee) throw new Error('boite introuvable');
      await page.mouse.move(depart.x + depart.width / 2, depart.y + depart.height / 2);
      await page.mouse.down();
      await page.mouse.move(depart.x + depart.width / 2 + 10, depart.y + depart.height / 2, {
        steps: 2,
      });
      await page.mouse.move(arrivee.x + arrivee.width / 2, arrivee.y + arrivee.height / 2, {
        steps: 8,
      });
      await page.mouse.up();
    };
    await glisser(ligne(page, 's1'), emplacement(page, a ?? -1));
    await expect(emplacement(page, a ?? -1)).toHaveAttribute('data-slot-unit', 's1');
    await glisser(ligne(page, 's2'), emplacement(page, b ?? -1));
    await expect(emplacement(page, b ?? -1)).toHaveAttribute('data-slot-unit', 's2');

    await glisser(emplacement(page, a ?? -1), emplacement(page, b ?? -1));
    await expect(emplacement(page, b ?? -1)).toHaveAttribute('data-slot-unit', 's1');
    await expect(emplacement(page, a ?? -1)).toHaveAttribute('data-slot-unit', 's2');

    // Depose sur un emplacement de l'autre type : l'unite revient d'ou elle venait.
    const [meca] = await libres(page, 'mech', 'back');
    await glisser(emplacement(page, b ?? -1), emplacement(page, meca ?? -1));
    await expect(emplacement(page, b ?? -1)).toHaveAttribute('data-slot-unit', 's1');
  });

  test('au clavier : choisir, parcourir les emplacements valides, poser (FR-043)', async ({
    page,
  }) => {
    await versDeploiement(page);
    await bouton(page, 'Tout retirer').click();
    await ligne(page, 'm1').focus();
    await page.keyboard.press('Enter');
    await expect(ligne(page, 'm1')).toHaveAttribute('aria-pressed', 'true');
    const valides = await ecran(page)
      .locator('[data-slot]:not([aria-disabled="true"])')
      .evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-slot'))));
    expect(valides.length).toBe(8);
    await emplacement(page, valides[0] ?? -1).focus();
    await page.keyboard.press('ArrowRight');
    await expect(emplacement(page, valides[1] ?? -1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(emplacement(page, valides[1] ?? -1)).toHaveAttribute('data-slot-unit', 'm1');
  });

  test('le placement est memorise par formation, et retrouve en revenant', async ({ page }) => {
    await versDeploiement(page);
    await bouton(page, 'Tout retirer').click();
    await ligne(page, 'm2').click();
    const [rang] = await libres(page, 'mech', 'front');
    await emplacement(page, rang ?? -1).click();

    await bouton(page, 'Arc').click();
    await expect(ecran(page).locator('[data-slot]')).toHaveCount(13);
    await expect(places(page)).toHaveAttribute('data-placed', '5/5');

    await bouton(page, '360°').click();
    await expect(places(page)).toHaveAttribute('data-placed', '1/5');
    await mainNav(page).getByRole('link', { name: 'Escouades', exact: true }).click();
    await page.goBack();
    await expectScreen(page, 'deploiement');
    await expect(emplacement(page, rang ?? -1)).toHaveAttribute('data-slot-unit', 'm2');
  });
});
