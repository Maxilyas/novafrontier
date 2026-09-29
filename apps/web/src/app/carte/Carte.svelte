<script lang="ts">
  import { demoState } from '@nova/data';
  import Holo from './Holo.svelte';
  import MapInfo from './MapInfo.svelte';
  import NavPad from './NavPad.svelte';
  import Zoomer from './Zoomer.svelte';

  /**
   * Ecran 05 · Carte (maquette, lignes 777-795 et 1682-1788, CSS 414-466). La zone de scene
   * (story 3) occupera tout l'ecran, sous les panneaux.
   */
</script>

<section class="screen carte" data-screen="carte" aria-label="Carte" tabindex="-1">
  <h1 class="tag">// 05 · <b>CARTE</b> — {demoState.defaults.map.zone}</h1>
  <MapInfo />
  <NavPad />
  <Zoomer />
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
