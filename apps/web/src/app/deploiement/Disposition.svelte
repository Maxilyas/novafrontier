<script lang="ts">
  import { selection } from '../../state/selection.svelte';
  import OpenBadge from '../../ui/OpenBadge.svelte';
  import Panel from '../../ui/Panel.svelte';
  import Seg from '../../ui/Seg.svelte';

  /**
   * Disposition (renderDeployPanels, lignes 2106-2117) : la formation de l'escouade, partagee avec
   * Escouades et le Briefing (FR-016). En changer ne retire aucune unite (FR-017).
   */
  const FORMATIONS = [
    { value: 'ring', label: '360°' },
    { value: 'arc', label: 'Arc' },
  ] as const;

  const formation = $derived(selection.current.formation[selection.current.squad]);
</script>

<Panel title="Disposition" right="CR POINT 2">
  <div class="bd">
    <Seg
      label="Disposition"
      options={FORMATIONS}
      value={formation}
      onchange={(choix) => selection.setFormation(choix)}
      style="width:100%"
      buttonStyle="flex:1"
    />
    <div class="note">
      {formation === 'ring'
        ? "L'objectif est au centre, les vagues arrivent de tous les côtés. Il faut couvrir 360°."
        : "L'objectif est adossé à un bord, les vagues arrivent d'une seule direction. Les lignes se concentrent."}
    </div>
    <div style="margin-top:9px"><OpenBadge>Disposition à trancher</OpenBadge></div>
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
