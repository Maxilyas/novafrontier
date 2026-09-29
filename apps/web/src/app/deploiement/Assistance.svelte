<script lang="ts">
  import Btn from '../../ui/Btn.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Assistance au placement (renderDeployPanels, lignes 2130-2139). Deploiement automatique et
   * retrait relevent d'une phase ulterieure (FR-018) : le placement reste automatique (FR-017).
   */
</script>

<Panel title="Assistance" style="flex:1">
  <div class="bd">
    <Btn style="width:100%" laterPhase="auto-deploy">Déploiement automatique</Btn>
    <div class="note">
      Applique la formation par défaut : blindés en première ligne, unités à portée derrière.
      Modifiable emplacement par emplacement avant le lancement.
    </div>
    <Btn variant="ghost" style="width:100%;margin-top:9px" laterPhase="clear-deploy">Tout retirer</Btn>
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
