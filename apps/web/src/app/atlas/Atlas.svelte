<script lang="ts">
  import { unitById } from '@nova/data';
  import { router } from '../../state/router.svelte';
  import { DEFAULT_ATLAS_UNIT } from '../../state/routes';
  import { selection } from '../../state/selection.svelte';
  import UnitCard from '../../ui/UnitCard.svelte';

  /**
   * Ecran 02 · Atlas (maquette, lignes 735-746, CSS 302-332). L'unite affichee est celle de
   * l'adresse (`#/atlas/<unite>`) ; l'ouvrir aligne palier et armement (selection.openAtlas).
   */

  $effect.pre(() => {
    const unite = unitById(router.route.unit ?? DEFAULT_ATLAS_UNIT);
    if (unite && unite.id !== selection.current.atlas.unit) selection.openAtlas(unite);
  });

  const atlas = $derived(selection.current.atlas);
  const unite = $derived(unitById(atlas.unit));
</script>

<section class="screen atlas" data-screen="atlas" aria-label="Atlas" tabindex="-1">
  <h1 class="tag">// 02 · <b>ATLAS</b> — FICHE D'UNITÉ &amp; IDENTITÉ VISUELLE</h1>
  <div class="atl-mid">
    {#if unite}
      <UnitCard
        unit={unite}
        size="big"
        notch={9}
        tier={unite.family === 'cmd' ? undefined : atlas.tier}
        weapon={unite.family === 'cmd' ? undefined : atlas.weapon}
      />
    {/if}
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
    grid-template-columns: 18.75rem 0.75rem minmax(0, 1fr) 0.875rem 19.875rem;
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'left . mid . right';
    background: linear-gradient(180deg, #080d0c, #050807);
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
</style>
