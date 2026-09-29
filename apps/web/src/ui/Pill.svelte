<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = '',
    children,
  }: { variant?: '' | 's' | 'g' | 'w' | 'k' | undefined; children: Snippet } = $props();
</script>

<span class="pill {variant}">{@render children()}</span>
