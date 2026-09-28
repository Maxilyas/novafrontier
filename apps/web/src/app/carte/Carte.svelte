<script lang="ts">
  import { demoState } from '@nova/data';
  import Holo from './Holo.svelte';

  /** Ecran 05 · Carte (maquette, lignes 777-795, CSS 414-466). */
</script>

<section class="screen carte" data-screen="carte" aria-label="Carte" tabindex="-1">
  <h1 class="tag">// 05 · <b>CARTE</b> — {demoState.defaults.map.zone}</h1>
  <Holo />
</section>

<style>
  /* Hologramme de 342 px a droite ; la scene occupera tout l'ecran, sous les panneaux. */
  .carte {
    display: grid;
    padding: 2.75rem 1.25rem 1.25rem;
    grid-template-columns: minmax(0, 1fr) 21.375rem;
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: '. holo';
    background: #020304;
  }
</style>
