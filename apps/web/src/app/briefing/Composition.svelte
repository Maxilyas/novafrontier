<script lang="ts">
  import {
    type Combatant,
    demoState,
    derivedValues,
    unitById,
    weaponById,
  } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import { nombre } from '../../ui/format';
  import Icon from '../../ui/Icon.svelte';
  import KeyValue from '../../ui/KeyValue.svelte';
  import Panel from '../../ui/Panel.svelte';
  import UnitCard from '../../ui/UnitCard.svelte';

  /**
   * Composition envoyee (renderBrief, lignes 1847-1878) : unites de l'escouade choisie, contrainte
   * de mission et rapport de forces de `derivedValues.briefing` (FR-013, FR-017).
   */
  const adverse = weaponById(demoState.mission.enemy.weapon);

  const escouade = $derived(demoState.squads.find((s) => s.id === selection.current.squad));
  const valeurs = $derived(derivedValues.briefing[selection.current.squad]);
  const dominante = $derived(weaponById(derivedValues.squads[selection.current.squad].dominantWeapon));
  const unites = $derived(
    [...(escouade?.ships ?? []), ...(escouade?.mechs ?? [])]
      .map((id) => (id ? unitById(id) : undefined))
      .filter((u): u is Combatant => u !== undefined && u.family !== 'cmd'),
  );
  const avantage = $derived(
    valeurs.advantage > 1 ? 'var(--ok)' : valeurs.advantage < 1 ? 'var(--warn)' : 'var(--muted)',
  );
</script>

<Panel
  title="Composition envoyée"
  right={escouade?.name.toUpperCase()}
  class="composition"
>
  <div class="compo">
    {#each unites as unite (unite.id)}<UnitCard unit={unite} size="mini" />{/each}
  </div>
  <div class="bd" style="border-top:1px solid var(--line)">
    <div class="constraint" class:ok={valeurs.constraintMet}>
      <span class="ci">
        <Icon
          icon="ic-shield"
          size={18}
          stroke={valeurs.constraintMet ? '#9fd15a' : 'currentColor'}
          strokeWidth={1.4}
        />
      </span>
      <div class="ct">
        Contrainte de mission : au moins 2 unités de blindage moyen ou lourd.
        {valeurs.constraintMet
          ? `Composition conforme (${valeurs.armoredUnits}).`
          : `La composition actuelle n'en compte que ${valeurs.armoredUnits} — l'assaut échouera.`}
      </div>
    </div>
    <KeyValue label="Puissance envoyée" value={nombre(valeurs.sentPower)} valueClass="ok" />
    <KeyValue label="Puissance adverse estimée" value={nombre(valeurs.enemyPower)} />
    <KeyValue
      label="Armement dominant"
      value={dominante?.label}
      valueStyle="color:{dominante?.color}"
    />
    <KeyValue
      label="Avantage de trinité"
      value="×{valeurs.advantage.toFixed(2)} vs {adverse?.label}"
      valueStyle="color:{avantage}"
    />
  </div>
</Panel>

<style>
  .compo {
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
    padding: 11px;
  }
  .constraint {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    padding: 10px 12px;
    margin-bottom: 11px;
    border: 1px solid rgba(232, 84, 63, 0.4);
    background: rgba(232, 84, 63, 0.06);
  }
  .constraint.ok {
    border-color: rgba(159, 209, 90, 0.4);
    background: rgba(159, 209, 90, 0.05);
  }
  .ci {
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    color: var(--warn);
  }
  .ct {
    font-size: 10.5px;
    line-height: 1.5;
    color: #ffb9ae;
  }
  .constraint.ok .ct {
    color: #c9e6a3;
  }
</style>
