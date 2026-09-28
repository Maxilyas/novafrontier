<script lang="ts">
  import { demoState, derivedValues, planetById } from '@nova/data';
  import { toHash } from '../../state/router.svelte';
  import Btn from '../../ui/Btn.svelte';
  import { nombre } from '../../ui/format';
  import Icon from '../../ui/Icon.svelte';

  /**
   * Hologramme de la planete visee (renderHolo, lignes 1736-1788 ; CSS 452-466). La planete visee
   * est celle de la demonstration tant que la carte n'existe pas (FR-022) ; ses valeurs viennent
   * de `derivedValues.route`. Les trois commandes menent au Briefing (FR-005).
   */
  const planete = planetById(demoState.mission.target);
  const { route, mission } = derivedValues;
  const briefing = toHash({ screen: 'briefing' });
  const operations = (planete?.operations ?? 0) > 0;
  const assautPossible = route.inRange && operations;
</script>

<div class="holo notched" data-panel>
  <div class="hd">
    <span class="dot"></span><span>{planete?.name}</span>
    <span class="rt" style:color={route.inRange ? 'var(--sig)' : 'var(--warn)'}>
      {route.inRange ? 'À PORTÉE' : 'HORS PORTÉE'}
    </span>
  </div>
  <div class="corps">
    {#if operations}
      <div class="tiny" style="margin:14px 0 4px">Opérations disponibles</div>
      <a class="misrow" href={briefing}>
        <span class="mtype"><Icon icon="ic-atk" size={14} strokeWidth={1.4} /></span>
        <span>
          <span class="mt">Assaut sur {planete?.name}</span>
          <span class="md">{mission.waves.length} VAGUES · {nombre(route.loot)} CRÉDITS</span>
        </span>
        <span class="diff">
          {#each [1, 2, 3, 4, 5] as niveau (niveau)}<i class:on={niveau <= route.difficulty}></i>{/each}
        </span>
      </a>
    {/if}
  </div>
  <div class="actions">
    <Btn
      variant="solid"
      href={assautPossible ? briefing : undefined}
      disabled={!assautPossible}
      style="flex:1">Préparer l'assaut</Btn
    >
    <Btn variant="ghost" href={operations ? briefing : undefined} disabled={!operations}>
      Espionner
    </Btn>
  </div>
</div>

<style>
  .holo {
    grid-area: holo;
    position: relative;
    z-index: 14;
    overflow: hidden;
    background: linear-gradient(180deg, #091416, #05090a);
    border: 1px solid var(--sig-dim);
    display: flex;
    flex-direction: column;
  }
  .corps {
    padding: 12px 13px;
    overflow: auto;
    flex: 1;
  }
  .actions {
    padding: 11px 13px;
    display: flex;
    gap: 7px;
  }
  .misrow {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 12px;
    border: 1px solid var(--line);
    margin-top: 6px;
    cursor: pointer;
  }
  .misrow:hover {
    background: rgba(99, 214, 188, 0.06);
  }
  .mt,
  .md {
    display: block;
  }
  .mt {
    font-size: 10.5px;
    color: var(--paper);
    letter-spacing: 0.05em;
  }
  .md {
    font-size: 8.5px;
    color: var(--muted);
    font-family: var(--f-mono);
    margin-top: 2px;
  }
  .mtype {
    width: 24px;
    height: 24px;
    border: 1px solid var(--sig-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .mtype :global(svg) {
    stroke: var(--sig);
  }
  .diff {
    margin-left: auto;
    display: flex;
    gap: 2px;
  }
  .diff i {
    width: 4px;
    height: 12px;
    background: var(--warn);
    opacity: 0.22;
  }
  .diff i.on {
    opacity: 1;
  }
</style>
