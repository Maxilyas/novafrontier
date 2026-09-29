<script lang="ts">
  import { buildings } from '@nova/data';
  import NodeDossier from './NodeDossier.svelte';
  import ResearchQueue from './ResearchQueue.svelte';
  import Tree from './Tree.svelte';
  import TreeTabs from './TreeTabs.svelte';

  /** Ecran 04 · Recherche (maquette, lignes 762-775 et 1523-1639, CSS 370-413). */
  const laboratoire = buildings.find((b) => b.id === 'lab');
</script>

<section class="screen recherche" data-screen="recherche" aria-label="Recherche" tabindex="-1">
  <h1 class="tag">// 04 · <b>RECHERCHE</b> — {laboratoire?.name.toUpperCase()}</h1>
  <TreeTabs />
  <Tree />
  <NodeDossier />
  <ResearchQueue />
</section>

<style>
  /* Arbre et file a gauche, dossier de 318 px a droite ; file de 80 px sous l'arbre. */
  .recherche {
    display: grid;
    padding: 3.25rem 1.25rem 1.25rem;
    grid-template-columns:
      minmax(0, 1fr) 0.875rem clamp(18rem, calc(18rem + (100vw - 80rem) * 0.09375), 19.875rem);
    grid-template-rows: minmax(0, 1fr) 0.75rem 5rem;
    grid-template-areas:
      'tree . rdet'
      '. . rdet'
      'queue . rdet';
    background: linear-gradient(180deg, #080d0c, #050807);
  }
  .recherche :global(.panel.tree) {
    grid-area: tree;
    overflow: auto;
    min-height: 0;
  }
  .recherche :global(.panel.rdet) {
    grid-area: rdet;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .recherche :global(.panel.rqueue) {
    grid-area: queue;
    overflow: hidden;
  }
</style>
