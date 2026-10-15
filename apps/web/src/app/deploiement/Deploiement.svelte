<script lang="ts">
  import SceneHost from '../../scene/SceneHost.svelte';
  import { setBoard } from '../../scene/scenes/deploy/board';
  import { combatChoices, launchCombat } from '../../state/combat.svelte';
  import { deployment } from '../../state/deployment.svelte';
  import { navigate } from '../../state/router.svelte';
  import { selection } from '../../state/selection.svelte';
  import Btn from '../../ui/Btn.svelte';
  import Panel from '../../ui/Panel.svelte';
  import Assistance from './Assistance.svelte';
  import Disposition from './Disposition.svelte';
  import ObjectivePanel from './ObjectivePanel.svelte';
  import SlotButtons from './SlotButtons.svelte';
  import UnitPool from './UnitPool.svelte';

  /**
   * Ecran 07 · Deploiement (maquette, lignes 805-811 et 2072-2156, CSS 503-528). La zone centrale est
   * le plateau : la scene dessine le fond, les lignes et la relique, les emplacements sont des
   * boutons par-dessus (FR-037 a FR-043). "Lancer le combat" est inactif tant qu'aucune unite n'est
   * placee (FR-042) ; sinon il lance un nouveau combat avec ce placement, qui remplace tout combat en
   * cours, puis ouvre l'ecran Combat (FR-031).
   */
  const formation = $derived(selection.current.formation[selection.current.squad]);

  // A l'arrivee, et a chaque changement d'escouade, de theatre ou de formation : le plateau montre
  // la combinaison choisie, et son placement initial est memorise s'il n'existe pas (FR-041).
  $effect(() => {
    setBoard(formation, selection.current.theatre);
    deployment.ensure();
  });

  const choix = $derived(
    combatChoices(
      selection.current.squad,
      selection.current.theatre,
      formation,
      deployment.current,
    ),
  );

  function lancer() {
    if (!choix) return;
    launchCombat(choix);
    navigate({ screen: 'combat' });
  }
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
  <div class="deploy">
    <SceneHost scene="deploiement" />
    <SlotButtons />
  </div>
  <div class="dright">
    <Disposition />
    <ObjectivePanel />
    <Assistance />
    <Btn variant="solid" disabled={!choix} onclick={lancer} style="width:100%;padding:13px">
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
