<script lang="ts">
  import { onMount } from 'svelte';
  import { diagnostic } from '../scene/renderer';
  import { combatHud } from '../state/combat.svelte';
  import { router } from '../state/router.svelte';

  /**
   * Badge de diagnostic, affiche seulement avec `?diag=1` (contracts/scene-host.md, R11) : mode de
   * chaque scene ouverte, applications Pixi, cadence de la scene visible sur 1 s et duree du dernier
   * changement d'ecran. Il sert aux mesures manuelles de SC-004, SC-005 et SC-009. Sur l'ecran
   * Combat, il devient le releve de mesures (FR-035) : entites en vie, pas et empreinte en plus. Un
   * clic sur son titre le replie ou le deplie ; replie, il laisse voir tout le HUD.
   */
  let etat = $state(diagnostic());
  let cadence = $state<number | undefined>(undefined);
  let replie = $state(false);

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
  <button
    type="button"
    class="bascule"
    aria-expanded={!replie}
    onclick={() => {
      replie = !replie;
    }}>Diagnostic</button
  >
  {#if !replie}<dl>
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
    {#if router.route.screen === 'combat' && combatHud.hud}
      <dt>Entités</dt>
      <dd data-entities={combatHud.hud.entities}>{combatHud.hud.entities ?? '—'}</dd>
      <dt>Pas</dt>
      <dd data-tick={combatHud.hud.tick}>{combatHud.hud.tick}</dd>
      <dt>Empreinte</dt>
      <dd data-fingerprint={combatHud.hud.fingerprint}>{combatHud.hud.fingerprint ?? '—'}</dd>
    {/if}
  </dl>{/if}
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
  .bascule {
    display: block;
    margin: 0 0 4px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--paper);
    cursor: pointer;
    pointer-events: auto;
  }
  .bascule[aria-expanded='false'] {
    margin: 0;
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
