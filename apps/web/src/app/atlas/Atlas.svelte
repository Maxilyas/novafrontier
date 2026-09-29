<script lang="ts">
  import { unitById } from '@nova/data';
  import { router } from '../../state/router.svelte';
  import { DEFAULT_ATLAS_UNIT } from '../../state/routes';
  import { selection } from '../../state/selection.svelte';
  import { visualRegistry } from '../../ui/art/registry.svelte';
  import UnitCard from '../../ui/UnitCard.svelte';
  import AtlasRoster from './AtlasRoster.svelte';
  import Characteristics from './Characteristics.svelte';
  import DamageMatrix from './DamageMatrix.svelte';
  import Engines from './Engines.svelte';
  import Tiers from './Tiers.svelte';
  import WeaponSkins from './WeaponSkins.svelte';

  /**
   * Ecran 02 · Atlas (maquette, lignes 735-746 et 1269-1373, CSS 302-332). L'unite affichee est
   * celle de l'adresse (`#/atlas/<unite>`) ; l'ouvrir aligne palier et armement
   * (selection.openAtlas, FR-015).
   */
  $effect.pre(() => {
    const unite = unitById(router.route.unit ?? DEFAULT_ATLAS_UNIT);
    if (unite && unite.id !== selection.current.atlas.unit) selection.openAtlas(unite);
  });

  const atlas = $derived(selection.current.atlas);
  const unite = $derived(unitById(atlas.unit));
  const combattant = $derived(unite !== undefined && unite.family !== 'cmd');
</script>

<section class="screen atlas" data-screen="atlas" aria-label="Atlas" tabindex="-1">
  <h1 class="tag">// 02 · <b>ATLAS</b> — FICHE D'UNITÉ &amp; IDENTITÉ VISUELLE</h1>
  <div class="atl-left">
    <AtlasRoster />
    {#if unite}<Characteristics unit={unite} />{/if}
  </div>
  <div class="atl-mid">
    {#if unite}
      <UnitCard
        unit={unite}
        size="big"
        notch={9}
        tier={combattant ? atlas.tier : undefined}
        weapon={combattant ? atlas.weapon : undefined}
      />
    {/if}
    {#if combattant}<Tiers />{/if}
    <div class="cachechip">
      <span class="led"></span>
      <span>
        ATLAS — {visualRegistry.size}
        {visualRegistry.size === 0 ? 'VISUEL' : 'VISUELS'} EN CACHE
      </span>
    </div>
  </div>
  <div class="atl-right">
    <WeaponSkins />
    <DamageMatrix />
    <Engines />
  </div>
  <div class="foot">
    Les visuels sont générés une fois puis servis depuis le cache — aucun rechargement entre les
    écrans
  </div>
</section>

<style>
  /* Colonnes de la maquette a 1600 px : 300 px, centre fluide, 318 px. */
  .atlas {
    display: grid;
    padding: 2.75rem 1.25rem 1.25rem;
    grid-template-columns:
      clamp(17rem, calc(17rem + (100vw - 80rem) * 0.0875), 18.75rem)
      0.75rem minmax(0, 1fr) 0.875rem
      clamp(18rem, calc(18rem + (100vw - 80rem) * 0.09375), 19.875rem);
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'left . mid . right';
    background: linear-gradient(180deg, #080d0c, #050807);
  }
  .atl-left,
  .atl-right {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--line-hi) transparent;
  }
  .atl-left {
    grid-area: left;
  }
  .atl-right {
    grid-area: right;
  }
  .atl-left :global(.caracteristiques) {
    flex: 1;
    overflow: auto;
  }
  .atl-mid {
    grid-area: mid;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  .cachechip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 10px;
    border: 1px solid var(--line-hi);
    font-family: var(--f-mono);
    font-size: 9.5px;
    color: var(--muted);
  }
  .led {
    width: 6px;
    height: 6px;
    background: var(--ok);
    box-shadow: 0 0 7px var(--ok);
  }
</style>
