<script lang="ts">
  import { researchTrees } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import Btn from '../../ui/Btn.svelte';
  import { nombre } from '../../ui/format';
  import Icon from '../../ui/Icon.svelte';
  import KeyValue from '../../ui/KeyValue.svelte';
  import OpenBadge from '../../ui/OpenBadge.svelte';
  import Panel from '../../ui/Panel.svelte';
  import Pill from '../../ui/Pill.svelte';

  /**
   * Dossier du noeud choisi (renderTree, lignes 1591-1623 ; CSS 405). Lancer une recherche releve
   * d'une phase ulterieure (FR-018), quel que soit le libelle du bouton.
   */
  const ETAT = {
    done: { libelle: 'ACQUIS', couleur: 'var(--sig)', bouton: 'Palier maximum atteint' },
    active: { libelle: 'EN COURS', couleur: 'var(--paper)', bouton: 'Lancer la recherche' },
    lock: { libelle: 'VERROUILLÉ', couleur: 'var(--muted)', bouton: 'Prérequis manquants' },
  } as const;

  const arbre = $derived(researchTrees.find((t) => t.id === selection.current.tree));
  const noeud = $derived(
    arbre?.nodes.find((n) => n.id === selection.current.node) ?? arbre?.nodes[0],
  );
  const prerequis = $derived(
    (noeud?.prerequisites ?? []).map((p) => arbre?.nodes.find((n) => n.id === p)?.name ?? p),
  );
</script>

{#if noeud}
  {@const etat = ETAT[noeud.state]}
  <Panel title="Dossier de recherche" right={etat.libelle} rightStyle="color:{etat.couleur}" class="rdet">
    <div class="bd corps">
      <div class="entete">
        <div class="icone" class:leg={noeud.legendary}>
          <Icon
            icon={noeud.icon}
            size={30}
            stroke={noeud.legendary ? '#f5a623' : '#63d6bc'}
            strokeWidth={1.2}
          />
        </div>
        <div>
          <h2 class="nom">{noeud.name}</h2>
          <div class="mono niveau">NIVEAU {noeud.level.current}/{noeud.level.max}</div>
        </div>
      </div>
      <div class="description">{noeud.description}</div>
      {#if noeud.openDecision}
        <div style="margin-bottom:12px">
          <OpenBadge>Dépend d'un arbitrage — points 2 et 3 du CR</OpenBadge>
        </div>
      {/if}
      <div class="tiny" style="margin:0 0 6px">Prérequis</div>
      <div class="pillrow">
        {#each prerequis as nom (nom)}<Pill variant="s">{nom}</Pill>{:else}<Pill variant="k"
            >Aucun</Pill
          >{/each}
        <Pill>Laboratoire NIV {noeud.labLevel}</Pill>
      </div>
      <div class="tiny" style="margin:14px 0 6px">Coût du palier</div>
      <div class="pillrow">
        <Pill>{nombre(noeud.cost.alloy)} alliage</Pill>
        <Pill variant="g">{nombre(noeud.cost.credits)} crédits</Pill>
        {#if noeud.cost.artefacts !== undefined}<Pill variant="w"
            >{noeud.cost.artefacts} artefacts</Pill
          >{/if}
      </div>
      <KeyValue label="Durée" value={noeud.duration} style="margin-top:13px" />
      <KeyValue label="Effet par niveau" value={noeud.effect} valueClass="ok" />
      <Btn
        variant={noeud.state === 'lock' ? 'ghost' : 'solid'}
        style="width:100%;margin-top:13px"
        laterPhase="start-research"
      >
        {etat.bouton}
      </Btn>
      <div class="tiny" style="margin:20px 0 7px">Légende</div>
      <div class="pillrow">
        <Pill variant="s">Acquis</Pill>
        <Pill>En cours</Pill>
        <Pill variant="w">Verrouillé</Pill>
        <Pill variant="g">Palier légendaire</Pill>
      </div>
      <div class="note">
        Toute recherche consomme de l'alliage et des crédits. Les paliers légendaires exigent en plus
        des artefacts anciens, récupérés uniquement sur les planètes inexplorées.
      </div>
    </div>
  </Panel>
{/if}

<style>
  .corps {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  .entete {
    display: flex;
    gap: 11px;
    align-items: center;
  }
  .icone {
    width: 54px;
    height: 54px;
    border: 1px solid var(--line-hi);
    background: #0a100f;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .icone.leg {
    border-color: rgba(245, 166, 35, 0.5);
  }
  .nom {
    font-size: 14px;
    line-height: 1.2;
  }
  .niveau {
    font-size: 9.5px;
    color: var(--muted);
    margin-top: 4px;
  }
  .description {
    font-size: 10.5px;
    line-height: 1.6;
    margin: 13px 0;
  }
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.55;
    margin-top: 11px;
  }
</style>
