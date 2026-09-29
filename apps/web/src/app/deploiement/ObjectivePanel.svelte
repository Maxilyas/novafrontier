<script lang="ts">
  import { demoState, derivedValues } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import { nombre } from '../../ui/format';
  import KeyValue from '../../ui/KeyValue.svelte';
  import Panel from '../../ui/Panel.svelte';

  /** Objectif a defendre (renderDeployPanels, lignes 2118-2126). */
  const theatre = $derived(selection.current.theatre === 'orbital' ? 'ORBITAL' : 'TERRESTRE');
</script>

<Panel title="Objectif" right={theatre}>
  <div class="bd">
    <KeyValue label="Type" value="Relique" valueClass="gold" />
    <KeyValue label="Intégrité" value="{nombre(demoState.mission.relicHp)} PV" />
    <KeyValue label="Vagues" value={derivedValues.mission.waves.length} />
    <KeyValue label="Condition de victoire" value="Relique > 0" />
  </div>
</Panel>
