<script lang="ts">
  import { derivedValues, rarityById, unitById } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import { LATER_PHASE_MESSAGE, showToast } from '../../state/toast.svelte';
  import UnitArt from '../../ui/art/UnitArt.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Unites a placer (renderDeployPanels, lignes 2075-2102 ; CSS 509-525). Tant que le plateau
   * n'existe pas, elles sont placees automatiquement selon la formation (FR-017) ; en choisir une
   * releve d'une phase ulterieure (FR-018).
   */
  const engagees = $derived(
    derivedValues.deployment[selection.current.squad][selection.current.theatre].units,
  );
</script>

<Panel title="Unités à placer" right="{engagees.length}/{engagees.length}" class="pool">
  <div class="upool">
    {#each engagees as engagee (engagee.unit)}
      {@const unite = unitById(engagee.unit)}
      {#if unite && unite.family !== 'cmd'}
        <button
          type="button"
          class="urow placed"
          data-unit={unite.id}
          data-later-phase="pick-unit"
          onclick={() => showToast(LATER_PHASE_MESSAGE)}
        >
          <span class="uav" style="--rc:{rarityById(unite.rarity)?.color}"><UnitArt unit={unite} /></span>
          <span>
            <span class="un">{unite.name}</span>
            <span class="ust">
              <span class="hp">{unite.stats.hp} PV</span><span class="at"
                >{unite.stats.attack} ATQ</span
              ><span class="df">{unite.stats.defense} DÉF</span>
            </span>
          </span>
          <span class="utag {engagee.line}">{engagee.line === 'back' ? '2ᵉ L.' : '1ʳᵉ L.'}</span>
        </button>
      {/if}
    {/each}
  </div>
  <div class="bd" style="border-top:1px solid var(--line)">
    <div class="legendrow">
      <span class="sq" style="background:#e8543f"></span>Première ligne — blindage moyen et lourd
    </div>
    <div class="legendrow">
      <span class="sq" style="background:#63d6bc"></span>Seconde ligne — unités à portée
    </div>
    <div class="legendrow">
      <span class="sq" style="background:#f5a623"></span>Objectif à défendre
    </div>
  </div>
</Panel>

<style>
  .upool {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 9px;
    overflow-y: auto;
    flex: 1;
  }
  .upool::-webkit-scrollbar {
    width: 5px;
  }
  .upool::-webkit-scrollbar-thumb {
    background: var(--line-hi);
  }
  .urow {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 8px;
    border: 1px solid var(--line);
    cursor: grab;
    transition: 0.14s;
    background: #0b110f;
    color: inherit;
    font: inherit;
    text-align: left;
  }
  .urow:hover {
    border-color: var(--sig-dim);
    background: rgba(99, 214, 188, 0.06);
  }
  .urow.placed {
    opacity: 0.34;
    cursor: default;
  }
  .uav {
    width: 30px;
    height: 38px;
    flex: 0 0 auto;
    border: 1px solid var(--rc, #3a4741);
    overflow: hidden;
    position: relative;
  }
  .uav :global(svg) {
    width: 100%;
    height: 100%;
  }
  .un,
  .ust {
    display: block;
  }
  .un {
    font-size: 10px;
    color: var(--paper);
    letter-spacing: 0.04em;
  }
  .ust {
    font-family: var(--f-mono);
    font-size: 8.5px;
    color: var(--muted);
    margin-top: 2px;
    display: flex;
    gap: 7px;
  }
  .hp {
    color: var(--ok);
  }
  .at {
    color: var(--warn);
  }
  .df {
    color: var(--sig);
  }
  .utag {
    margin-left: auto;
    font-size: 8px;
    letter-spacing: 0.1em;
    padding: 2px 5px;
    border: 1px solid var(--line-hi);
    color: var(--muted);
  }
  .utag.front {
    border-color: rgba(232, 84, 63, 0.45);
    color: #ff9c8f;
  }
  .utag.back {
    border-color: var(--sig-dim);
    color: var(--sig);
  }
  .legendrow {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 4px 0;
    font-size: 9px;
    letter-spacing: 0.1em;
    color: var(--muted);
  }
  .sq {
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
  }
</style>
