<script lang="ts">
  import { buildings } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import Btn from '../../ui/Btn.svelte';
  import { nombre } from '../../ui/format';
  import Icon from '../../ui/Icon.svelte';
  import KeyValue from '../../ui/KeyValue.svelte';
  import Panel from '../../ui/Panel.svelte';
  import Pill from '../../ui/Pill.svelte';

  /**
   * Detail du batiment choisi (selB, lignes 1492-1510 ; CSS 363). Ameliorer et mettre en file
   * relevent d'une phase ulterieure (FR-018).
   */
  const batiment = $derived(buildings.find((b) => b.id === selection.current.building));
</script>

{#if batiment}
  <Panel
    title={batiment.name}
    right="NIV {batiment.level} → {batiment.level + 1}"
    class="bdet"
  >
    <div class="bd">
      <div class="entete">
        <div class="icone"><Icon icon={batiment.icon} size={34} stroke="#63d6bc" strokeWidth={1.1} /></div>
        <div class="description">{batiment.description}</div>
      </div>
      <div class="tiny" style="margin:13px 0 6px">Coût d'amélioration</div>
      <div style="display:flex;gap:7px">
        <Pill>{nombre(batiment.upgrade.alloy)} alliage</Pill>
        <Pill variant="g">{nombre(batiment.upgrade.credits)} crédits</Pill>
      </div>
      <KeyValue label="Durée" value={batiment.upgrade.duration} style="margin-top:11px" />
      <KeyValue
        label="Effet niveau {batiment.level + 1}"
        value={batiment.upgrade.effect}
        valueClass="ok"
      />
      <div style="display:flex;gap:7px;margin-top:12px">
        <Btn variant="solid" style="flex:1" laterPhase="upgrade-building">Améliorer</Btn>
        <Btn variant="ghost" laterPhase="queue-building">File</Btn>
      </div>
    </div>
  </Panel>
{/if}

<style>
  .entete {
    display: flex;
    gap: 11px;
    align-items: flex-start;
  }
  .icone {
    width: 60px;
    height: 60px;
    border: 1px solid var(--line-hi);
    background: #0a100f;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .description {
    font-size: 10.5px;
    line-height: 1.55;
  }
</style>
