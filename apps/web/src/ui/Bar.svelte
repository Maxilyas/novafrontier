<script lang="ts">
  /** Barre de valeur de la maquette (.bar), variantes k, r, g ; largeur en %. */
  let {
    value,
    variant = '',
    style,
  }: { value: number; variant?: '' | 'k' | 'r' | 'g' | undefined; style?: string | undefined } =
    $props();
</script>

<div class="bar {variant}" {style}><i style="width:{Math.max(0, Math.min(100, value))}%"></i></div>
