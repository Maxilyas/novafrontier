<script lang="ts">
  import { demoState } from '@nova/data';
  import { nombre } from '../../ui/format';

  /** Puces de la carte (renderMap, lignes 1731-1734 ; CSS 445-449). */
  const { defaults, mission, resources } = demoState;
</script>

<div class="mapinfo">
  <div class="chip">ÉCHELLE <b>{defaults.map.scale.toUpperCase()}</b></div>
  <div class="chip">FLOTTE <b>{mission.engine}</b> · {mission.fuelRate.toFixed(1)} u/UA</div>
  <div class="chip g">CARBURANT <b>{nombre(resources.fuel)}</b></div>
</div>

<style>
  .mapinfo {
    position: absolute;
    left: 20px;
    top: 44px;
    z-index: 12;
    display: flex;
    gap: 8px;
  }
  .chip {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 11px;
    background: rgba(8, 14, 12, 0.88);
    border: 1px solid var(--line-hi);
    font-family: var(--f-mono);
    font-size: 10px;
    color: var(--txt);
  }
  .chip b {
    color: var(--sig);
    font-weight: 400;
  }
  .chip.g b {
    color: var(--gold);
  }
</style>
