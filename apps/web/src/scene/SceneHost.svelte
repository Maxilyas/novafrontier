<script lang="ts">
  import { onMount } from 'svelte';
  import { acquireScene, releaseScene } from './renderer';
  import type { RenderMode, SceneId } from './types';

  /**
   * Zone de scene (contracts/scene-host.md) : elle remplit son conteneur, sous les panneaux de
   * l'ecran (FR-020, FR-021). Sans rendu possible, un message de la charte la remplace (FR-024).
   */
  let { scene }: { scene: SceneId } = $props();

  let hote: HTMLDivElement;
  let mode = $state<RenderMode>('initialisation');

  onMount(() => {
    let monte = true;
    let desabonner: (() => void) | undefined;
    void acquireScene(scene, hote).then((poignee) => {
      if (!monte) return;
      mode = poignee.mode;
      desabonner = poignee.onModeChange((nouveau) => {
        mode = nouveau;
      });
    });
    return () => {
      monte = false;
      desabonner?.();
      releaseScene(scene);
    };
  });
</script>

<div class="scene-host" bind:this={hote} data-scene-host={scene} data-render-mode={mode}>
  {#if mode === 'indisponible'}
    <div class="message panel notched" role="alert">
      <div class="hd"><span class="dot"></span><span>Affichage de la scène indisponible</span></div>
      <div class="bd texte">
        Ce navigateur ne propose pas d'accélération graphique. Activez-la dans ses réglages, ou
        utilisez une version récente de Chrome, Edge, Firefox ou Safari.
      </div>
    </div>
  {/if}
</div>

<style>
  .scene-host {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .scene-host :global(canvas) {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
  }
  .message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(360px, calc(100% - 32px));
  }
  .texte {
    font-size: 10.5px;
    line-height: 1.6;
    color: var(--muted);
  }
</style>
