<script lang="ts">
  import { selection } from '../../state/selection.svelte';

  /** Paliers visuels 1 a 4 (renderAtlas, lignes 1276-1279 ; CSS 309-315), hors commandants. */
  const PALIERS = ['Coque nue', '+ Canons', '+ Structures', '+ Escadron'];
</script>

<div class="tiers">
  {#each PALIERS as libelle, i (libelle)}
    {@const palier = i + 1}
    {@const on = palier === selection.current.atlas.tier}
    <button
      type="button"
      class="tier"
      class:on
      aria-pressed={on}
      onclick={() => selection.setAtlasTier(palier)}
    >
      <span class="tn">Palier {palier}</span>
      <span class="tv">{libelle}</span>
    </button>
  {/each}
</div>

<style>
  .tiers {
    display: flex;
    gap: 8px;
  }
  .tier {
    width: 88px;
    padding: 8px 6px;
    border: 1px solid var(--line);
    background: #0b110f;
    cursor: pointer;
    text-align: center;
    color: inherit;
    font: inherit;
    transition: 0.14s;
  }
  .tier:hover {
    border-color: var(--line-hi);
  }
  .tier.on {
    border-color: var(--sig);
    background: rgba(99, 214, 188, 0.1);
  }
  .tn,
  .tv {
    display: block;
  }
  .tn {
    font-size: 9px;
    letter-spacing: 0.14em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .tier.on .tn {
    color: var(--sig);
  }
  .tv {
    font-family: var(--f-mono);
    font-size: 13px;
    color: var(--paper);
    margin-top: 3px;
  }
</style>
