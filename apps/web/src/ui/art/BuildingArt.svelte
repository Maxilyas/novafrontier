<script lang="ts">
  import type { BuildingId } from '@nova/data';
  import { registerVisual } from './registry.svelte';

  /** Batiment de la base : portage de bldgSVG (maquette, lignes 1386-1438). */
  let { kind, width, height }: { kind: BuildingId; width: number; height: number } = $props();
  const uid = $props.id();

  const A = '#63d6bc';
  const S = '#b3bcae';
  const M = $derived(`url(#bm-${uid})`);
  const D = $derived(`url(#bd-${uid})`);

  $effect(() => registerVisual(`b${kind}${width}`));
</script>

<svg {width} {height} viewBox="0 0 200 160" aria-hidden="true">
  <defs>
    <linearGradient id="bm-{uid}" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#556660" />
      <stop offset=".45" stop-color="#293632" />
      <stop offset="1" stop-color="#111918" />
    </linearGradient>
    <linearGradient id="bd-{uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#374540" />
      <stop offset="1" stop-color="#0d1413" />
    </linearGradient>
  </defs>
  {#if kind === 'refinery'}
    <ellipse cx="100" cy="152" rx="84" ry="22" fill="#0a100e" opacity=".7" />
    <path d="M24 152V84h44v68z" fill={M} stroke={S} stroke-width="1.4" />
    <path d="M74 152V60h34v92z" fill={M} stroke={S} stroke-width="1.4" />
    <path d="M116 152V96h58v56z" fill={D} stroke={S} stroke-width="1.4" />
    <rect x="126" y="40" width="16" height="56" fill={M} stroke={S} stroke-width="1.2" />
    <g fill={A}>
      <rect x="34" y="120" width="8" height="5" />
      <rect x="82" y="110" width="8" height="5" />
    </g>
  {:else if kind === 'lab'}
    <ellipse cx="100" cy="150" rx="76" ry="22" fill="#0a100e" opacity=".7" />
    <path d="M40 150v-42a60 60 0 01120 0v42z" fill={M} stroke={S} stroke-width="1.6" />
    <circle cx="100" cy="104" r="16" fill="#0d1a18" stroke={A} stroke-width="1.4" />
    <circle cx="100" cy="104" r="7" fill={A} opacity=".8" />
    <path d="M100 62V34" stroke={S} stroke-width="1.6" />
    <circle cx="100" cy="30" r="5" fill="none" stroke={A} stroke-width="1.4" />
  {:else if kind === 'shipyard'}
    <ellipse cx="100" cy="152" rx="92" ry="22" fill="#0a100e" opacity=".7" />
    <path d="M16 152v-16h168v16z" fill={D} stroke={S} stroke-width="1.4" />
    <path d="M30 136V54M170 136V54" stroke={S} stroke-width="3" />
    <path d="M22 54h156v14H22z" fill={M} stroke={S} stroke-width="1.4" />
    <path d="M100 74l14 30v26l-14 12-14-12v-26z" fill={M} stroke={A} stroke-width="1.5" />
  {:else if kind === 'mechbay'}
    <ellipse cx="100" cy="152" rx="86" ry="22" fill="#0a100e" opacity=".7" />
    <path d="M22 152V78l78-30 78 30v74z" fill={M} stroke={S} stroke-width="1.5" />
    <path d="M62 152v-44h76v44z" fill="#080d0c" stroke={A} stroke-width="1.4" />
    <path d="M88 120h24v14H88z" fill={A} opacity=".55" />
  {:else if kind === 'reactor'}
    <ellipse cx="100" cy="152" rx="72" ry="20" fill="#0a100e" opacity=".7" />
    <path d="M52 152V76h96v76z" fill={M} stroke={S} stroke-width="1.5" />
    <ellipse cx="100" cy="76" rx="48" ry="16" fill={D} stroke={S} stroke-width="1.4" />
    <ellipse
      cx="100"
      cy="110"
      rx="60"
      ry="12"
      fill="none"
      stroke={A}
      stroke-width="1.4"
      opacity=".8"
    />
    <path d="M100 60V26" stroke={A} stroke-width="2" />
    <circle cx="100" cy="22" r="6" fill={A} opacity=".8" />
  {:else if kind === 'radar'}
    <ellipse cx="100" cy="150" rx="62" ry="18" fill="#0a100e" opacity=".7" />
    <path d="M70 150v-28h60v28z" fill={D} stroke={S} stroke-width="1.4" />
    <path d="M100 122V96" stroke={S} stroke-width="6" />
    <g transform="rotate(-26 100 72)">
      <ellipse cx="100" cy="72" rx="48" ry="21" fill={M} stroke={S} stroke-width="1.7" />
      <ellipse
        cx="100"
        cy="72"
        rx="30"
        ry="12"
        fill="none"
        stroke={A}
        stroke-width="1"
        opacity=".55"
      />
      <path d="M100 72V38" stroke={S} stroke-width="2.5" />
      <circle cx="100" cy="34" r="5" fill={A} />
    </g>
  {:else if kind === 'market'}
    <ellipse cx="100" cy="150" rx="80" ry="20" fill="#0a100e" opacity=".7" />
    <path d="M28 150v-52h144v52z" fill={M} stroke={S} stroke-width="1.4" />
    <path d="M20 98l16-26h128l16 26z" fill={D} stroke={S} stroke-width="1.4" />
    <g fill="#0a100e" stroke={A} stroke-width="1.2">
      <rect x="46" y="112" width="26" height="26" />
      <rect x="86" y="106" width="30" height="32" />
    </g>
  {:else if kind === 'turret'}
    <ellipse cx="100" cy="150" rx="52" ry="16" fill="#0a100e" opacity=".7" />
    <path d="M64 150v-26h72v26z" fill={D} stroke={S} stroke-width="1.4" />
    <path d="M76 124V96a24 24 0 0148 0v28z" fill={M} stroke={S} stroke-width="1.4" />
    <path d="M118 100l44-22M118 108l44-22" stroke={S} stroke-width="5" />
    <circle cx="100" cy="100" r="6" fill={A} />
  {:else}
    <ellipse cx="100" cy="150" rx="88" ry="26" fill="#0a100e" opacity=".75" />
    <path d="M30 150V96l70-40 70 40v54l-70 26z" fill={M} stroke={S} stroke-width="1.6" />
    <path d="M30 96l70 26 70-26-70-40z" fill={D} stroke={S} stroke-width="1.4" />
    <rect x="86" y="18" width="28" height="40" fill={M} stroke={S} stroke-width="1.3" />
    <path d="M100 18V2" stroke={A} stroke-width="1.6" />
    <circle cx="100" cy="2" r="3.5" fill={A} />
    <g fill={A} opacity=".9">
      <rect x="52" y="126" width="10" height="6" />
      <rect x="76" y="132" width="10" height="6" />
      <rect x="114" y="132" width="10" height="6" />
      <rect x="138" y="126" width="10" height="6" />
    </g>
  {/if}
</svg>
