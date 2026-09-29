<script lang="ts">
  import type { ActiveWeaponId } from '@nova/data';
  import { registerVisual } from './registry.svelte';

  /** Meca : portage de mechArt (maquette, lignes 973-1005), traces calcules comme la maquette. */
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

  const VARIANTES = [
    { sw: 36, tw: 24, th: 42, arm: 12, leg: 1.0 },
    { sw: 32, tw: 21, th: 38, arm: 10, leg: 0.92 },
    { sw: 44, tw: 31, th: 48, arm: 15, leg: 1.08 },
    { sw: 52, tw: 38, th: 52, arm: 18, leg: 1.2 },
    { sw: 58, tw: 44, th: 56, arm: 20, leg: 1.3 },
  ] as const;

  const geo = $derived.by(() => {
    const V = VARIANTES[visual % 5] ?? VARIANTES[0];
    const cx = 100;
    const tt = 84;
    const tb = tt + V.th;
    const hb = tb + 15;
    const kn = hb + 42;
    const ft = kn + 44;
    const { sw, tw, arm: A } = V;
    const corps = [
      `M${cx - 13} ${tt - 22}h26v20h-26z`,
      `M${cx - tw} ${tt}h${2 * tw}v${V.th - 12}l-8 12h-${2 * tw - 16}l-8-12z`,
      `M${cx - tw - 1} ${tt + 1}L${cx - sw} ${tt - 7}l-7 ${A + 16} ${sw - tw - 6} 6z`,
      `M${cx + tw + 1} ${tt + 1}L${cx + sw} ${tt - 7}l7 ${A + 16} -${sw - tw - 6} 6z`,
      `M${cx - sw - 6} ${tt + A + 14}h${A + 2}v34h-${A + 2}z`,
      `M${cx + sw - A + 4} ${tt + A + 14}h${A + 2}v34h-${A + 2}z`,
      `M${cx - tw + 5} ${tb}h${2 * tw - 10}v15h-${2 * tw - 10}z`,
    ];
    const jambe = (s: number) => {
      const x = (v: number) => cx + s * v;
      return [
        `M${x(4)} ${hb}L${x(22 * V.leg)} ${hb + 4}L${x(27 * V.leg)} ${kn}L${x(11)} ${kn}z`,
        `M${x(11)} ${kn}L${x(27 * V.leg)} ${kn}L${x(24 * V.leg)} ${ft}L${x(9)} ${ft}z`,
        `M${x(6)} ${ft}L${x(28 * V.leg)} ${ft}L${x(32 * V.leg)} ${ft + 13}L${x(4)} ${ft + 13}z`,
      ];
    };
    const arme = [
      `M${cx + sw - A + 2} ${tt + A + 40}h${A + 8}v10h-${A + 8}z`,
      `M${cx + sw + 2} ${tt + A + 43}h26v5h-26z`,
    ];
    if (tier >= 2) arme.push(`M${cx - sw - 18} ${tt + 4}l15-7 15 7v40l-15 10-15-10z`);
    if (tier >= 3) arme.push(`M${cx - sw - 14} ${tt - 14}h18v16h-18z`);
    if (tier >= 4) arme.push(`M${cx + sw - 6} ${tt - 16}h14v14h-14z`);
    return { cx, tt, th: V.th, ft, corps: [...corps, ...jambe(-1), ...jambe(1)], arme };
  });

  $effect(() => registerVisual(`m${visual}${color}${tier}${weapon}`));
</script>

<svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="mg-{uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d2622" />
      <stop offset=".6" stop-color="#0b110f" />
      <stop offset="1" stop-color="#060908" />
    </linearGradient>
    <linearGradient id="mm-{uid}" x1="0" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="#69766f" />
      <stop offset=".45" stop-color="#313b37" />
      <stop offset="1" stop-color="#131917" />
    </linearGradient>
  </defs>
  <rect width="200" height="300" fill="url(#mg-{uid})" />
  <g opacity=".1" stroke={color}><path d="M0 262h200M0 240h200M0 218h200M0 196h200" /></g>
  <ellipse cx="100" cy={geo.ft + 16} rx="70" ry="11" fill="#04070680" />
  <g fill="url(#mm-{uid})" stroke={color} stroke-width="1.6" stroke-linejoin="round">
    {#each geo.corps as d, k (k)}<path {d} />{/each}
  </g>
  <g fill="url(#mm-{uid})" stroke={weaponColor} stroke-width="1.6" stroke-linejoin="round">
    {#each geo.arme as d, k (k)}<path {d} />{/each}
  </g>
  <g fill={weaponColor}>
    <rect x={geo.cx - 9} y={geo.tt - 16} width="18" height="5" />
    <circle cx={geo.cx} cy={geo.tt + geo.th - 22} r="4" />
  </g>
  <rect x="0" y="250" width="200" height="50" fill="#05080766" />
</svg>
