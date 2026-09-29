<script lang="ts">
  import { demoState, planetById } from '@nova/data';
  import SceneHost from '../../scene/SceneHost.svelte';
  import { selection } from '../../state/selection.svelte';
  import ActionBar from './ActionBar.svelte';
  import CombatLog from './CombatLog.svelte';
  import Forces from './Forces.svelte';
  import Trinity from './Trinity.svelte';
  import WaveBar from './WaveBar.svelte';

  /**
   * Ecran 08 · Combat (maquette, lignes 813-828 et 2161-2335, CSS 529-573), a son etat initial
   * (FR-022). L'intitule suit le theatre choisi au Briefing et la planete visee (FR-017), comme
   * #combatname (ligne 2178). La scene occupe tout l'ecran, sous le HUD, a la place de l'arene
   * (FR-020, FR-022).
   */
  const cible = planetById(demoState.mission.target);
  const theatre = $derived(selection.current.theatre === 'orbital' ? 'ORBITAL' : 'TERRESTRE');
</script>

<section class="screen combat" data-screen="combat" aria-label="Combat" tabindex="-1">
  <SceneHost scene="combat" />
  <h1 class="tag">
    // 08 · <b>COMBAT</b> — {theatre} · DÉFENSE DE LA RELIQUE · {cible?.name.toUpperCase()}
  </h1>
  <WaveBar />
  <Forces />
  <Trinity />
  <CombatLog />
  <ActionBar />
</section>

<style>
  .combat {
    background: #03060a;
  }
  .combat .tag {
    top: auto;
    bottom: 15px;
  }
  .combat :global(.panel.cforce) {
    position: absolute;
    left: 16px;
    top: 52px;
    width: 238px;
    z-index: 8;
  }
  .combat :global(.panel.ctrin) {
    position: absolute;
    right: 16px;
    top: 52px;
    width: 266px;
    z-index: 8;
  }
  .combat :global(.panel.clog) {
    position: absolute;
    right: 16px;
    bottom: 100px;
    width: 266px;
    height: 146px;
    overflow: hidden;
    z-index: 8;
  }
  .combat :global(.panel .hd) {
    font-size: 10px;
  }
</style>
