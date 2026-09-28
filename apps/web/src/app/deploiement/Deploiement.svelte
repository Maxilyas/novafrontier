<script lang="ts">
  import { derivedValues } from '@nova/data';
  import { toHash } from '../../state/router.svelte';
  import { selection } from '../../state/selection.svelte';
  import Btn from '../../ui/Btn.svelte';

  /**
   * Ecran 07 · Deploiement (maquette, lignes 805-811 et 2072-2144, CSS 503-528). "Lancer le
   * combat" est inactif quand l'escouade n'engage aucune unite (FR-019).
   */
  const engagees = $derived(
    derivedValues.deployment[selection.current.squad][selection.current.theatre].units,
  );
</script>

<section
  class="screen deploiement"
  data-screen="deploiement"
  aria-label="Déploiement"
  tabindex="-1"
>
  <h1 class="tag">// 07 · <b>DÉPLOIEMENT</b> — PHASE D'INITIALISATION</h1>
  <div class="dright">
    <div class="lancer">
      <Btn
        variant="solid"
        href={engagees.length > 0 ? toHash({ screen: 'combat' }) : undefined}
        disabled={engagees.length === 0}
        style="width:100%;padding:13px"
      >
        Lancer le combat
      </Btn>
    </div>
  </div>
</section>

<style>
  /* Colonnes de la maquette a 1600 px : 264 px, plateau fluide, 284 px. */
  .deploiement {
    display: grid;
    padding: 2.75rem 1.25rem 1.25rem;
    grid-template-columns: 16.5rem 0.75rem minmax(0, 1fr) 0.75rem 17.75rem;
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'dleft . deploy . dright';
    background: #040706;
  }
  .dright {
    grid-area: dright;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .lancer {
    margin-top: auto;
    display: flex;
  }
</style>
