<script lang="ts">
  import { demoState } from '@nova/data';
  import Bar from '../../ui/Bar.svelte';
  import Icon from '../../ui/Icon.svelte';
  import Panel from '../../ui/Panel.svelte';

  /** File de recherche (lignes 771-774 et 1630-1639 ; CSS 406-413). */
  const { researchQueue } = demoState;
</script>

<Panel title="File de recherche" right={researchQueue.header} class="rqueue">
  <div class="qrow">
    {#each researchQueue.slots as emplacement, i (i)}
      {#if emplacement.kind === 'active'}
        <div class="qc">
          <div class="qi"><Icon icon={emplacement.icon} size={15} stroke="#63d6bc" /></div>
          <div style="flex:1">
            <div class="qn">{emplacement.label}</div>
            <Bar value={emplacement.progress * 100} style="margin-top:5px" />
          </div>
          <div class="qt">{emplacement.remaining}</div>
        </div>
      {:else}
        <div class="qc empty"><div class="qn" style="color:var(--muted)">{emplacement.label}</div></div>
      {/if}
    {/each}
  </div>
</Panel>

<style>
  .qrow {
    display: flex;
    gap: 9px;
    padding: 9px 11px;
  }
  .qc {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px 9px;
    border: 1px solid var(--line);
    background: rgba(0, 0, 0, 0.3);
  }
  .qc.empty {
    border-style: dashed;
    justify-content: center;
  }
  .qi {
    width: 26px;
    height: 26px;
    border: 1px solid var(--line-hi);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .qn {
    font-size: 10px;
    color: var(--paper);
  }
  .qt {
    font-family: var(--f-mono);
    font-size: 10.5px;
    color: var(--sig);
    margin-left: auto;
  }
</style>
