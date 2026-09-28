<script lang="ts">
  import { type ActiveWeaponId, type Weapon, weaponById, weapons } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import WeaponGlyph from '../../ui/art/WeaponGlyph.svelte';
  import Panel from '../../ui/Panel.svelte';

  /**
   * Skins d'armement (renderAtlas, lignes 1325-1345 ; CSS 316-322) : les armements actifs se
   * choisissent, les armements prevus restent grises.
   */
  const estActif = (w: Weapon): w is Weapon & { id: ActiveWeaponId } => w.status === 'active';
  const actifs = weapons.filter(estActif);
  const prevus = weapons.filter((w) => !estActif(w));

  const profil = $derived(weaponById(selection.current.atlas.weapon)?.profile);
</script>

<Panel title="Skins d'armement" right="{actifs.length} ACTIFS · {prevus.length} PRÉVUS">
  <div class="bd">
    <div class="skinrow">
      {#each actifs as arme (arme.id)}
        {@const on = arme.id === selection.current.atlas.weapon}
        <button
          type="button"
          class="skin"
          class:on
          aria-pressed={on}
          onclick={() => selection.setAtlasWeapon(arme.id)}
        >
          <span class="sv"><WeaponGlyph weapon={arme.id} color={arme.color} /></span>
          <span class="sn" style:color={arme.color}>{arme.label}</span>
          <span class="sx">fort vs {arme.strongAgainst.toLowerCase()}</span>
        </button>
      {/each}
    </div>
    <div class="skinrow" style="margin-top:9px">
      {#each prevus as arme (arme.id)}
        <div class="skin prevu">
          <span class="sv"><WeaponGlyph weapon={arme.id} color={arme.color} /></span>
          <span class="sn" style:color={arme.color}>{arme.label}</span>
          <span class="sx">non ouvert</span>
        </div>
      {/each}
      <div class="skin extension"><span class="sx">extension<br />trinité → 5</span></div>
    </div>
    <div class="note">{profil}</div>
  </div>
</Panel>

<style>
  .skinrow {
    display: flex;
    gap: 9px;
  }
  .skin {
    flex: 1;
    border: 1px solid var(--line);
    background: #0b110f;
    padding: 9px;
    cursor: pointer;
    transition: 0.14s;
    position: relative;
    color: inherit;
    font: inherit;
  }
  .skin:hover {
    border-color: var(--line-hi);
  }
  .skin.on {
    border-color: var(--sig);
  }
  .skin.prevu {
    opacity: 0.4;
    pointer-events: none;
  }
  .skin.extension {
    opacity: 0.25;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sv {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sn,
  .sx {
    display: block;
  }
  .sn {
    font-size: 9px;
    letter-spacing: 0.12em;
    text-align: center;
    text-transform: uppercase;
    margin-top: 5px;
  }
  .sx {
    font-family: var(--f-mono);
    font-size: 8.5px;
    color: var(--muted);
    text-align: center;
    margin-top: 2px;
  }
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.55;
    margin-top: 11px;
  }
</style>
