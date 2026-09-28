<script lang="ts">
  import type { WeaponId } from '@nova/data';

  /** Glyphe d'armement : portage de weaponGlyph (maquette, lignes 1375-1382). */
  let { weapon, color }: { weapon: WeaponId; color: string } = $props();
</script>

<svg viewBox="0 0 40 40" width="42" height="42" aria-hidden="true">
  {#if weapon === 'las'}
    <path d="M20 4v22" stroke={color} stroke-width="3" />
    <circle cx="20" cy="4" r="4" fill={color} />
    <path d="M14 26h12v8H14z" fill="#2a3632" stroke={color} />
  {:else if weapon === 'art'}
    <rect x="12" y="8" width="5" height="20" fill={color} />
    <rect x="23" y="8" width="5" height="20" fill={color} />
    <path d="M8 28h24v8H8z" fill="#2a3632" stroke={color} />
  {:else if weapon === 'nuc'}
    <circle cx="20" cy="12" r="8" fill={color} />
    <path d="M14 20h12v10H14z" fill="#2a3632" stroke={color} />
    <path d="M20 4v4" stroke={color} stroke-width="2" />
  {:else if weapon === 'ion'}
    <circle cx="20" cy="16" r="9" fill="none" stroke={color} stroke-width="2" />
    <circle cx="20" cy="16" r="3" fill={color} />
    <path d="M20 25v9" stroke={color} stroke-width="3" />
  {:else}
    <path d="M20 4l6 10v14h-12V14z" fill={color} />
    <path d="M14 28h12v6H14z" fill="#2a3632" stroke={color} />
  {/if}
</svg>
