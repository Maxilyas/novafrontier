<script lang="ts">
  import { launchPool, rarityById, unitById } from '@nova/data';
  import Panel from '../../ui/Panel.svelte';
  import UnitCard from '../../ui/UnitCard.svelte';

  /**
   * Pool de lancement (renderButin, lignes 2407-2421 ; CSS 595-603) : cartes obtenables par rarete,
   * puis les cases des paliers pas encore ouverts.
   */
  const abrege = (libelle: string) =>
    libelle.length > 7 ? `${libelle.slice(0, 6)}.` : libelle;
</script>

<Panel
  title="Pool de lancement"
  right="PALIERS ÉPIQUE ET LÉGENDAIRE NON OUVERTS — TIRAGES CONVERTIS EN FRAGMENTS"
  class="pool"
>
  <div class="poolgrid">
    {#each launchPool.groups as groupe, g (groupe.rarity)}
      {@const rarete = rarityById(groupe.rarity)}
      <div class="grp">
        <span class="gl" style:color={rarete?.color}>{groupe.label}</span>
        <span class="gr" style:background="{rarete?.color}33"></span>
        <span class="gc">{groupe.units.length} obtenues</span>
      </div>
      {#each groupe.units as id (id)}
        {@const unite = unitById(id)}
        {#if unite}<UnitCard unit={unite} size="mini" />{/if}
      {/each}
      {#if g === launchPool.groups.length - 1}
        <div class="separation"></div>
        {#each launchPool.locked as verrou, q (q)}
          {@const palier = rarityById(verrou)}
          <div class="card mini notched verrou" style="--notch:5px;--rc:{palier?.color}">
            <div class="inconnu">
              <span style="font-size:20px">?</span>
              <span style="font-size:6.5px;letter-spacing:.14em">
                {abrege(palier?.label.toUpperCase() ?? '')}
              </span>
            </div>
          </div>
        {/each}
      {/if}
      <div class="fin"></div>
    {/each}
  </div>
</Panel>

<style>
  .poolgrid {
    display: flex;
    gap: 9px;
    padding: 13px;
    flex-wrap: wrap;
    align-content: flex-start;
    overflow-y: auto;
  }
  .poolgrid::-webkit-scrollbar {
    width: 5px;
  }
  .poolgrid::-webkit-scrollbar-thumb {
    background: var(--line-hi);
  }
  .grp {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    margin: 2px 0 4px;
  }
  .gl {
    font-size: 9.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .gr {
    flex: 1;
    height: 1px;
  }
  .gc {
    font-family: var(--f-mono);
    font-size: 9px;
    color: var(--muted);
  }
  .separation {
    width: 1px;
    height: 102px;
    background: var(--line);
    margin: 0 10px;
  }
  .verrou {
    opacity: 0.32;
    cursor: default;
  }
  .inconnu {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    color: #556059;
  }
  .fin {
    width: 100%;
    height: 5px;
  }
</style>
