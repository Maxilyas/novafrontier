<script lang="ts">
  import { type ActiveWeaponId, rarityById, type Unit } from '@nova/data';
  import { LATER_PHASE_MESSAGE, showToast } from '../state/toast.svelte';
  import UnitArt from './art/UnitArt.svelte';
  import Stars from './Stars.svelte';

  /**
   * Carte d'unite a cadre colore par rarete : portage de cardHTML (maquette, lignes 1090-1097).
   * Avec une action, c'est un <button>. `onFiche` ajoute le bouton "Fiche" qui ouvre l'Atlas
   * (FR-004, research R16).
   */
  let {
    unit,
    size,
    selected = false,
    tier,
    weapon,
    notch = 6,
    laterPhase,
    onclick,
    onFiche,
    label,
  }: {
    unit: Unit;
    size: 'mini' | 'mid' | 'big';
    selected?: boolean | undefined;
    tier?: number | undefined;
    weapon?: ActiveWeaponId | undefined;
    notch?: number | undefined;
    laterPhase?: string | undefined;
    onclick?: (() => void) | undefined;
    onFiche?: (() => void) | undefined;
    label?: string | undefined;
  } = $props();

  const rarete = $derived(rarityById(unit.rarity));
  const quantite = $derived(
    unit.family === 'cmd' ? null : unit.formation === 'unite' ? '×1' : `×${unit.count}`,
  );
  const cliquable = $derived(laterPhase !== undefined || onclick !== undefined);

  function activer() {
    if (laterPhase !== undefined) {
      showToast(LATER_PHASE_MESSAGE);
      return;
    }
    onclick?.();
  }
</script>

{#snippet contenu()}
  <div class="art"><UnitArt {unit} {tier} {weapon} /></div>
  <div class="shade"></div>
  <div class="rr">{rarete?.label}</div>
  <div class="lv">NIV {unit.level}</div>
  <div class="nm">{unit.name}</div>
  <div class="st rc-{unit.rarity}"><Stars count={unit.stars} max={rarete?.maxStars ?? 0} /></div>
  {#if quantite !== null && size !== 'big'}<div class="qty">{quantite}</div>{/if}
{/snippet}

{#snippet carte()}
  {#if cliquable}
    <button
      type="button"
      class="card {size} notched"
      class:sel={selected}
      style="--notch:{notch}px;--rc:{rarete?.color}"
      data-unit={unit.id}
      data-later-phase={laterPhase}
      aria-label={label ?? unit.name}
      onclick={activer}
    >
      {@render contenu()}
    </button>
  {:else}
    <div
      class="card {size} notched"
      class:sel={selected}
      style="--notch:{notch}px;--rc:{rarete?.color}"
      data-unit={unit.id}
    >
      {@render contenu()}
    </div>
  {/if}
{/snippet}

{#if onFiche}
  <div class="card-wrap">
    {@render carte()}
    <button type="button" class="fiche" onclick={onFiche} aria-label="Fiche de {unit.name}">
      Fiche
    </button>
  </div>
{:else}
  {@render carte()}
{/if}
