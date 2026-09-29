<script lang="ts">
  import type { ScreenId } from '@nova/data';
  import type { Component } from 'svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import { fade } from 'svelte/transition';
  import { router, screenMounted } from '../state/router.svelte';
  import Atlas from './atlas/Atlas.svelte';
  import Base from './base/Base.svelte';
  import Briefing from './briefing/Briefing.svelte';
  import Butin from './butin/Butin.svelte';
  import Carte from './carte/Carte.svelte';
  import Combat from './combat/Combat.svelte';
  import Deploiement from './deploiement/Deploiement.svelte';
  import Escouades from './escouades/Escouades.svelte';
  import Recherche from './recherche/Recherche.svelte';

  /**
   * Zone des ecrans (contracts/routes.md, regle 8) : seul l'ecran courant est monte, avec un
   * fondu de 220 ms, supprime quand le systeme demande de reduire les animations (FR-035).
   */
  const ECRANS: Record<ScreenId, Component> = {
    escouades: Escouades,
    atlas: Atlas,
    base: Base,
    recherche: Recherche,
    carte: Carte,
    briefing: Briefing,
    deploiement: Deploiement,
    combat: Combat,
    butin: Butin,
  };

  const Ecran = $derived(ECRANS[router.route.screen]);
  let zone: HTMLElement;
  let precedent: ScreenId | undefined;

  // Si la commande activee disparait avec l'ancien ecran, le focus passe au nouvel ecran plutot
  // que de retomber au debut du document (SC-013).
  $effect(() => {
    const ecran = router.route.screen;
    screenMounted();
    if (precedent !== undefined && precedent !== ecran) {
      const actif = document.activeElement;
      if (actif === null || actif === document.body) {
        zone.querySelector<HTMLElement>('[data-screen]')?.focus({ preventScroll: true });
      }
    }
    precedent = ecran;
  });
</script>

<main class="screens" bind:this={zone}>
  {#key router.route.screen}
    <div class="ecran" in:fade={{ duration: prefersReducedMotion.current ? 0 : 220 }}>
      <Ecran />
    </div>
  {/key}
</main>

<style>
  .screens {
    position: relative;
    overflow: hidden;
  }
  .ecran {
    position: absolute;
    inset: 0;
  }
</style>
