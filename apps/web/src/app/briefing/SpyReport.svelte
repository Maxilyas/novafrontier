<script lang="ts">
  import Btn from '../../ui/Btn.svelte';
  import Icon from '../../ui/Icon.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Rapport d'espionnage (renderBrief, lignes 1825-1848). L'espionnage releve d'une phase
   * ulterieure (FR-018) : le rapport reste "non effectue", comme a l'ouverture de la maquette.
   */
</script>

<Panel title="Rapport d'espionnage" right="NON EFFECTUÉ" class="espionnage">
  <div class="bd corps">
    <Icon icon="ic-spy" size={46} stroke="#31403a" strokeWidth={1} />
    <div class="texte">
      Sans reconnaissance, le nombre de vagues et l'armement adverse restent inconnus.
      L'espionnage coûte 900 crédits et 2 heures.
    </div>
    <Btn laterPhase="spy-planet">Espionner la planète</Btn>
  </div>
</Panel>

<style>
  .corps {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    text-align: center;
  }
  .texte {
    font-size: 11px;
    line-height: 1.6;
    color: var(--muted);
    max-width: 250px;
  }
</style>
