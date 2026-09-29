<script lang="ts">
  import { crates } from '@nova/data';
  import Crate from './Crate.svelte';
  import LaunchPool from './LaunchPool.svelte';

  /** Ecran 09 · Butin (maquette, lignes 830-839 et 2380-2422, CSS 574-603). */
</script>

<section class="screen butin" data-screen="butin" aria-label="Butin" tabindex="-1">
  <h1 class="tag">// 09 · <b>BUTIN</b> — COFFRES &amp; COLLECTION</h1>
  <div class="crates">
    {#each crates as coffre (coffre.id)}<Crate crate={coffre} />{/each}
  </div>
  <LaunchPool />
</section>

<style>
  /* Coffres sur 228 px en haut, pool de lancement dessous. */
  .butin {
    display: grid;
    padding: 2.75rem 1.25rem 1.25rem;
    grid-template-rows: 14.25rem 1rem minmax(0, 1fr);
    grid-template-areas: 'crates' '.' 'pool';
    background: radial-gradient(ellipse at 50% 30%, #14140c 0%, #090b0a 46%, #040606 100%);
  }
  .crates {
    grid-area: crates;
    display: flex;
    gap: 18px;
    justify-content: center;
  }
  .butin :global(.panel.pool) {
    grid-area: pool;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
</style>
