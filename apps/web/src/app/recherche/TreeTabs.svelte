<script lang="ts">
  import { researchTrees } from '@nova/data';
  import { selection } from '../../state/selection.svelte';

  /** Onglets des arbres de recherche (lignes 1627-1628 ; CSS 374-378). */
</script>

<fieldset class="rtabs">
  <legend class="visually-hidden">Arbre de recherche</legend>
  {#each researchTrees as arbre (arbre.id)}
    {@const on = arbre.id === selection.current.tree}
    <button
      type="button"
      class="rtab"
      class:on
      aria-pressed={on}
      onclick={() => selection.selectTree(arbre.id)}
    >
      {arbre.label}
    </button>
  {/each}
</fieldset>

<style>
  .rtabs {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    z-index: 5;
    margin: 0;
    padding: 0;
    border: 0;
    min-inline-size: 0;
  }
  .rtab {
    padding: 8px 24px;
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid var(--line);
    color: var(--muted);
    background: #0c1211;
    transition: 0.14s;
  }
  .rtab:hover {
    color: var(--paper);
  }
  .rtab.on {
    color: #04120f;
    background: var(--sig);
    border-color: var(--sig);
  }
</style>
