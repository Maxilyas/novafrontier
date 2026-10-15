<script lang="ts">
  import { derivedValues } from '@nova/data';
  import { type CombatResult, type CombatSetup, runCombat } from '@nova/sim';
  import { combatChoices, seedForCombat } from '../../state/combat.svelte';
  import { deployment } from '../../state/deployment.svelte';
  import { selection } from '../../state/selection.svelte';
  import Btn from '../../ui/Btn.svelte';
  import Panel from '../../ui/Panel.svelte';
  import AutoResolveModal from './AutoResolveModal.svelte';

  /**
   * Simulation hors ligne (renderBrief, lignes 1892-1907) : chances de victoire de
   * `derivedValues.briefing`. Sans unite engagee, la maquette affiche "NaN%" : ici "—" (FR-011).
   * "Resoudre automatiquement" calcule le combat par les regles de la sim, sans affichage ni
   * competence, avec le placement courant (automatique s'il n'y en a pas) (FR-030a).
   */
  const chances = $derived(derivedValues.briefing[selection.current.squad].winChance);
  const couleur = $derived(
    chances !== null && chances > 60
      ? 'var(--ok)'
      : chances !== null && chances > 35
        ? 'var(--gold)'
        : 'var(--warn)',
  );

  /** Entrees du combat a resoudre : placement du joueur s'il en a un, sinon automatique. */
  const choix = $derived.by(() => {
    const { squad, theatre, formation } = selection.current;
    const f = formation[squad];
    const place = deployment.has(squad, theatre, f)
      ? deployment.placementFor(squad, theatre, f)
      : undefined;
    return combatChoices(squad, theatre, f, place && place.length > 0 ? place : undefined);
  });

  let resolution = $state.raw<{ setup: CombatSetup; result: CombatResult } | null>(null);

  function resoudre() {
    if (!choix) return;
    const setup: CombatSetup = { ...choix, seed: seedForCombat(), commands: [] };
    resolution = { setup, result: runCombat(setup) };
  }
</script>

<Panel title="Simulation" right="CALCUL HORS LIGNE">
  <div class="gauge">
    <div class="gv" style:color={couleur}>{chances === null ? '—' : `${chances}%`}</div>
    <div class="gl">chances de victoire</div>
  </div>
  <div class="gbar"><i style="width:{chances ?? 0}%"></i><span style="left:50%"></span></div>
  <div class="bd" style="padding-top:0">
    <div class="note">
      Le scénario peut se dérouler sans vous : le combat est résolu en arrière-plan à partir de la
      puissance des deux camps, sans rendu. Vous récupérez le résultat et le butin à la reconnexion.
    </div>
    <Btn style="width:100%;margin-top:11px" disabled={!choix} onclick={resoudre}>
      Résoudre automatiquement
    </Btn>
  </div>
</Panel>

{#if resolution}
  <AutoResolveModal
    setup={resolution.setup}
    result={resolution.result}
    onclose={() => {
      resolution = null;
    }}
  />
{/if}

<style>
  .gauge {
    position: relative;
    height: 112px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
  }
  .gv {
    font-family: var(--f-mono);
    font-size: 44px;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .gl {
    font-size: 9px;
    letter-spacing: 0.24em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .gbar {
    height: 10px;
    background: #0a0f0e;
    border: 1px solid var(--line-hi);
    position: relative;
    overflow: hidden;
    margin: 0 13px 13px;
  }
  .gbar i {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: linear-gradient(90deg, #4d7223, var(--ok));
  }
  .gbar span {
    position: absolute;
    top: -1px;
    bottom: -1px;
    width: 2px;
    background: var(--warn);
  }
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.55;
  }
</style>
