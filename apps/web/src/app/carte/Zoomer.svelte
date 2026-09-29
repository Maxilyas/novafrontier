<script lang="ts">
  import { demoState } from '@nova/data';
  import { LATER_PHASE_MESSAGE, showToast } from '../../state/toast.svelte';

  /**
   * Niveaux de zoom de la carte (lignes 789-793 ; CSS 441-444). Changer d'echelle releve de la
   * phase P2 de la feuille de route (FR-018) ; l'echelle affichee reste celle de la demonstration.
   */
  const NIVEAUX = ['Secteur', 'Bras', 'Galaxie'];
</script>

<div class="zoomer">
  {#each NIVEAUX as niveau (niveau)}
    {@const on = niveau === demoState.defaults.map.scale}
    <button
      type="button"
      class:on
      aria-pressed={on}
      data-later-phase="map-zoom"
      onclick={() => showToast(LATER_PHASE_MESSAGE)}
    >
      {niveau}
    </button>
  {/each}
</div>

<style>
  .zoomer {
    position: absolute;
    left: 166px;
    bottom: 20px;
    z-index: 12;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  button {
    padding: 7px 12px;
    background: rgba(8, 14, 12, 0.9);
    border: 1px solid var(--line-hi);
    color: var(--muted);
    font-size: 9.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer;
    text-align: left;
  }
  button.on {
    border-color: var(--sig);
    color: var(--sig);
    background: rgba(99, 214, 188, 0.12);
  }
</style>
