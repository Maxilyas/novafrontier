<script lang="ts">
  import { type ActiveWeaponId, rarityById, type Unit, weaponById } from '@nova/data';
  import CommanderArt from './CommanderArt.svelte';
  import MechArt from './MechArt.svelte';
  import ShipArt from './ShipArt.svelte';

  /** Illustration d'une unite, comme artFor de la maquette (lignes 1008-1009). */
  let {
    unit,
    tier,
    weapon,
  }: {
    unit: Unit;
    tier?: number | undefined;
    weapon?: ActiveWeaponId | undefined;
  } = $props();

  const couleur = $derived(rarityById(unit.rarity)?.color ?? '#3a4741');
</script>

{#if unit.family === 'cmd'}
  <CommanderArt visual={unit.visual} color={couleur} />
{:else}
  {@const arme = weapon ?? unit.weapon}
  {@const couleurArme = weaponById(arme)?.color ?? couleur}
  {#if unit.family === 'ship'}
    <ShipArt
      visual={unit.visual}
      color={couleur}
      tier={tier ?? unit.tier}
      weapon={arme}
      weaponColor={couleurArme}
    />
  {:else}
    <MechArt
      visual={unit.visual}
      color={couleur}
      tier={tier ?? unit.tier}
      weapon={arme}
      weaponColor={couleurArme}
    />
  {/if}
{/if}
