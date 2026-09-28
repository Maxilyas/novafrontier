<script lang="ts">
  import { basePlanet } from '@nova/data';

  /** Ecran 03 · Base (maquette, lignes 748-760, CSS 333-369). */
  const planete = basePlanet();
</script>

<section class="screen base" data-screen="base" aria-label="Base" tabindex="-1">
  <h1 class="tag">
    // 03 · <b>BASE</b> — {planete?.name.toUpperCase()} · SECTEUR CAPRICA
  </h1>
  <div class="foot">
    Revenu quotidien par planète · plafond de cumul sur 7 jours · collecte globale depuis le
    bandeau
  </div>
</section>

<style>
  .base {
    background:
      radial-gradient(ellipse at 62% 14%, rgba(90, 140, 190, 0.07), transparent 52%),
      linear-gradient(180deg, #09100f 0%, #101713 48%, #161810 100%);
  }
</style>
