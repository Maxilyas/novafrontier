<script lang="ts">
  import { derivedValues, rarities, weaponById } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import { nombre } from '../../ui/format';
  import OpenBadge from '../../ui/OpenBadge.svelte';
  import Panel from '../../ui/Panel.svelte';
  import Seg from '../../ui/Seg.svelte';
  import StatLine from '../../ui/StatLine.svelte';
  import MiniFormation from './MiniFormation.svelte';

  /**
   * Synthese d'escouade (renderSummary, lignes 1180-1235). Les valeurs viennent de
   * `derivedValues.squads` ; les barres gardent les echelles de la maquette. Points d'action et
   * formation sont des decisions ouvertes ("a trancher") qui basculent l'affichage (FR-016).
   */
  const MODES = [
    { value: 'fixe', label: 'Fixes' },
    { value: 'achat', label: 'Achetables' },
  ] as const;
  const FORMATIONS = [
    { value: 'ring', label: '360°' },
    { value: 'arc', label: 'Arc' },
  ] as const;
  /** "Commun 2 · Rare 3 · ..." : la rarete divine ajoute le slot legendaire, pas de point. */
  const BAREME = rarities
    .filter((r) => !r.legendarySlot)
    .map((r) => `${r.label} ${r.actionPoints}`)
    .join(' · ');

  const valeurs = $derived(derivedValues.squads[selection.current.squad]);
  const dominante = $derived(weaponById(valeurs.dominantWeapon));
  const formation = $derived(selection.current.formation[selection.current.squad]);
  const fixes = $derived(selection.current.actionPointsMode === 'fixe');
</script>

<Panel title="Synthèse d'escouade" right="{valeurs.unitCount} UNITÉS" class="sumry">
  <div class="bd corps">
    <StatLine
      label="PV totaux"
      variant="k"
      percent={Math.min(100, valeurs.totalHp / 90)}
      value={nombre(valeurs.totalHp)}
    />
    <StatLine
      label="Attaque"
      variant="r"
      percent={Math.min(100, valeurs.totalAttack / 16)}
      value={nombre(valeurs.totalAttack)}
    />
    <StatLine label="Défense moy." percent={valeurs.averageDefense} value={valeurs.averageDefense} />

    <div class="tiny" style="margin:16px 0 7px">Composition d'armement</div>
    {#each valeurs.weaponMix as part (part.weapon)}
      {@const arme = weaponById(part.weapon)}
      <div class="trin">
        <span class="ic" style:color={arme?.color} style:border-color={arme?.color}>
          {arme?.symbol}
        </span>
        <span style="font-size:10.5px;color:var(--paper)">{arme?.label}</span>
        <span class="nb">{part.percent}%</span>
      </div>
    {/each}
    <div class="dominante">
      <div class="tiny">Dominante</div>
      <div class="dom-ligne">
        <span class="dom-ic" style:color={dominante?.color} style:border-color={dominante?.color}>
          {dominante?.symbol}
        </span>
        <span style="font-size:11px;color:var(--paper)">{dominante?.label}</span>
      </div>
      <div class="note" style="margin-top:6px">{dominante?.profile}</div>
    </div>

    <div class="tiny" style="margin:16px 0 7px">Points d'action</div>
    <div class="toggle" style="padding:0 0 9px">
      <div>
        <div class="tt">{fixes ? 'Fixes par rareté' : 'Achetables en jeu'}</div>
        <div class="td">
          {fixes ? BAREME : 'Base 2 pour tous, +1 par palier acheté (crédits ou recherche)'}
        </div>
      </div>
    </div>
    <Seg
      label="Points d'action"
      options={MODES}
      value={selection.current.actionPointsMode}
      onchange={(mode) => selection.setActionPointsMode(mode)}
      style="width:100%"
      buttonStyle="flex:1"
    />
    <div style="margin-top:8px">
      <OpenBadge title="Débat non tranché en réunion">À trancher · point 3 du CR</OpenBadge>
    </div>

    <div class="tiny" style="margin:16px 0 7px">Formation par défaut</div>
    <MiniFormation {formation} />
    <Seg
      label="Formation par défaut"
      options={FORMATIONS}
      value={formation}
      onchange={(choix) => selection.setFormation(choix)}
      style="width:100%;margin-top:7px"
      buttonStyle="flex:1"
    />
    <div class="note" style="margin-top:8px">
      Blindés en première ligne, unités à portée derrière. Modifiable avant chaque mission.
    </div>
  </div>
</Panel>

<style>
  .corps {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  .dominante {
    margin-top: 8px;
    padding: 8px;
    border: 1px solid var(--line);
    background: #0b110f;
  }
  .dom-ligne {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .dom-ic {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid;
    font-family: var(--f-mono);
    font-size: 10px;
  }
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.5;
  }
</style>
