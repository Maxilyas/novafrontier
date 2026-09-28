<script lang="ts">
  import { buildingSlots, buildings } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import Icon from '../../ui/Icon.svelte';
  import Panel from '../../ui/Panel.svelte';

  /** Liste des batiments (renderBase, lignes 1471-1474 ; CSS 352-362). */
</script>

<Panel title="Bâtiments" right="{buildingSlots.used} / {buildingSlots.total}" class="blist">
  <div class="rangees">
    {#each buildings as batiment (batiment.id)}
      {@const on = batiment.id === selection.current.building}
      <button
        type="button"
        class="blrow"
        class:on
        aria-pressed={on}
        onclick={() => selection.selectBuilding(batiment.id)}
      >
        <span class="bico"><Icon icon={batiment.icon} size={17} stroke="#63d6bc" /></span>
        <span>
          <span class="bnm">{batiment.name}</span>
          <span class="blv">NIVEAU {batiment.level}</span>
        </span>
        <span class="bst">{batiment.status}</span>
      </button>
    {/each}
  </div>
</Panel>

<style>
  .rangees {
    overflow: auto;
    flex: 1;
    padding: 6px;
  }
  .blrow {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 7px 9px;
    border: 1px solid transparent;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .blrow:hover {
    background: rgba(99, 214, 188, 0.05);
    border-color: var(--line);
  }
  .blrow.on {
    background: rgba(99, 214, 188, 0.12);
    border-color: var(--sig-dim);
  }
  .bico {
    width: 28px;
    height: 28px;
    flex: 0 0 auto;
    border: 1px solid var(--line-hi);
    background: #0a100f;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .bnm,
  .blv {
    display: block;
  }
  .bnm {
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--paper);
    line-height: 1.2;
  }
  .blv {
    font-size: 8.5px;
    font-family: var(--f-mono);
    color: var(--muted);
    margin-top: 2px;
  }
  .bst {
    margin-left: auto;
    font-size: 9px;
    font-family: var(--f-mono);
    color: var(--sig);
  }
</style>
