<script lang="ts">
  import { derivedValues } from '@nova/data';
  import { nombre } from '../../ui/format';
  import KeyValue from '../../ui/KeyValue.svelte';
  import Panel from '../../ui/Panel.svelte';

  /** Objectifs de la mission (renderBrief, lignes 1879-1888). */
  const { mission } = derivedValues;
</script>

<Panel title="Objectifs">
  <div class="bd">
    <KeyValue label="Principal" value="Tenir la relique {mission.waves.length} vagues" />
    <KeyValue label="Secondaire" value="Intégrité > 60%" />
    <KeyValue
      label="Gain de territoire"
      value="+{nombre(mission.territoryGain)} crédits / jour"
      valueClass="ok"
    />
    <div class="note">
      Certaines missions imposent une composition : blindage minimum, présence de mécas au sol, ou
      armement précis contre la dominante adverse. La contrainte est annoncée avant le départ.
    </div>
  </div>
</Panel>

<style>
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.55;
    margin-top: 9px;
  }
</style>
