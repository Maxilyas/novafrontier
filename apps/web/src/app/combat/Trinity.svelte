<script lang="ts">
  import { type ActiveWeaponId, damageMatrix, demoState, derivedValues, weaponById } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Trinite d'armement (renderCombatPanels, lignes 2312-2320) : multiplicateur de chaque armement
   * actif contre l'armement adverse, lu dans la matrice de degats.
   */
  const ARMES = Object.keys(damageMatrix) as ActiveWeaponId[];
  const adverse = demoState.mission.enemy.weapon;
  const couleur = (m: number) => (m > 1 ? 'var(--ok)' : m < 1 ? '#ff9c8f' : 'var(--muted)');

  const dominante = $derived(derivedValues.squads[selection.current.squad].dominantWeapon);
</script>

<Panel
  title="Trinité d'armement"
  right="{derivedValues.mission.waves.length} VAGUES"
  class="ctrin"
>
  <div class="bd" style="padding:9px 11px">
    {#each ARMES as id (id)}
      {@const arme = weaponById(id)}
      {@const m = damageMatrix[id][adverse]}
      <div class="trin" style="padding:3px 0">
        <span class="ic" style:color={arme?.color} style:border-color={arme?.color}>{arme?.symbol}</span>
        <span style="font-size:9.5px" style:color={id === dominante ? 'var(--paper)' : 'var(--muted)'}>
          {arme?.label}{id === dominante ? ' · dominante' : ''}
        </span>
        <span class="nb" style:color={couleur(m)}>×{m.toFixed(2)}</span>
      </div>
    {/each}
    <div class="tiny" style="margin-top:7px">adverse : {weaponById(adverse)?.label}</div>
  </div>
</Panel>
