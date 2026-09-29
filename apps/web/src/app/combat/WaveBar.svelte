<script lang="ts">
  import { derivedValues } from '@nova/data';

  /**
   * Bandeau de vagues (lignes 818-822 ; CSS 535-541), a l'etat initial du combat : premiere vague
   * annoncee, relique intacte (FR-022).
   */
  const deux = (n: number) => String(n).padStart(2, '0');
  const { mission, combat } = derivedValues;
</script>

<div class="ctop">
  <div class="wavebox">VAGUE <b>{deux(1)}</b> / <b>{deux(mission.waves.length)}</b></div>
  <div class="objbar"><i style="width:100%"></i><span>RELIQUE 100%</span></div>
  <div class="wavebox">PROCHAINE <b>{combat.nextWaveIn}</b></div>
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
