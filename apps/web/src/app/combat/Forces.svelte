<script lang="ts">
  import { combatHud } from '../../state/combat.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Force engagee (renderForce, lignes 2299-2307 ; CSS 543-548), mise a jour au moins deux fois par
   * seconde (FR-027, FR-028) : unites vivantes sur engagees, et par unite son armement, son nom et
   * ses PV, estompee une fois detruite.
   */
  const lignes = $derived(combatHud.forces);
  const vivantes = $derived(lignes.filter((l) => !l.destroyed).length);
</script>

<Panel title="Force engagée" right="{vivantes}/{lignes.length}" class="cforce">
  {#each lignes as ligne (ligne.id)}
    <div
      class="frow"
      class:detruite={ligne.destroyed}
      data-unit={ligne.unitId}
      data-hp={ligne.hp}
      data-destroyed={ligne.destroyed}
    >
      <span class="pip" style:background={ligne.weaponColor}></span>
      <span class="fn">{ligne.name}</span>
      <span class="fb"><i style:width="{(ligne.hp / ligne.maxHp) * 100}%"></i></span>
      <span class="fq">{ligne.hp}</span>
    </div>
  {/each}
</Panel>

<style>
  .frow.detruite {
    opacity: 0.3;
  }
  .frow {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .pip {
    width: 7px;
    height: 7px;
    transform: rotate(45deg);
    flex: 0 0 auto;
  }
  .fn {
    font-size: 9.5px;
    color: var(--paper);
    letter-spacing: 0.04em;
  }
  .fb {
    flex: 1;
    height: 4px;
    background: #0a0f0e;
    position: relative;
    margin-left: auto;
    max-width: 66px;
  }
  .fb i {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: var(--ok);
  }
  .fq {
    font-family: var(--f-mono);
    font-size: 9px;
    color: var(--muted);
    width: 22px;
    text-align: right;
  }
</style>
