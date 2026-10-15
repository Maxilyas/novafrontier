<script lang="ts">
  import { mission } from '../../state/briefing';
  import { combatHud } from '../../state/combat.svelte';

  /**
   * Bandeau de vagues (lignes 818-822 ; CSS 535-541), a jour a chaque pas (FR-027, FR-028) :
   * vague courante, integrite de la relique, temps avant la vague suivante. Sans combat, l'etat
   * initial de la mission.
   */
  const deux = (n: number) => String(n).padStart(2, '0');
  const minuteur = (s: number) => `${Math.floor(s / 60)}:${deux(s % 60)}`;

  const hud = $derived(combatHud.hud);
  const vague = $derived(hud?.wave ?? 1);
  const total = $derived(hud?.waves ?? mission.waves.length);
  const relique = $derived(Math.round((hud?.relic ?? 1) * 100));
  const prochaine = $derived(hud?.nextWaveSeconds ?? 12);
</script>

<div class="ctop">
  <div class="wavebox" data-wave-current={vague} data-wave-total={total}>
    VAGUE <b>{deux(vague)}</b> / <b>{deux(total)}</b>
  </div>
  <div class="objbar" data-relic-percent={relique}>
    <i style:width="{(hud?.relic ?? 1) * 100}%"></i><span>RELIQUE {relique}%</span>
  </div>
  <div class="wavebox" data-next-wave-seconds={prochaine}>
    PROCHAINE <b>{minuteur(prochaine)}</b>
  </div>
  {#if combatHud.replay}<div class="wavebox replay" role="status">REPLAY</div>{/if}
</div>

<style>
  .ctop {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 14px;
    z-index: 8;
    pointer-events: none;
  }
  .wavebox {
    padding: 6px 15px;
    border: 1px solid var(--line-hi);
    background: rgba(8, 12, 11, 0.86);
    font-size: 11px;
    letter-spacing: 0.2em;
    color: var(--txt);
    text-transform: uppercase;
    white-space: nowrap;
  }
  .wavebox b {
    color: var(--paper);
    font-weight: 400;
  }
  .wavebox.replay {
    color: var(--gold);
    border-color: var(--gold);
  }
  .objbar {
    width: 320px;
    height: 15px;
    border: 1px solid var(--line-hi);
    background: #0a0f0e;
    position: relative;
    overflow: hidden;
  }
  .objbar i {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: linear-gradient(90deg, #2f7d3a, #7fd44a);
  }
  .objbar span {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    letter-spacing: 0.18em;
    font-family: var(--f-mono);
    color: #eaf5e2;
  }
</style>
