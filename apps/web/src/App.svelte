<script lang="ts">
  import { onMount } from 'svelte';
  import { startRouter } from './state/router.svelte';
  import IconSprite from './ui/IconSprite.svelte';
  import Toast from './ui/Toast.svelte';

  onMount(() => startRouter());
</script>

<IconSprite />
<div class="app">
  <header class="app-top"></header>
  <main class="app-screens"></main>
</div>
<div class="grain" aria-hidden="true"></div>
<Toast />

<style>
  /*
   * Mise en page racine (research R5) : bandeau de 84 px, zone d'ecran sur le reste. En dessous
   * de 1280x720, l'interface garde ces dimensions et la page defile (FR-031).
   */
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

  .app-screens {
    position: relative;
    overflow: hidden;
  }
</style>
