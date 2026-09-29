<script lang="ts">
  import { derivedValues } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import Btn from '../../ui/Btn.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Simulation hors ligne (renderBrief, lignes 1892-1907) : chances de victoire de
   * `derivedValues.briefing`. Sans unite engagee, la maquette affiche "NaN%" : ici "—" (FR-011).
   * La resolution automatique releve d'une phase ulterieure (FR-018).
   */
  const chances = $derived(derivedValues.briefing[selection.current.squad].winChance);
  const couleur = $derived(
    chances !== null && chances > 60
      ? 'var(--ok)'
      : chances !== null && chances > 35
        ? 'var(--gold)'
        : 'var(--warn)',
  );
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
    <Btn style="width:100%;margin-top:11px" laterPhase="auto-resolve">Résoudre automatiquement</Btn>
  </div>
</Panel>

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
