<script lang="ts">
  import { demoState, planetById } from '@nova/data';
  import { selection } from '../../state/selection.svelte';

  /**
   * Ecran 08 · Combat (maquette, lignes 813-828, CSS 529-573). L'intitule suit le theatre choisi
   * au Briefing et la planete visee (FR-017), comme #combatname (ligne 2178).
   */
  const cible = planetById(demoState.mission.target);
  const theatre = $derived(selection.current.theatre === 'orbital' ? 'ORBITAL' : 'TERRESTRE');
</script>

<section class="screen combat" data-screen="combat" aria-label="Combat" tabindex="-1">
  <h1 class="tag">
    // 08 · <b>COMBAT</b> — {theatre} · DÉFENSE DE LA RELIQUE · {cible?.name.toUpperCase()}
  </h1>
</section>

<style>
  .combat {
    background: #03060a;
  }
  .combat .tag {
    top: auto;
    bottom: 15px;
  }
</style>
