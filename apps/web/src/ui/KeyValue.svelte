<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    label,
    value,
    valueClass = '',
    valueStyle,
    style,
    children,
  }: {
    label: string;
    value?: string | number | undefined;
    valueClass?: string | undefined;
    valueStyle?: string | undefined;
    style?: string | undefined;
    children?: Snippet | undefined;
  } = $props();
</script>

<div class="kv" {style}>
  <span class="k">{label}</span>
  <span class="v {valueClass}" style={valueStyle}>
    {#if children}{@render children()}{:else}{value}{/if}
  </span>
</div>
