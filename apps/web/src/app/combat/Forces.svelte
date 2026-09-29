<script lang="ts">
  import { derivedValues, unitById, weaponById } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import Panel from '../../ui/Panel.svelte';

  /** Force engagee, a pleine sante (renderForce, lignes 2299-2307 ; CSS 543-548). */
  const engagees = $derived(
    derivedValues.combatStart[selection.current.squad][selection.current.theatre].units,
  );
</script>

<Panel title="Force engagée" right="{engagees.length}/{engagees.length}" class="cforce">
  {#each engagees as engagee, i (i)}
    {@const unite = unitById(engagee.unit)}
    {@const arme = unite && unite.family !== 'cmd' ? weaponById(unite.weapon) : undefined}
    <div class="frow" data-unit={engagee.unit}>
      <span class="pip" style:background={arme?.color}></span>
      <span class="fn">{unite?.name}</span>
      <span class="fb"><i style="width:100%"></i></span>
      <span class="fq">{engagee.maxHp}</span>
    </div>
  {/each}
</Panel>

<style>
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
