<script lang="ts">
  /** Etoiles de rarete (stars() de la maquette) : n pleines sur max, les autres estompees. */
  let { count, max }: { count: number; max: number } = $props();
</script>

{#each Array.from({ length: max }, (_, i) => i) as i (i)}
  <i style="opacity:{i < count ? 1 : 0.16}"></i>
{/each}
