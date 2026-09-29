<script lang="ts">
  import { type ResearchNode, researchTrees } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import Icon from '../../ui/Icon.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Arbre de recherche (renderTree, lignes 1569-1590 ; CSS 379-404). Les noeuds gardent les
   * coordonnees de la maquette ; les liaisons, dessinees sur un canvas dans la maquette, sont ici
   * en SVG : trait plein phosphore vers un noeud accessible, pointille gris vers un noeud verrouille.
   */
  const DEMI_LARGEUR = 73;
  const MI_HAUTEUR = 34;
  const BADGE = { done: 'ACQUIS', active: 'EN COURS', lock: 'VERROU' } as const;
  const PROGRES = { done: 100, active: 45, lock: 0 } as const;

  const arbre = $derived(researchTrees.find((t) => t.id === selection.current.tree));

  function liaisons(noeuds: readonly ResearchNode[]) {
    const centre = new Map(
      noeuds.map((n) => [n.id, { x: n.position.x + DEMI_LARGEUR, y: n.position.y + MI_HAUTEUR }]),
    );
    return noeuds.flatMap((n) =>
      n.prerequisites.flatMap((p) => {
        const a = centre.get(p);
        const b = centre.get(n.id);
        if (!a || !b) return [];
        const mx = (a.x + b.x) / 2;
        return [
          {
            cle: `${p}-${n.id}`,
            verrou: n.state === 'lock',
            d: `M${a.x + DEMI_LARGEUR} ${a.y}H${mx}V${b.y}H${b.x - DEMI_LARGEUR}`,
          },
        ];
      }),
    );
  }
</script>

<Panel class="tree">
  {#if arbre}
    <div class="plan">
      <svg class="liens" aria-hidden="true">
        {#each liaisons(arbre.nodes) as lien (lien.cle)}
          <path
            d={lien.d}
            fill="none"
            stroke={lien.verrou ? 'rgba(120,132,126,.22)' : 'rgba(99,214,188,.45)'}
            stroke-width={lien.verrou ? 1 : 1.5}
            stroke-dasharray={lien.verrou ? '4 5' : undefined}
          />
        {/each}
      </svg>
      {#each arbre.nodes as noeud (noeud.id)}
        {@const picked = noeud.id === selection.current.node}
        <button
          type="button"
          class="tnode notched {noeud.state}"
          class:leg={noeud.legendary}
          class:picked
          style="--notch:6px;left:{noeud.position.x}px;top:{noeud.position.y}px"
          aria-pressed={picked}
          onclick={() => selection.selectNode(noeud.id)}
        >
          <span class="bg">{BADGE[noeud.state]}</span>
          <span class="th"><Icon icon={noeud.icon} size={16} strokeWidth={1.4} /><span class="tn"
              >{noeud.name}</span
            ></span>
          <span class="tl">
            NIVEAU {noeud.level.current}/{noeud.level.max}{noeud.openDecision ? ' · À TRANCHER' : ''}
          </span>
          <span class="tb"><i style="width:{PROGRES[noeud.state]}%"></i></span>
        </button>
      {/each}
    </div>
  {/if}
</Panel>

<style>
  .plan {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 1226px;
    min-height: 650px;
  }
  .liens {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .tnode {
    position: absolute;
    width: 146px;
    border: 1px solid var(--line);
    background: linear-gradient(180deg, #141d1a, #0a100e);
    padding: 8px;
    cursor: pointer;
    transition: 0.14s;
    z-index: 3;
    color: inherit;
    font: inherit;
    text-align: left;
  }
  .tnode:hover {
    border-color: var(--line-hi);
  }
  .th {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .th :global(svg) {
    stroke: var(--muted);
    flex: 0 0 auto;
  }
  .tn {
    font-size: 10px;
    letter-spacing: 0.06em;
    color: var(--txt);
    line-height: 1.15;
  }
  .tl,
  .tb {
    display: block;
  }
  .tl {
    font-size: 8.5px;
    font-family: var(--f-mono);
    color: var(--muted);
    margin-top: 5px;
  }
  .tb {
    height: 4px;
    background: #0a0f0e;
    margin-top: 5px;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .tb i {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: var(--sig);
  }
  .tnode.done {
    border-color: var(--sig-dim);
    background: linear-gradient(180deg, rgba(99, 214, 188, 0.1), #0a100e);
  }
  .tnode.done .tn {
    color: var(--paper);
  }
  .tnode.done .th :global(svg),
  .tnode.active .th :global(svg) {
    stroke: var(--sig);
  }
  .tnode.active {
    border-color: var(--sig);
    box-shadow: 0 0 18px var(--sig-glow);
  }
  .tnode.lock {
    opacity: 0.42;
  }
  .tnode.leg {
    border-color: rgba(245, 166, 35, 0.55);
    background: linear-gradient(180deg, rgba(245, 166, 35, 0.09), #0f0d08);
  }
  .tnode.leg .th :global(svg) {
    stroke: var(--gold);
  }
  .tnode.leg .tn {
    color: var(--gold);
  }
  .tnode.picked {
    border-color: var(--paper);
    box-shadow: 0 0 22px rgba(255, 255, 255, 0.18);
  }
  .bg {
    position: absolute;
    right: -1px;
    top: -1px;
    font-size: 7.5px;
    padding: 1px 5px;
    letter-spacing: 0.12em;
    background: var(--line-hi);
    color: #0a0e0d;
  }
  .tnode.done .bg {
    background: var(--sig);
    color: #04120f;
  }
  .tnode.active .bg {
    background: var(--sig-hi);
    color: #04120f;
  }
  .tnode.leg .bg {
    background: var(--gold);
    color: #120c02;
  }
</style>
