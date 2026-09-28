<script lang="ts" generics="T extends string">
  /** Selecteur segmente de la maquette (.seg), en groupe de boutons a bascule. */
  let {
    options,
    value,
    onchange,
    label,
    class: className = '',
    style,
    buttonStyle,
  }: {
    options: readonly { value: T; label: string }[];
    value: T;
    onchange: (value: T) => void;
    label: string;
    class?: string | undefined;
    style?: string | undefined;
    buttonStyle?: string | undefined;
  } = $props();
</script>

<fieldset class="seg {className}" {style}>
  <legend>{label}</legend>
  {#each options as option (option.value)}
    <button
      type="button"
      class:on={option.value === value}
      aria-pressed={option.value === value}
      style={buttonStyle}
      onclick={() => onchange(option.value)}
    >
      {option.label}
    </button>
  {/each}
</fieldset>

<style>
  fieldset {
    margin: 0;
    padding: 0;
    min-inline-size: 0;
  }

  legend {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
