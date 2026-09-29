<script lang="ts">
  import { basePlanet } from '@nova/data';
  import BuildingDetail from './BuildingDetail.svelte';
  import BuildingField from './BuildingField.svelte';
  import BuildingList from './BuildingList.svelte';
  import Income from './Income.svelte';

  /** Ecran 03 · Base (maquette, lignes 748-760 et 1439-1512, CSS 333-369). */
  const planete = basePlanet();
</script>

<section class="screen base" data-screen="base" aria-label="Base" tabindex="-1">
  <div class="terrain"></div>
  <div class="iso"></div>
  <h1 class="tag">
    // 03 · <b>BASE</b> — {planete?.name.toUpperCase()} · SECTEUR CAPRICA
  </h1>
  <BuildingField />
  <BuildingList />
  <div class="cote">
    <BuildingDetail />
    <Income />
  </div>
  <div class="foot">
    Revenu quotidien par planète · plafond de cumul sur 7 jours · collecte globale depuis le
    bandeau
  </div>
</section>

<style>
  /*
   * Liste de 286 px a gauche, plan au centre ; a droite, le detail en haut et le revenu en bas
   * (340 px), qui defilent si la hauteur ne suffit pas.
   */
  .base {
    display: grid;
    padding: 2.75rem 1.25rem 1.25rem;
    grid-template-columns:
      clamp(16rem, calc(16rem + (100vw - 80rem) * 0.09375), 17.875rem)
      minmax(0, 1fr)
      clamp(19rem, calc(19rem + (100vw - 80rem) * 0.1125), 21.25rem);
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'list field cote';
    background:
      radial-gradient(ellipse at 62% 14%, rgba(90, 140, 190, 0.07), transparent 52%),
      linear-gradient(180deg, #09100f 0%, #101713 48%, #161810 100%);
  }
  .terrain {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 24% 78%, rgba(120, 98, 55, 0.16), transparent 46%),
      radial-gradient(ellipse at 80% 68%, rgba(64, 86, 76, 0.16), transparent 52%);
  }
  .iso {
    position: absolute;
    inset: 0;
    opacity: 0.22;
    background-image:
      linear-gradient(rgba(99, 214, 188, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 214, 188, 0.08) 1px, transparent 1px);
    background-size: 80px 44px;
    transform: perspective(700px) rotateX(52deg) scale(1.9);
    transform-origin: 50% 40%;
  }
  .base :global(.panel.blist) {
    grid-area: list;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .cote {
    grid-area: cote;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--line-hi) transparent;
  }
  .cote :global(.panel) {
    flex: 0 0 auto;
  }
</style>
