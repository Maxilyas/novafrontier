<script lang="ts">
  import { toast } from '../state/toast.svelte';
</script>

<div role="status" aria-live="polite">
  {#if toast.current}
    {#key toast.current.seq}
      <div class="toast">{toast.current.text}</div>
    {/key}
  {/if}
</div>
