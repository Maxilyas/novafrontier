<script lang="ts">
  import { demoState, derivedValues, type Squad } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import { isUnlockedSquad } from '../../state/selection-rules';
  import { nombre } from '../../ui/format';

  /**
   * Onglets d'escouade (renderSquadTabs, lignes 1102-1111 ; CSS 256-268). Une escouade
   * verrouillee reste visible avec son grade requis, mais ne se choisit pas (FR-015).
   */
  function resume(escouade: Squad): string {
    if (!isUnlockedSquad(escouade.id, demoState)) return 'Verrouillé';
    const valeurs = derivedValues.squads[escouade.id];
    return `${valeurs.filled}/6 · ${nombre(valeurs.power)} PUISS.`;
  }
</script>

<fieldset class="squadtabs">
  <legend class="visually-hidden">Escouade</legend>
  {#each demoState.squads as escouade, i (escouade.id)}
    {@const on = escouade.id === selection.current.squad}
    <button
      type="button"
      class="stab"
      class:on
      class:lock={escouade.lockedUntilRank !== undefined}
      aria-pressed={on}
      aria-disabled={escouade.lockedUntilRank !== undefined ? 'true' : undefined}
      onclick={() => selection.selectSquad(escouade.id)}
    >
      <span class="idx">{i + 1}</span>
      <span>
        <span class="sn">{escouade.name.replace('Escouade ', '')}</span>
        <span class="sp">{resume(escouade)}</span>
      </span>
      {#if escouade.lockedUntilRank !== undefined}
        <span class="ml">{escouade.lockedUntilRank}</span>
      {/if}
    </button>
  {/each}
</fieldset>

<style>
  .squadtabs {
    grid-area: tabs;
    align-self: start;
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin: 0;
    padding: 0;
    border: 0;
    min-inline-size: 0;
  }
  .stab {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 9px 11px;
    border: 1px solid var(--line);
    cursor: pointer;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.02), transparent);
    color: inherit;
    font: inherit;
    text-align: left;
    transition: 0.14s;
  }
  .stab:hover {
    border-color: var(--line-hi);
  }
  .stab.on {
    border-color: var(--sig);
    background: linear-gradient(90deg, rgba(99, 214, 188, 0.16), transparent);
  }
  .sn,
  .sp {
    display: block;
  }
  .sn {
    font-size: 11.5px;
    letter-spacing: 0.16em;
    color: var(--paper);
    text-transform: uppercase;
  }
  .sp {
    font-family: var(--f-mono);
    font-size: 9px;
    color: var(--muted);
    margin-top: 2px;
  }
  .stab.on .sp {
    color: var(--sig);
  }
  .idx {
    width: 22px;
    height: 22px;
    border: 1px solid var(--line-hi);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--f-mono);
    font-size: 10px;
    color: var(--muted);
    flex: 0 0 auto;
  }
  .stab.on .idx {
    border-color: var(--sig);
    color: var(--sig);
  }
  .stab.lock {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .ml {
    margin-left: auto;
    font-size: 8px;
    letter-spacing: 0.14em;
    color: var(--muted);
  }
</style>
