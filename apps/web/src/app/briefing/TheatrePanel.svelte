<script lang="ts">
  import { selection } from '../../state/selection.svelte';
  import Panel from '../../ui/Panel.svelte';
  import Seg from '../../ui/Seg.svelte';

  /**
   * Theatre d'operation (renderBrief, lignes 1853-1865) : decision ouverte du CR, point 2. Le
   * theatre choisi fixe les unites engagees et l'intitule du Combat (FR-016, FR-017).
   */
  const THEATRES = [
    { value: 'orbital', label: 'Combat spatial' },
    { value: 'sol', label: 'Combat terrestre' },
  ] as const;
</script>

<Panel title="Théâtre d'opération" right="CR POINT 2">
  <div class="bd">
    <Seg
      label="Théâtre d'opération"
      options={THEATRES}
      value={selection.current.theatre}
      onchange={(theatre) => selection.setTheatre(theatre)}
      style="width:100%"
      buttonStyle="flex:1"
    />
    <div class="note">
      {selection.current.theatre === 'orbital'
        ? "Seuls les vaisseaux sont engagés. Emplacements libres en trois dimensions autour de l'objectif."
        : "Les mécas mènent l'assaut, les vaisseaux fournissent l'appui. Le relief bloque certaines lignes de tir."}
    </div>
  </div>
</Panel>

<style>
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.55;
    margin-top: 9px;
  }
</style>
