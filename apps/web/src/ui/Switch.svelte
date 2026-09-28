<script lang="ts">
  import { LATER_PHASE_MESSAGE, showToast } from '../state/toast.svelte';

  /** Interrupteur de la maquette (.sw). Avec `laterPhase`, il affiche le message bref. */
  let {
    checked,
    label,
    laterPhase,
    onchange,
  }: {
    checked: boolean;
    label: string;
    laterPhase?: string | undefined;
    onchange?: ((checked: boolean) => void) | undefined;
  } = $props();

  function basculer() {
    if (laterPhase !== undefined) {
      showToast(LATER_PHASE_MESSAGE);
      return;
    }
    onchange?.(!checked);
  }
</script>

<button
  type="button"
  role="switch"
  class="sw"
  class:on={checked}
  aria-checked={checked}
  aria-label={label}
  data-later-phase={laterPhase}
  onclick={basculer}
>
  <i></i>
</button>
