<script lang="ts">
  import { planetById } from '@nova/data';
  import type { CombatResult } from '@nova/sim';
  import { navigate } from '../../state/router.svelte';
  import Btn from '../../ui/Btn.svelte';
  import { nombre } from '../../ui/format';
  import Modal from '../../ui/Modal.svelte';

  /**
   * Fenetre de fin de combat (endCombat, lignes 2358-2375 ; FR-030). Le butin est estime, jamais
   * credite (phase P5 de la feuille de route).
   */
  let { result, planet }: { result: CombatResult; planet: string } = $props();

  const victoire = $derived(result.outcome === 'victory');
  const cible = $derived(planetById(planet)?.name.toUpperCase() ?? '');
</script>

<Modal
  label="Fin d'engagement"
  modal="end"
  attributes={{ 'data-outcome': result.outcome, 'data-fingerprint-final': result.fingerprint }}
>
  <div class="hd"><span class="dot"></span><span>Fin d'engagement</span><span class="rt">{cible}</span></div>
  <div class="bd corps">
    <div class="titre" class:ok={victoire}>{victoire ? 'Relique sécurisée' : 'Relique perdue'}</div>
    <div class="texte">
      {victoire
        ? 'Toutes les vagues ont été repoussées. Le territoire passe sous votre contrôle et commence à produire des crédits quotidiens.'
        : "L'objectif est tombé avant la dernière vague. Aucun butin, les unités détruites sont perdues."}
    </div>
    <div class="stats">
      <div>
        <div class="tiny">Vagues tenues</div>
        <div class="num" data-waves>{result.wavesSpawned}/{result.wavesTotal}</div>
      </div>
      <div>
        <div class="tiny">Unités restantes</div>
        <div class="num" data-units-left>{result.unitsLeft}/{result.unitsEngaged}</div>
      </div>
      <div>
        <div class="tiny">Butin</div>
        <div class="num gold" data-loot>{nombre(result.loot)}</div>
      </div>
    </div>
    <div class="commandes">
      <Btn onclick={() => navigate({ screen: 'deploiement' })}>Redéployer</Btn>
      <Btn variant="ghost" onclick={() => navigate({ screen: 'carte' })}>Retour à la carte</Btn>
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
    max-width: 520px;
    line-height: 1.6;
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
  .commandes {
    display: flex;
    gap: 8px;
    margin-top: 26px;
  }
</style>
