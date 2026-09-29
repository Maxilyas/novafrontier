<script lang="ts">
  import type { IconId } from '@nova/data';

  /** Icone du sprite de la maquette, toujours decorative (aria-hidden). */
  let {
    icon,
    size = 24,
    stroke = 'currentColor',
    strokeWidth = 1.3,
    fill = 'none',
    class: className = '',
  }: {
    icon: IconId;
    size?: number | undefined;
    stroke?: string | undefined;
    strokeWidth?: number | undefined;
    fill?: string | undefined;
    class?: string | undefined;
  } = $props();
</script>

<svg
  class={className}
  viewBox="0 0 24 24"
  width={size}
  height={size}
  {stroke}
  stroke-width={strokeWidth}
  {fill}
  aria-hidden="true"
>
  <use href="#{icon}" />
</svg>
