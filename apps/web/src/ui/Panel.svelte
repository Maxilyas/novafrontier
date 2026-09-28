<script lang="ts">
  import type { Snippet } from 'svelte';

  /** Panneau a coins coupes de la maquette (.panel.notched), avec son en-tete .hd. */
  let {
    title,
    right,
    rightStyle,
    headerExtra,
    class: className = '',
    style,
    children,
  }: {
    title?: string | undefined;
    right?: string | undefined;
    rightStyle?: string | undefined;
    headerExtra?: Snippet | undefined;
    class?: string | undefined;
    style?: string | undefined;
    children?: Snippet | undefined;
  } = $props();
</script>

<div class="panel notched {className}" {style} data-panel>
  {#if title !== undefined}
    <div class="hd">
      <span class="dot"></span><span>{title}</span>
      {@render headerExtra?.()}
      {#if right !== undefined}<span class="rt" style={rightStyle}>{right}</span>{/if}
    </div>
  {/if}
  {@render children?.()}
</div>
