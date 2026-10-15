<script lang="ts">
  import type { CombatResult, CombatSetup } from '@nova/sim';
  import { replayCombat } from '../../state/combat.svelte';
  import { navigate } from '../../state/router.svelte';
  import { teamParams } from '../../state/team-params';
  import Btn from '../../ui/Btn.svelte';
  import { nombre } from '../../ui/format';
  import Modal from '../../ui/Modal.svelte';

  /**
   * Resolution automatique (autoResolve, lignes 1936-1954 ; FR-030a). Le combat a ete calcule par les
   * memes regles qu'a l'ecran, sans affichage ni competence du commandant ; au lieu du tirage au
   * hasard de la maquette, la fenetre donne son vrai resultat. Rien n'est credite (phase P5 de la
   * feuille de route). "Revoir le combat" le rejoue a l'ecran Combat, a l'identique.
   */
  let {
    setup,
    result,
    onclose,
  }: { setup: CombatSetup; result: CombatResult; onclose: () => void } = $props();

  const reussie = $derived(result.outcome === 'victory');
  const pertes = $derived(result.unitsEngaged - result.unitsLeft);

  function revoir() {
    replayCombat(setup);
    navigate({ screen: 'combat' });
  }
</script>

<Modal
  label="Résolution automatique"
  modal="auto-resolve"
  {onclose}
  attributes={{
    'data-outcome': result.outcome,
    ...(teamParams.diag ? { 'data-fingerprint': result.fingerprint } : {}),
  }}
>
  <div class="hd">
    <span class="dot"></span><span>Résolution automatique</span><span class="rt"
      >AUCUN RENDU — MÊMES RÈGLES</span
    >
  </div>
  <div class="bd corps">
    <div class="titre" class:ok={reussie}>{reussie ? 'Opération réussie' : 'Opération échouée'}</div>
    <div class="texte">
      Le combat s'est déroulé en arrière-plan, selon les mêmes règles qu'à l'écran et sans les
      compétences du commandant : aucun rendu n'a été calculé.
    </div>
    <div class="stats">
      <div>
        <div class="tiny">Pertes</div>
        <div class="num" data-losses>{pertes} {pertes > 1 ? 'unités' : 'unité'}</div>
      </div>
      <div>
        <div class="tiny">Butin</div>
        <div class="num gold" data-loot>{nombre(result.loot)}</div>
      </div>
      <div>
        <div class="tiny">Territoire</div>
        <div class="num">{reussie ? '+1 planète' : 'inchangé'}</div>
      </div>
    </div>
    {#if teamParams.diag}
      <div class="tiny empreinte">Empreinte {result.fingerprint} · graine {setup.seed}</div>
    {/if}
    <div class="commandes">
      <Btn variant="ghost" onclick={onclose}>Fermer</Btn>
      <Btn onclick={() => navigate({ screen: 'deploiement' })}>Rejouer en manuel</Btn>
      <Btn variant="ghost" onclick={revoir}>Revoir le combat</Btn>
    </div>
  </div>
</Modal>

<style>
  .corps {
    padding: 26px 30px;
  }
  .titre {
    font-size: 26px;
    letter-spacing: 0.16em;
    color: var(--warn);
    text-transform: uppercase;
  }
  .titre.ok {
    color: var(--ok);
  }
  .texte {
    font-size: 11px;
    color: var(--muted);
    margin-top: 8px;
    line-height: 1.6;
    max-width: 520px;
  }
  .stats {
    display: flex;
    gap: 22px;
    margin-top: 22px;
  }
  .num {
    font-size: 19px;
    margin-top: 5px;
  }
  .empreinte {
    margin-top: 14px;
    font-family: var(--f-mono);
  }
  .commandes {
    display: flex;
    gap: 8px;
    margin-top: 26px;
  }
</style>
