<script lang="ts">
  import { onMount } from 'svelte';
  import { diagnostic } from '../scene/renderer';
  import { router } from '../state/router.svelte';

  /**
   * Badge de diagnostic, affiche seulement avec `?diag=1` (contracts/scene-host.md, R11) : mode de
   * chaque scene ouverte, applications Pixi, cadence de la scene visible sur 1 s et duree du dernier
   * changement d'ecran. Il sert aux mesures manuelles de SC-004, SC-005 et SC-009.
   */
  let etat = $state(diagnostic());
  let cadence = $state<number | undefined>(undefined);

  onMount(() => {
    let precedent = diagnostic().visible;
    let instant = performance.now();
    const minuteur = setInterval(() => {
      const maintenant = performance.now();
      etat = diagnostic();
      const visible = etat.visible;
      cadence =
        visible && precedent && visible.id === precedent.id
          ? Math.round(((visible.images - precedent.images) * 1000) / (maintenant - instant))
          : undefined;
      precedent = visible;
      instant = maintenant;
    }, 1000);
    return () => clearInterval(minuteur);
  });
</script>

<aside class="diag" aria-label="Diagnostic">
  <dl>
    <dt>Scènes</dt>
    <dd>{etat.scenes.map((s) => `${s.id} ${s.mode}`).join(' · ') || 'aucune'}</dd>
    <dt>Applications</dt>
    <dd>{etat.applications}</dd>
    <dt>Cadence</dt>
    <dd>{cadence === undefined ? '—' : `${cadence} i/s`}</dd>
    <dt>Changement d'écran</dt>
    <dd>
      {router.lastTransitionMs === undefined ? '—' : `${Math.round(router.lastTransitionMs)} ms`}
    </dd>
  </dl>
</aside>

<style>
  .diag {
    position: fixed;
    right: 8px;
    bottom: 8px;
    z-index: 950;
    padding: 6px 9px;
    background: rgba(6, 10, 9, 0.9);
    border: 1px solid var(--line-hi);
    font-family: var(--f-mono);
    font-size: 9.5px;
    color: var(--muted);
    pointer-events: none;
  }
  dl {
    display: grid;
    grid-template-columns: auto auto;
    gap: 2px 10px;
    margin: 0;
  }
  dt {
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  dd {
    margin: 0;
    color: var(--sig);
  }
</style>
