<script lang="ts">
  import { demoState, planetById, planetIncome } from '@nova/data';
  import Bar from '../../ui/Bar.svelte';
  import Btn from '../../ui/Btn.svelte';
  import { nombre } from '../../ui/format';
  import KeyValue from '../../ui/KeyValue.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Revenu quotidien et cumul en attente (renderBase, lignes 1475-1490 ; CSS 364-369). "Tout
   * collecter" releve d'une phase ulterieure (FR-018).
   */
  const { pendingIncome } = demoState;
  const total = planetIncome.reduce((somme, revenu) => somme + revenu.daily, 0);
</script>

<Panel title="Revenu quotidien" right="{planetIncome.length} PLANÈTES" class="income">
  <div class="bd">
    {#each planetIncome as revenu (revenu.planet)}
      <div class="irow">
        <div>
          <div class="ip">{planetById(revenu.planet)?.name}</div>
          <div class="id">{revenu.label}</div>
        </div>
        <div class="iv">+{nombre(revenu.daily)}</div>
      </div>
    {/each}
    <KeyValue label="Total / jour" value="+{nombre(total)}" valueClass="gold" style="margin-top:10px" />
    <div class="tiny" style="margin:12px 0 6px">Cumul en attente — plafond 7 jours</div>
    <Bar value={pendingIncome.gauge * 100} variant="g" style="height:9px" />
    <div class="cumul">
      <span>{nombre(pendingIncome.amount)} / {nombre(pendingIncome.cap)}</span>
      <span>{pendingIncome.untilCap} avant plafond</span>
    </div>
    <div class="note">
      Le plafond force une connexion régulière sans pénaliser les joueurs absents quelques jours.
      Au-delà de 7 jours, la production s'arrête jusqu'à la collecte.
    </div>
    <Btn variant="gold" style="width:100%;margin-top:11px" laterPhase="collect-all">
      Tout collecter — {nombre(pendingIncome.amount)} crédits
    </Btn>
  </div>
</Panel>

<style>
  .irow {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 5px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.045);
  }
  .ip {
    font-size: 10.5px;
    color: var(--paper);
    letter-spacing: 0.06em;
  }
  .id {
    font-size: 8.5px;
    color: var(--muted);
    font-family: var(--f-mono);
    margin-top: 1px;
  }
  .iv {
    margin-left: auto;
    font-family: var(--f-mono);
    font-size: 11.5px;
    color: var(--gold);
  }
  .cumul {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    font-family: var(--f-mono);
    font-size: 9px;
    color: var(--muted);
  }
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.55;
    margin-top: 10px;
  }
</style>
