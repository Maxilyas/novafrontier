<script lang="ts">
  import { derivedValues } from '@nova/data';
  import SceneHost from '../../scene/SceneHost.svelte';
  import { toHash } from '../../state/router.svelte';
  import { selection } from '../../state/selection.svelte';
  import Btn from '../../ui/Btn.svelte';
  import Panel from '../../ui/Panel.svelte';
  import Assistance from './Assistance.svelte';
  import Disposition from './Disposition.svelte';
  import ObjectivePanel from './ObjectivePanel.svelte';
  import UnitPool from './UnitPool.svelte';

  /**
   * Ecran 07 · Deploiement (maquette, lignes 805-811 et 2072-2144, CSS 503-528). La scene occupe la
   * zone centrale, a la place du plateau (FR-020, FR-022). "Lancer le combat" est inactif quand
   * l'escouade n'engage aucune unite (FR-019).
   */
  const engagees = $derived(
    derivedValues.deployment[selection.current.squad][selection.current.theatre].units,
  );
  const spatial = $derived(selection.current.theatre === 'orbital');
</script>

<section
  class="screen deploiement"
  data-screen="deploiement"
  aria-label="Déploiement"
  tabindex="-1"
>
  <h1 class="tag">// 07 · <b>DÉPLOIEMENT</b> — PHASE D'INITIALISATION</h1>
  <div class="dleft">
    <Panel title="Théâtre" right={spatial ? 'SPATIAL' : 'TERRESTRE'}>
      <div class="bd" style="padding:10px 12px">
        <div class="note">
          {spatial
            ? "Engagement orbital : la force méca reste au sol et n'apparaît pas dans la liste."
            : "Engagement terrestre : mécas et vaisseaux d'appui sont déployés ensemble."}
        </div>
      </div>
    </Panel>
    <UnitPool />
  </div>
  <div class="deploy"><SceneHost scene="deploiement" /></div>
  <div class="dright">
    <Disposition />
    <ObjectivePanel />
    <Assistance />
    <Btn
      variant="solid"
      href={engagees.length > 0 ? toHash({ screen: 'combat' }) : undefined}
      disabled={engagees.length === 0}
      style="width:100%;padding:13px"
    >
      Lancer le combat
    </Btn>
  </div>
</section>

<style>
  /* Colonnes de la maquette a 1600 px : 264 px, plateau fluide, 284 px. */
  .deploiement {
    display: grid;
    padding: 2.75rem 1.25rem 1.25rem;
    grid-template-columns:
      clamp(15rem, calc(15rem + (100vw - 80rem) * 0.075), 16.5rem)
      0.75rem minmax(0, 1fr) 0.75rem
      clamp(16rem, calc(16rem + (100vw - 80rem) * 0.0875), 17.75rem);
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'dleft . deploy . dright';
    background: #040706;
  }
  .dleft,
  .dright {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--line-hi) transparent;
  }
  .dleft {
    grid-area: dleft;
  }
  .dright {
    grid-area: dright;
  }
  .dleft :global(.panel.pool) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .deploy {
    grid-area: deploy;
    position: relative;
    border: 1px solid var(--line);
    background: #050908;
  }
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.55;
  }
</style>
