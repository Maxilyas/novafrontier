<script lang="ts">
  import { demoState, planetById } from '@nova/data';
  import { toHash } from '../../state/router.svelte';
  import Btn from '../../ui/Btn.svelte';

  /**
   * Ecran 06 · Briefing (maquette, lignes 797-803 et 1821-1934, CSS 467-502), pour la planete
   * visee (FR-005).
   */
  const cible = planetById(demoState.mission.target);
</script>

<section class="screen briefing" data-screen="briefing" aria-label="Briefing" tabindex="-1">
  <h1 class="tag">// 06 · <b>BRIEFING</b> — ASSAUT SUR {cible?.name.toUpperCase()}</h1>
  <div class="bcol bc3">
    <div class="suite">
      <Btn variant="solid" href={toHash({ screen: 'deploiement' })} style="flex:1;padding:13px">
        Passer au déploiement
      </Btn>
    </div>
  </div>
</section>

<style>
  /* Colonnes de la maquette a 1600 px : 400 px, centre fluide, 400 px. */
  .briefing {
    display: grid;
    padding: 2.75rem 1.25rem 1.25rem;
    grid-template-columns: 25rem 0.75rem minmax(0, 1fr) 0.75rem 25rem;
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'bc1 . bc2 . bc3';
    background:
      radial-gradient(ellipse at 50% -20%, rgba(99, 214, 188, 0.06), transparent 55%),
      linear-gradient(180deg, #080d0c, #050807);
  }
  .bcol {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .bc3 {
    grid-area: bc3;
  }
  .suite {
    display: flex;
    gap: 8px;
    margin-top: auto;
  }
</style>
