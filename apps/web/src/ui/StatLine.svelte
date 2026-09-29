<script lang="ts">
  import Bar from './Bar.svelte';

  let {
    label,
    value,
    percent,
    variant = '',
  }: {
    label: string;
    value: string | number;
    percent: number;
    variant?: '' | 'k' | 'r' | 'g' | undefined;
  } = $props();
</script>

<div class="sline">
  <span class="lb">{label}</span>
  <Bar value={percent} {variant} />
  <span class="vv">{value}</span>
</div>
