<script lang="ts">
  import { demoState, type UnitFamily, units } from '@nova/data';
  import { navigate } from '../../state/router.svelte';
  import { selection } from '../../state/selection.svelte';
  import Panel from '../../ui/Panel.svelte';
  import UnitCard from '../../ui/UnitCard.svelte';

  /**
   * Panneau "Effectifs disponibles" (maquette, lignes 719-728 et 1172-1178) : filtre par famille,
   * cartes de la famille, marque des unites de l'escouade courante. Composer l'escouade releve
   * d'une phase ulterieure (FR-018) ; le bouton "Fiche" ouvre l'Atlas (FR-004).
   */

  const FILTRES: { value: UnitFamily; label: string }[] = [
    { value: 'cmd', label: 'Commandants' },
    { value: 'ship', label: 'Vaisseaux' },
    { value: 'mech', label: 'Mécas' },
  ];

  const escouade = $derived(demoState.squads.find((s) => s.id === selection.current.squad));
  const engagees = $derived(
    new Set(
      escouade ? [escouade.commander, ...escouade.ships, ...escouade.mechs].filter(Boolean) : [],
    ),
  );
  const famille = $derived(units.filter((u) => u.family === selection.current.rosterFilter));
</script>

{#snippet filtre()}
  <fieldset class="rfilter">
    <legend class="visually-hidden">Famille d'unités</legend>
    {#each FILTRES as option (option.value)}
      <button
        type="button"
        class:on={option.value === selection.current.rosterFilter}
        aria-pressed={option.value === selection.current.rosterFilter}
        onclick={() => selection.setRosterFilter(option.value)}
      >
        {option.label}
      </button>
    {/each}
  </fieldset>
{/snippet}

<Panel title="Effectifs disponibles" class="roster" headerExtra={filtre}>
  <div class="rlist">
    {#each famille as unite (unite.id)}
      <UnitCard
        unit={unite}
        size="mini"
        selected={engagees.has(unite.id)}
        laterPhase="assign-unit"
        onFiche={() => navigate({ screen: 'atlas', unit: unite.id })}
      />
    {/each}
  </div>
</Panel>

<style>
  :global(.panel.roster) {
    grid-area: roster;
    overflow: hidden;
  }
  .rlist {
    display: flex;
    gap: 8px;
    padding: 11px;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  .rlist::-webkit-scrollbar {
    height: 5px;
  }
  .rlist::-webkit-scrollbar-thumb {
    background: var(--line-hi);
  }
  .rfilter {
    display: flex;
    gap: 3px;
    margin: 0 0 0 auto;
    padding: 0;
    border: 0;
    min-inline-size: 0;
  }
  .rfilter button {
    background: transparent;
    border: 1px solid var(--line);
    color: var(--muted);
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 3px 9px;
    cursor: pointer;
  }
  .rfilter button.on {
    border-color: var(--sig);
    color: var(--sig);
  }
</style>
