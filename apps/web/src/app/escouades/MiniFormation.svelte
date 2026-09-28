<script lang="ts">
  import type { Formation } from '@nova/data';

  /**
   * Apercu de la formation par defaut : portage en SVG du canvas drawMiniForm (lignes 1236-1258),
   * aux memes coordonnees (292 x 94). Premiere ligne en rouge, seconde en phosphore, objectif en or.
   */
  let { formation }: { formation: Formation } = $props();

  const W = 292;
  const CY = 94 / 2 - 2;
  const tour = Math.PI * 2;
  const point = (cx: number, r: number, a: number) => ({
    x: cx + Math.cos(a) * r,
    y: CY + Math.sin(a) * r,
  });
  const arc = (cx: number, r: number) => {
    const debut = point(cx, r, -0.85);
    const fin = point(cx, r, 0.85);
    return `M${debut.x} ${debut.y}A${r} ${r} 0 0 1 ${fin.x} ${fin.y}`;
  };

  const DISPOSITIONS = {
    ring: {
      guides: [
        { cercle: true, r: 22, d: '' },
        { cercle: true, r: 34, d: '' },
      ],
      objectif: W / 2,
      avant: Array.from({ length: 8 }, (_, i) => point(W / 2, 22, (i / 8) * tour)),
      arriere: Array.from({ length: 8 }, (_, i) => point(W / 2, 34, (i / 8 + 0.06) * tour)),
    },
    arc: {
      guides: [
        { cercle: false, r: 74, d: arc(64, 74) },
        { cercle: false, r: 54, d: arc(64, 54) },
      ],
      objectif: 228,
      avant: Array.from({ length: 6 }, (_, i) => point(64, 74, -0.78 + i * 0.31)),
      arriere: Array.from({ length: 6 }, (_, i) => point(64, 54, -0.78 + i * 0.31)),
    },
  } as const;

  const dispo = $derived(DISPOSITIONS[formation]);
</script>

<div class="miniform">
  <svg viewBox="0 0 292 94" width="292" height="94" aria-hidden="true">
    <g fill="none" stroke="rgba(99,214,188,.25)" stroke-dasharray="3 3">
      {#each dispo.guides as guide (guide.r)}
        {#if guide.cercle}
          <circle cx={W / 2} cy={CY} r={guide.r} />
        {:else}
          <path d={guide.d} />
        {/if}
      {/each}
    </g>
    <circle cx={dispo.objectif} cy={CY} r="5" fill="#f5a623" />
    {#each dispo.avant as p, i (i)}
      <rect x={p.x - 3} y={p.y - 3} width="6" height="6" fill="#e8543f" />
    {/each}
    {#each dispo.arriere as p, i (i)}
      <rect x={p.x - 2.5} y={p.y - 2.5} width="5" height="5" fill="#63d6bc" />
    {/each}
  </svg>
  <div class="legende">
    {formation === 'ring' ? "360° AUTOUR DE L'OBJECTIF" : 'ARC DEPUIS UN BORD'}
  </div>
</div>

<style>
  .miniform {
    height: 96px;
    position: relative;
    border: 1px solid var(--line);
    background: #080d0c;
    overflow: hidden;
  }
  svg {
    display: block;
  }
  .legende {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 3px 6px;
    background: rgba(6, 10, 9, 0.9);
    font-family: var(--f-mono);
    font-size: 8px;
    color: var(--muted);
    letter-spacing: 0.1em;
  }
</style>
