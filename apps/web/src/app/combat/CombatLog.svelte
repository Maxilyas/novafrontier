<script lang="ts">
  import { combatHud } from '../../state/combat.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Journal du combat (FR-029, CSS 549-553) : messages de la maquette construits a partir des
   * evenements (state/combat-log.ts), le plus recent en premier, 11 lignes au plus.
   */
</script>

<Panel title="Journal" class="clog">
  <div class="lignes" aria-live="off">
    {#each combatHud.log as ligne (ligne.id)}
      <div class="ll {ligne.tone}">
        {#each ligne.parts as morceau, i (i)}{#if morceau.strong}<b>{morceau.text}</b
            >{:else}{morceau.text}{/if}{/each}
      </div>
    {/each}
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
  .ll.crit {
    color: var(--warn);
  }
  .ll b {
    color: var(--paper);
    font-weight: 400;
  }
  .ll.gold {
    color: var(--gold);
  }
</style>
