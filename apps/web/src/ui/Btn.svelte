<script lang="ts">
  import type { Snippet } from 'svelte';
  import { LATER_PHASE_MESSAGE, showToast } from '../state/toast.svelte';

  /**
   * Bouton de la maquette (.btn.notched). Avec `href`, c'est un lien (commande de parcours).
   * Avec `laterPhase`, c'est une commande d'une phase ulterieure : elle garde son apparence et
   * affiche le message bref, sans rien modifier (FR-018, research R12).
   */
  let {
    variant = '',
    href,
    disabled = false,
    laterPhase,
    onclick,
    class: className = '',
    style,
    title,
    children,
  }: {
    variant?: '' | 'solid' | 'ghost' | 'gold' | undefined;
    href?: string | undefined;
    disabled?: boolean | undefined;
    laterPhase?: string | undefined;
    onclick?: ((event: MouseEvent) => void) | undefined;
    class?: string | undefined;
    style?: string | undefined;
    title?: string | undefined;
    children: Snippet;
  } = $props();

  function activer(event: MouseEvent) {
    if (laterPhase !== undefined) {
      showToast(LATER_PHASE_MESSAGE);
      return;
    }
    onclick?.(event);
  }
</script>

{#if href !== undefined && !disabled}
  <a class="btn notched {variant} {className}" {href} {style} {title}>{@render children()}</a>
{:else}
  <button
    type="button"
    class="btn notched {variant} {className}"
    {disabled}
    {style}
    {title}
    data-later-phase={laterPhase}
    onclick={activer}
  >
    {@render children()}
  </button>
{/if}
