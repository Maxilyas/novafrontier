<script lang="ts">
  import type { Snippet } from 'svelte';

  /** Badge "a trancher" de la maquette (.open) : decision de conception encore ouverte. */
  let { title, children }: { title?: string | undefined; children: Snippet } = $props();
</script>

<span class="open" {title}>{@render children()}</span>
