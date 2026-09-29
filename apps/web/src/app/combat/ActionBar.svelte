<script lang="ts">
  import { demoState, derivedValues, rarityById, unitById } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import { LATER_PHASE_MESSAGE, showToast } from '../../state/toast.svelte';
  import Icon from '../../ui/Icon.svelte';

  /**
   * Points d'action et barre d'actions (renderCombatPanels, lignes 2321-2333 ; CSS 554-573). Les
   * competences, limitees aux points d'action du commandant, et l'ultime relevent de la phase P1
   * de la feuille de route (FR-018).
   */
  const { ultimate } = derivedValues.combat;

  const commandant = $derived.by(() => {
    const escouade = demoState.squads.find((s) => s.id === selection.current.squad);
    const unite = escouade?.commander ? unitById(escouade.commander) : undefined;
    return unite?.family === 'cmd' ? unite : undefined;
  });
  const rarete = $derived(commandant ? rarityById(commandant.rarity) : undefined);
  const points = $derived(rarete?.actionPoints ?? 0);
  const competences = $derived(commandant?.skills.slice(0, points) ?? []);
</script>

<div class="apts">
  <span class="pl">Points d'action</span>
  <span class="pts">
    {#each Array.from({ length: points }, (_, i) => i) as i (i)}<i class="f"></i>{/each}
  </span>
  <span class="tiny" style="letter-spacing:.1em">
    {commandant ? `${rarete?.label} — ${points} actions` : ''}
  </span>
</div>

<div class="actbar">
  {#each competences as competence (competence.name)}
    <button
      type="button"
      class="act notched"
      style="--notch:6px"
      data-later-phase="commander-action"
      onclick={() => showToast(LATER_PHASE_MESSAGE)}
    >
      <Icon icon={competence.icon} size={25} strokeWidth={1.4} />
      <span class="an">{competence.name}</span>
      <span class="ac">1</span>
    </button>
  {/each}
  <button
    type="button"
    class="act ult notched"
    class:locked={!ultimate.ready}
    style="--notch:6px"
    data-later-phase="ultimate"
    onclick={() => showToast(LATER_PHASE_MESSAGE)}
  >
    <Icon icon="ic-ult" size={25} strokeWidth={1.4} />
    <span class="an">Ultime de palier</span>
    <span class="ac" style="color:var(--r-div)">NIV {ultimate.level}</span>
    <span class="ub"><i style="width:{ultimate.progress * 100}%"></i></span>
  </button>
</div>

<style>
  .apts {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 108px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 9;
    padding: 5px 12px;
    background: rgba(8, 12, 11, 0.86);
    border: 1px solid var(--line-hi);
    white-space: nowrap;
  }
  .pl {
    font-size: 9px;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .pts {
    display: flex;
    gap: 4px;
  }
  .pts i {
    width: 12px;
    height: 12px;
    border: 1px solid var(--gold);
    transform: rotate(45deg);
  }
  .pts i.f {
    background: var(--gold);
  }
  .actbar {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 26px;
    display: flex;
    gap: 9px;
    z-index: 9;
    align-items: flex-end;
  }
  .act {
    width: 74px;
    height: 74px;
    border: 1px solid rgba(245, 166, 35, 0.4);
    cursor: pointer;
    position: relative;
    background: linear-gradient(180deg, #1a1a12, #0a0c0a);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 0;
    color: inherit;
    font: inherit;
  }
  .act:hover {
    border-color: var(--gold);
    box-shadow: 0 0 16px rgba(245, 166, 35, 0.25);
  }
  .act :global(svg) {
    stroke: var(--gold);
  }
  .an {
    font-size: 7.5px;
    letter-spacing: 0.1em;
    color: var(--paper);
    text-transform: uppercase;
    text-align: center;
    padding: 0 3px;
  }
  .ac {
    position: absolute;
    right: 3px;
    top: 3px;
    font-family: var(--f-mono);
    font-size: 9px;
    color: var(--gold);
  }
  .act.ult {
    width: 92px;
    border-color: var(--r-div);
    background: linear-gradient(180deg, #1d0f1a, #0b060a);
  }
  .act.ult :global(svg) {
    stroke: var(--r-div);
  }
  /* Verrouille comme dans la maquette ; il reste activable pour afficher le message bref. */
  .act.ult.locked {
    opacity: 0.4;
  }
  .ub {
    position: absolute;
    left: 5px;
    right: 5px;
    bottom: 5px;
    height: 3px;
    background: #160b13;
  }
  .ub i {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: var(--r-div);
  }
</style>
