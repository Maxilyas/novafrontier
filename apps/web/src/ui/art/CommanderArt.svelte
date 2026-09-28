<script lang="ts">
  import { registerVisual } from './registry.svelte';

  /** Portrait de commandant : portage de cmdArt (maquette, lignes 897-932). */
  let { visual, color }: { visual: number; color: string } = $props();
  const uid = $props.id();

  const CRESTS = [
    ['M62 78c8-16 22-24 38-24s30 8 38 24z'],
    ['M96 34h8v22h-8z', 'M70 82c6-14 18-22 30-22s24 8 30 22z'],
    ['M58 92l14-30h56l14 30z'],
    ['M66 76h68v10H66z'],
  ];
  const VISORS = [
    'M56 106h88v28c0 13-11 22-24 22H80c-13 0-24-9-24-22z',
    'M58 102h84l-9 36c-2 6-8 10-14 10H81c-6 0-12-4-14-10z',
    'M54 112h92v20c0 14-12 24-26 24H80c-14 0-26-10-26-24z',
  ];

  const crest = $derived(CRESTS[visual % 4] ?? []);
  const visor = $derived(VISORS[visual % 3] ?? '');

  $effect(() => registerVisual(`c${visual}${color}`));
</script>

<svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="cg-{uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color={color} stop-opacity=".3" />
      <stop offset=".55" stop-color="#0d1414" />
      <stop offset="1" stop-color="#06090a" />
    </linearGradient>
    <radialGradient id="ch-{uid}" cx=".5" cy=".36" r=".6">
      <stop offset="0" stop-color={color} stop-opacity=".42" />
      <stop offset="1" stop-color={color} stop-opacity="0" />
    </radialGradient>
    <linearGradient id="cm-{uid}" x1="0" y1="0" x2=".7" y2="1">
      <stop offset="0" stop-color="#76837c" />
      <stop offset=".45" stop-color="#333d39" />
      <stop offset="1" stop-color="#141a18" />
    </linearGradient>
    <linearGradient id="cv-{uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color={color} />
      <stop offset="1" stop-color="#0a1010" />
    </linearGradient>
  </defs>
  <rect width="200" height="300" fill="url(#cg-{uid})" />
  <circle cx="100" cy="120" r="100" fill="url(#ch-{uid})" />
  <g opacity=".16" stroke={color} stroke-width="1" fill="none">
    <circle cx="100" cy="124" r="66" />
    <circle cx="100" cy="124" r="84" stroke-dasharray="6 9" />
  </g>
  <g fill="url(#cm-{uid})" stroke="#9aa093" stroke-width="1.6" stroke-linejoin="round">
    <path d="M8 300v-24c0-26 16-42 42-51l32-11h36l32 11c26 9 42 25 42 51v24z" />
    <path d="M84 196h32v26H84z" />
    <path
      d="M100 38c-32 0-50 22-50 52v34c0 11 3 20 9 27l7 25c2 7 8 12 15 12h38c7 0 13-5 15-12l7-25c6-7 9-16 9-27V90c0-30-18-52-50-52z"
    />
    <path d="M40 110h12v42H40a9 9 0 01-9-9v-24a9 9 0 019-9z" />
    <path d="M160 110h-12v42h12a9 9 0 009-9v-24a9 9 0 00-9-9z" />
    <path d="M72 166h56l-8 28H80z" />
  </g>
  <g fill="#0a1110" opacity=".85">
    {#each crest as d (d)}<path {d} />{/each}
  </g>
  <g fill="url(#cv-{uid})" opacity=".95"><path d={visor} /></g>
  <g fill="none" stroke="#9aa093" stroke-width="1.3" opacity=".7">
    <path d="M52 128h-8M148 128h8" />
    <path d="M64 172h72" />
    <path d="M78 222l22 12 22-12" />
  </g>
  <g fill={color}>
    <rect x="92" y="246" width="16" height="4" />
    <rect x="84" y="254" width="32" height="3" />
    <circle cx="44" cy="268" r="4" />
    <circle cx="156" cy="268" r="4" />
  </g>
  <rect x="0" y="250" width="200" height="50" fill="#05080788" />
</svg>
