<script lang="ts">
  import { type ActiveWeaponId, damageMatrix, weaponById } from '@nova/data';
  import Panel from '../../ui/Panel.svelte';

  /** Matrice de degats croises (renderAtlas, lignes 1346-1358 ; CSS 323-328). */
  const ARMES = Object.keys(damageMatrix) as ActiveWeaponId[];
  const classe = (m: number) => (m > 1 ? 'up' : m < 1 ? 'dn' : 'eq');
</script>

<Panel title="Matrice de dégâts" right="ATTAQUANT ▸ DÉFENSEUR">
  <div class="bd">
    <table class="matrix">
      <thead>
        <tr>
          <th></th>
          {#each ARMES as defenseur (defenseur)}
            {@const arme = weaponById(defenseur)}
            <th scope="col" title={arme?.label} style:color={arme?.color}>{arme?.symbol}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each ARMES as attaquant (attaquant)}
          {@const arme = weaponById(attaquant)}
          <tr>
            <th scope="row" style:color={arme?.color} style="text-align:left">{arme?.label}</th>
            {#each ARMES as defenseur (defenseur)}
              {@const m = damageMatrix[attaquant][defenseur]}
              <td class={classe(m)}>×{m.toFixed(2)}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    <div class="note">
      L'artillerie ne perd jamais gros mais ne gagne jamais gros. Le nucléaire domine le blindé
      lourd mais s'effondre face aux chasseurs légers. Équilibrage à valider en test.
    </div>
  </div>
</Panel>

<style>
  .matrix {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--f-mono);
    font-size: 10px;
  }
  .matrix th,
  .matrix td {
    border: 1px solid var(--line);
    padding: 5px 4px;
    text-align: center;
    color: var(--txt);
  }
  .matrix th {
    color: var(--muted);
    font-weight: 400;
    font-size: 9px;
    letter-spacing: 0.08em;
  }
  .matrix td.up {
    color: var(--ok);
    background: rgba(159, 209, 90, 0.07);
  }
  .matrix td.dn {
    color: #ff9c8f;
    background: rgba(232, 84, 63, 0.07);
  }
  .matrix td.eq {
    color: var(--muted);
  }
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.55;
    margin-top: 10px;
  }
</style>
