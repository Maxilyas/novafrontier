<script lang="ts">
  import { demoState, planetById } from '@nova/data';
  import { onMount } from 'svelte';
  import SceneHost from '../../scene/SceneHost.svelte';
  import { combatChoices, combatHud, launchCombat } from '../../state/combat.svelte';
  import { combatRuntime } from '../../state/combat-runtime';
  import { selection } from '../../state/selection.svelte';
  import ActionBar from './ActionBar.svelte';
  import CombatLog from './CombatLog.svelte';
  import EndModal from './EndModal.svelte';
  import Forces from './Forces.svelte';
  import Trinity from './Trinity.svelte';
  import WaveBar from './WaveBar.svelte';

  /**
   * Ecran 08 · Combat (maquette, lignes 813-828 et 2161-2375, CSS 529-573). Le combat se deroule
   * dans la scene, sous le HUD (FR-024 a FR-030). A l'ouverture : reprise du combat en pause, ou
   * nouveau combat avec les choix courants (FR-031) ; en quittant l'ecran, pause (FR-032).
   */
  const cible = planetById(demoState.mission.target);
  const theatre = $derived(selection.current.theatre === 'orbital' ? 'ORBITAL' : 'TERRESTRE');
  let sansUnite = $state(false);

  onMount(() => {
    if (combatRuntime.phase === 'paused') {
      combatRuntime.resume();
    } else if (combatRuntime.phase !== 'running') {
      const { squad, theatre: t, formation } = selection.current;
      const choix = combatChoices(squad, t, formation[squad]);
      if (choix) launchCombat(choix);
      else sansUnite = true;
    }
    return () => combatRuntime.pause();
  });

  function clavier(e: KeyboardEvent) {
    if (e.key === 'Escape' && combatHud.designation) {
      e.preventDefault();
      combatRuntime.cancelDesignation();
    }
  }
</script>

<svelte:window onkeydown={clavier} />

<section
  class="screen combat"
  data-screen="combat"
  aria-label="Combat"
  tabindex="-1"
  data-combat-phase={combatHud.phase}
  data-combat-mode={combatHud.mode}
  data-designating={combatHud.designation?.skill}
>
  <SceneHost scene="combat" />
  <h1 class="tag">
    // 08 · <b>COMBAT</b> — {theatre} · DÉFENSE DE LA RELIQUE · {cible?.name.toUpperCase()}
  </h1>
  <WaveBar />
  <Forces />
  <Trinity />
  <CombatLog />
  <ActionBar />
  {#if sansUnite}
    <div class="vide panel notched" role="status">
      Aucune unité engagée : l'escouade n'a ni vaisseau ni méca pour ce théâtre.
    </div>
  {/if}
  {#if combatHud.end && combatHud.combat}
    <EndModal result={combatHud.end} planet={combatHud.combat.setup.planet} />
  {/if}
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
  .vide {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9;
    padding: 14px 18px;
    font-size: 10.5px;
    color: var(--muted);
  }
</style>
