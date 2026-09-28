<script lang="ts">
  import type { ActiveWeaponId } from '@nova/data';
  import { registerVisual } from './registry.svelte';

  /**
   * Vaisseau : portage de shipArt (maquette, lignes 935-970). Meme silhouette a chaque palier ;
   * canons au palier 2, structures au 3, escadron d'escorte au 4.
   */
  let {
    visual,
    color,
    tier,
    weapon,
    weaponColor,
  }: {
    visual: number;
    color: string;
    tier: number;
    weapon: ActiveWeaponId;
    weaponColor: string;
  } = $props();
  const uid = $props.id();

  type Forme = { d: string } | { x: number; y: number; width: number; height: number; rx: number };
  const BODIES: Forme[][] = [
    [
      { d: 'M100 26l16 56v68l-16 32-16-32V82z' },
      { d: 'M84 88L36 134l4 28 44-22z' },
      { d: 'M116 88l48 46-4 28-44-22z' },
    ],
    [
      { d: 'M100 38c22 0 33 20 33 43v54c0 17-11 38-33 38s-33-21-33-38V81c0-23 11-43 33-43z' },
      { d: 'M67 94L29 119v32l38-13z' },
      { d: 'M133 94l38 25v32l-38-13z' },
    ],
    [
      { d: 'M100 20l10 38 12 23v88l-22 25-22-25V81l12-23z' },
      { d: 'M78 98L42 90l-6 42 42 17z' },
      { d: 'M122 98l36-8 6 42-42 17z' },
    ],
    [
      { d: 'M100 26l25 44v100l-25 23-25-23V70z' },
      { d: 'M75 78H33l-8 58 50 25z' },
      { d: 'M125 78h42l8 58-50 25z' },
      { d: 'M85 104h30v64H85z' },
    ],
    [
      { d: 'M100 18l17 32 13 33v101l-30 29-30-29V83l13-33z' },
      { d: 'M70 90L26 98l-8 50 52 25z' },
      { d: 'M130 90l44 8 8 50-52 25z' },
      { x: 87, y: 62, width: 26, height: 114, rx: 4 },
    ],
    [
      { d: 'M64 70h72v112l-36 22-36-22z' },
      { d: 'M64 90H30l-4 54 38 16z' },
      { d: 'M136 90h34l4 54-38 16z' },
      { d: 'M84 46h32v24H84z' },
    ],
  ];

  const body = $derived(BODIES[visual % 6] ?? []);

  $effect(() => registerVisual(`s${visual}${color}${tier}${weapon}`));
</script>

<svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="sg-{uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#18211f" />
      <stop offset=".6" stop-color="#0a100f" />
      <stop offset="1" stop-color="#060909" />
    </linearGradient>
    <linearGradient id="sm-{uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5a6863" />
      <stop offset=".5" stop-color="#2a3632" />
      <stop offset="1" stop-color="#161e1c" />
    </linearGradient>
  </defs>
  <rect width="200" height="300" fill="url(#sg-{uid})" />
  <g opacity=".14" stroke={color} fill="none">
    <circle cx="100" cy="124" r="80" />
    <circle cx="100" cy="124" r="56" />
  </g>
  <g transform="translate(0,18)">
    <g fill="url(#sm-{uid})" stroke={color} stroke-width="1.5" stroke-linejoin="round">
      {#each body as forme, k (k)}
        {#if 'd' in forme}
          <path d={forme.d} />
        {:else}
          <rect x={forme.x} y={forme.y} width={forme.width} height={forme.height} rx={forme.rx} />
        {/if}
      {/each}
    </g>
    {#if weapon === 'nuc'}
      <g fill={weaponColor} opacity=".9">
        <circle cx="100" cy="70" r="9" />
        <path d="M92 70h16v10H92z" />
      </g>
    {:else if weapon === 'art'}
      <g fill={weaponColor} opacity=".9">
        <rect x="88" y="42" width="7" height="30" />
        <rect x="105" y="42" width="7" height="30" />
      </g>
    {:else}
      <g fill={weaponColor} opacity=".9">
        <path d="M97 34h6v40h-6z" />
        <circle cx="100" cy="32" r="4" />
      </g>
    {/if}
    {#if tier >= 2}
      <g fill={weaponColor} opacity=".92">
        <rect x="52" y="118" width="9" height="34" rx="2" />
        <rect x="139" y="118" width="9" height="34" rx="2" />
      </g>
      <g fill="none" stroke={weaponColor} stroke-width="1.5" opacity=".8">
        <path d="M56.5 118v-14M143.5 118v-14" />
      </g>
    {/if}
    {#if tier >= 3}
      <g fill="#39443f" stroke="#9aa093" stroke-width="1.3">
        <path d="M86 60h28v22H86z" />
        <path d="M76 172h48v20H76z" />
      </g>
      <g fill="none" stroke={color} stroke-width="1" opacity=".55">
        <path d="M70 140h60M70 152h60" />
      </g>
    {/if}
    {#if tier >= 4}
      <g opacity=".85" fill="#2b3733" stroke={color} stroke-width="1.2">
        <path d="M34 214l7 14-7 6-7-6z" />
        <path d="M100 236l7 14-7 6-7-6z" />
        <path d="M166 214l7 14-7 6-7-6z" />
      </g>
      <g fill={color} opacity=".5">
        <circle cx="34" cy="236" r="2" />
        <circle cx="100" cy="258" r="2" />
        <circle cx="166" cy="236" r="2" />
      </g>
    {/if}
    <g fill={weaponColor} opacity=".85">
      <ellipse cx="100" cy="196" rx="7" ry="12" />
      <ellipse cx="84" cy="192" rx="4" ry="8" />
      <ellipse cx="116" cy="192" rx="4" ry="8" />
    </g>
    <g opacity=".32" fill={weaponColor}><ellipse cx="100" cy="224" rx="13" ry="28" /></g>
  </g>
  <rect x="0" y="248" width="200" height="52" fill="#05080788" />
</svg>
