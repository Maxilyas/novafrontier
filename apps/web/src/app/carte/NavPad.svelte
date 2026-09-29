<script lang="ts">
  import { demoState } from '@nova/data';
  import { LATER_PHASE_MESSAGE, showToast } from '../../state/toast.svelte';

  /**
   * Fleches de deplacement de la carte (lignes 785-788 ; CSS 434-440). Deplacer la vue releve de la
   * phase P2 de la feuille de route (FR-018) : chaque fleche affiche le message bref.
   */
  const FLECHES = [
    { classe: 'n', glyphe: '▲', nom: 'Nord' },
    { classe: 's', glyphe: '▼', nom: 'Sud' },
    { classe: 'w', glyphe: '◀', nom: 'Ouest' },
    { classe: 'e', glyphe: '▶', nom: 'Est' },
  ];
</script>

<div class="navpad">
  {#each FLECHES as fleche (fleche.classe)}
    <button
      type="button"
      class={fleche.classe}
      aria-label="Déplacer la vue vers le {fleche.nom}"
      data-later-phase="map-move"
      onclick={() => showToast(LATER_PHASE_MESSAGE)}
    >
      {fleche.glyphe}
    </button>
  {/each}
  <div class="c">{demoState.defaults.map.coords}</div>
</div>

<style>
  .navpad {
    position: absolute;
    left: 20px;
    bottom: 20px;
    width: 130px;
    height: 130px;
    z-index: 12;
  }
  button {
    position: absolute;
    width: 42px;
    height: 42px;
    background: rgba(8, 14, 12, 0.9);
    border: 1px solid var(--line-hi);
    color: var(--sig);
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  button:hover {
    border-color: var(--sig);
    background: rgba(99, 214, 188, 0.16);
  }
  .n {
    left: 44px;
    top: 0;
  }
  .s {
    left: 44px;
    bottom: 0;
  }
  .w {
    left: 0;
    top: 44px;
  }
  .e {
    right: 0;
    top: 44px;
  }
  .c {
    position: absolute;
    left: 44px;
    top: 44px;
    width: 42px;
    height: 42px;
    background: rgba(8, 14, 12, 0.9);
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--f-mono);
    font-size: 8px;
    color: var(--muted);
    letter-spacing: 0;
  }
</style>
