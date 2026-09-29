<script lang="ts">
  import Board from './Board.svelte';
  import Roster from './Roster.svelte';
  import SquadTabs from './SquadTabs.svelte';
  import Summary from './Summary.svelte';

  /** Ecran 01 · Escouades (maquette, lignes 716-733, CSS 252-301). */
</script>

<section class="screen escouades" data-screen="escouades" aria-label="Escouades" tabindex="-1">
  <h1 class="tag">// 01 · <b>ESCOUADES</b> — COMPOSITION DES ÉQUIPES</h1>
  <SquadTabs />
  <Board />
  <Roster />
  <Summary />
  <div class="foot">
    Une escouade = 1 commandant + 3 vaisseaux + 2 mécas · le commandant détermine les points
    d'action
  </div>
</section>

<style>
  /* Positions de la maquette a 1600x816 : onglets 186 px, synthese 318 px, effectifs 158 px. */
  .escouades {
    display: grid;
    padding: 2.75rem 1.25rem 1.25rem;
    grid-template-columns:
      clamp(10.5rem, calc(10.5rem + (100vw - 80rem) * 0.05625), 11.625rem)
      1.125rem minmax(0, 1fr) 0.875rem
      clamp(18rem, calc(18rem + (100vw - 80rem) * 0.09375), 19.875rem);
    grid-template-rows: minmax(0, 1fr) 0.75rem 9.875rem;
    grid-template-areas:
      'tabs . board . sumry'
      'tabs . . . sumry'
      'tabs . roster . sumry';
    background:
      radial-gradient(ellipse at 50% 120%, rgba(99, 214, 188, 0.06), transparent 58%),
      linear-gradient(180deg, #080d0c, #050807);
  }
  .escouades :global(.panel.board) {
    grid-area: board;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .escouades :global(.panel.roster) {
    grid-area: roster;
    overflow: hidden;
  }
  .escouades :global(.panel.sumry) {
    grid-area: sumry;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
</style>
