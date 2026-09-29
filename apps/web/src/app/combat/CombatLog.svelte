<script lang="ts">
  import { derivedValues } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Journal du combat a son etat initial (startCombat, lignes 2179-2180, puis spawnWave, ligne
   * 2201 ; CSS 549-553) : deploiement, formation et annonce de la premiere vague, le plus recent en
   * premier.
   */
  const premiere = derivedValues.mission.waves[0];
  const unites = $derived(
    derivedValues.combatStart[selection.current.squad][selection.current.theatre].units.length,
  );
  const formation = $derived(
    selection.current.formation[selection.current.squad] === 'ring' ? '360°' : 'en arc',
  );
</script>

<Panel title="Journal" class="clog">
  <div class="lignes">
    {#if premiere}
      <div class="ll" class:gold={premiere.boss}>
        Vague 01 — {premiere.composition}{premiere.boss ? ' · BOSS' : ''}
      </div>
    {/if}
    <div class="ll">Formation {formation} · objectif au centre du dispositif</div>
    <div class="ll ok">Escouade déployée — {unites} unités en position</div>
  </div>
</Panel>

<style>
  .ll {
    font-family: var(--f-mono);
    font-size: 9.5px;
    padding: 2px 10px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ll.ok {
    color: var(--ok);
  }
  .ll.gold {
    color: var(--gold);
  }
</style>
