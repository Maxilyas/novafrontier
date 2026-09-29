<script lang="ts">
  import { onMount } from 'svelte';
  import DiagBadge from './app/DiagBadge.svelte';
  import ScreenView from './app/ScreenView.svelte';
  import TopBar from './app/TopBar.svelte';
  import { startRouter, urlParams } from './state/router.svelte';
  import IconSprite from './ui/IconSprite.svelte';
  import Toast from './ui/Toast.svelte';

  /**
   * Bandeau superieur, ecran courant, voile de grain, message bref et, avec `?diag=1`, badge de
   * diagnostic (plan, structure).
   */
  onMount(() => startRouter());
</script>

<IconSprite />
<div class="app">
  <TopBar />
  <ScreenView />
</div>
<div class="grain" aria-hidden="true"></div>
<Toast />
{#if urlParams.diag}<DiagBadge />{/if}

<style>
  /* Mise en page fluide (research R5) : en dessous de 1280x720, la page defile. */
  .app {
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-rows: 5.25rem minmax(0, 1fr);
    width: 100%;
    min-width: 1280px;
    height: 100vh;
    min-height: 720px;
    background: var(--ink);
  }
</style>
