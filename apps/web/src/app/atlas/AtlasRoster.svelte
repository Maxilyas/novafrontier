<script lang="ts">
  import { rarityById, units } from '@nova/data';
  import { navigate } from '../../state/router.svelte';
  import { selection } from '../../state/selection.svelte';
  import UnitArt from '../../ui/art/UnitArt.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Effectifs de l'Atlas (renderAtlas, lignes 1284-1292) : les 11 cartes, en petit format. Choisir
   * une carte ouvre sa fiche et remplace l'adresse (#/atlas/<unite>), sans entree d'historique.
   */
  const nomCourt = (nom: string) => nom.split(' ').at(-1);
</script>

<Panel title="Effectifs" right="{units.length} CARTES">
  <div class="bd liste">
    {#each units as unite (unite.id)}
      <button
        type="button"
        class="card mini notched"
        style="--notch:5px;--rc:{rarityById(unite.rarity)?.color};width:52px;height:72px"
        data-unit={unite.id}
        aria-label={unite.name}
        aria-pressed={unite.id === selection.current.atlas.unit}
        onclick={() => navigate({ screen: 'atlas', unit: unite.id }, { replace: true })}
      >
        <span class="art"><UnitArt unit={unite} /></span>
        <span class="shade"></span>
        <span class="nm" style="font-size:6px;bottom:4px">{nomCourt(unite.name)}</span>
      </button>
    {/each}
  </div>
</Panel>

<style>
  .liste {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    max-height: 172px;
    overflow: auto;
  }
</style>
