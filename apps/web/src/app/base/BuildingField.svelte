<script lang="ts">
  import { buildings } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import BuildingArt from '../../ui/art/BuildingArt.svelte';

  /**
   * Plan de la base (renderBase, lignes 1466-1470 ; CSS 343-351). Les batiments gardent les
   * coordonnees de la maquette, dans la zone comprise entre la liste (bord droit a x = 306) et le
   * detail (bord gauche a x = 1240), sous le titre (y = 44). Le plan est mis a l'echelle de sa zone :
   * 1 a 1600x900.
   */
  const ORIGINE = { x: 306, y: 44 };
  const PLAN = { largeur: 934, hauteur: 752 };

  let largeur = $state(PLAN.largeur);
  let hauteur = $state(PLAN.hauteur);
  const echelle = $derived(Math.min(largeur / PLAN.largeur, hauteur / PLAN.hauteur));
</script>

<div class="bfield" bind:clientWidth={largeur} bind:clientHeight={hauteur}>
  <div
    class="plan"
    style:width="{PLAN.largeur}px"
    style:height="{PLAN.hauteur}px"
    style:left="{(largeur - PLAN.largeur * echelle) / 2}px"
    style:transform="scale({echelle})"
  >
    {#each buildings as batiment (batiment.id)}
      {@const on = batiment.id === selection.current.building}
      {@const { x, y, width } = batiment.position}
      <button
        type="button"
        class="bldg"
        class:sel={on}
        aria-pressed={on}
        style:left="{x - width / 2 - ORIGINE.x}px"
        style:top="{y - ORIGINE.y}px"
        onclick={() => selection.selectBuilding(batiment.id)}
      >
        <BuildingArt kind={batiment.id} {width} height={width * 0.8} />
        <span class="bt">{batiment.name} · <b>NIV {batiment.level}</b></span>
      </button>
    {/each}
  </div>
</div>

<style>
  .bfield {
    grid-area: field;
    position: relative;
    min-width: 0;
    min-height: 0;
  }
  .plan {
    position: absolute;
    top: 0;
    transform-origin: 0 0;
  }
  .bldg {
    position: absolute;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: 0.16s;
    filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.65));
  }
  .bldg:hover {
    filter: drop-shadow(0 0 14px rgba(99, 214, 188, 0.45))
      drop-shadow(0 10px 12px rgba(0, 0, 0, 0.65));
  }
  .bldg :global(svg) {
    display: block;
    overflow: visible;
  }
  .bt {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: calc(100% - 26px);
    white-space: nowrap;
    z-index: 4;
    font-size: 8.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--paper);
    background: rgba(5, 9, 8, 0.88);
    border: 1px solid var(--line-hi);
    padding: 2px 7px;
  }
  .bt b {
    color: var(--sig);
    font-weight: 400;
  }
  .bldg.sel .bt {
    background: var(--sig);
    color: #04120f;
    border-color: var(--sig-hi);
  }
  .bldg.sel .bt b {
    color: #04120f;
  }
</style>
