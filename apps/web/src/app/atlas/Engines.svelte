<script lang="ts">
  import { engines } from '@nova/data';
  import KeyValue from '../../ui/KeyValue.svelte';
  import Panel from '../../ui/Panel.svelte';

  /** Motorisations (renderAtlas, lignes 1359-1367) : consommation en carburant par UA. */
  const conso = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} u/UA`;
</script>

<Panel title="Motorisation" right="CR POINT 8" style="flex:1">
  <div class="bd">
    {#each engines as moteur (moteur.id)}
      <KeyValue label={moteur.id} value={conso(moteur.fuelRate)} />
      <div class="desc">{moteur.description}</div>
    {/each}
  </div>
</Panel>

<style>
  .desc {
    font-size: 9px;
    color: var(--muted);
    margin: -2px 0 6px;
  }
</style>
