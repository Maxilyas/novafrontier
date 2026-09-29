<script lang="ts">
  import {
    type Combatant,
    demoState,
    derivedValues,
    rarityById,
    type UnitFamily,
    unitById,
    weaponById,
  } from '@nova/data';
  import { selection } from '../../state/selection.svelte';
  import { nombre } from '../../ui/format';
  import Icon from '../../ui/Icon.svelte';
  import Panel from '../../ui/Panel.svelte';
  import Pill from '../../ui/Pill.svelte';
  import UnitCard from '../../ui/UnitCard.svelte';

  /**
   * Plateau de l'escouade (renderBoard, lignes 1117-1161 ; CSS 270-280). Retirer une unite releve
   * d'une phase ulterieure (FR-018) ; un emplacement vide filtre les effectifs sur sa famille.
   */
  const escouade = $derived(demoState.squads.find((s) => s.id === selection.current.squad));
  const valeurs = $derived(derivedValues.squads[selection.current.squad]);
  const commandant = $derived.by(() => {
    const unite = escouade?.commander ? unitById(escouade.commander) : undefined;
    return unite?.family === 'cmd' ? unite : undefined;
  });
  const rarete = $derived(commandant ? rarityById(commandant.rarity) : undefined);
  const actions = $derived(rarete?.actionPoints ?? 0);

  const combattant = (id: string | null): Combatant | undefined => {
    const unite = id ? unitById(id) : undefined;
    return unite?.family === 'cmd' ? undefined : unite;
  };
</script>

{#snippet emplacement(famille: UnitFamily, libelle: string)}
  <button
    type="button"
    class="slot mid notched"
    style="--notch:6px"
    onclick={() => selection.pickEmptySlot(famille)}
  >
    <span class="plus">+</span><span class="sl">{libelle}</span>
  </button>
{/snippet}

<Panel
  title={escouade?.name}
  right="PUISSANCE {nombre(valeurs.power)} · ARMEMENT DOMINANT {weaponById(
    valeurs.dominantWeapon,
  )?.label.toUpperCase()}"
  class="board"
>
  <div class="rangees">
    <div class="brow">
      <div class="lbl">
        <div class="t">Commandant</div>
        <div class="d">Détermine les points d'action et les bonus d'escadre.</div>
        <div class="acts" title="Points d'action">
          {#each [0, 1, 2, 3, 4, 5] as i (i)}
            <i class={i < actions ? 'f' : i < 5 ? '' : 'locked'}></i>
          {/each}
        </div>
        <div class="tiny" style="margin-top:5px">
          {commandant ? `${rarete?.label} — ${actions} actions` : 'aucun'}
        </div>
      </div>
      {#if commandant}
        <UnitCard unit={commandant} size="mid" laterPhase="unassign-unit" />
        <div class="competences">
          <div class="tiny">Compétences actives</div>
          <div class="skills">
            {#each commandant.skills as competence, j (competence.name)}
              <div class="skill" class:off={j >= actions}>
                <Icon icon={competence.icon} size={18} stroke={j < actions ? '#f5a623' : '#4d574f'} />
                <div class="sk-n">{competence.name}</div>
                <div class="sk-d">{competence.description}</div>
              </div>
            {/each}
            {#if commandant.legendarySkill}
              <div class="slot leg skill-leg">
                <Icon icon="ic-ult" size={18} stroke="#f5a623" />
                <div class="leg-n">{commandant.legendarySkill.name}</div>
                <div class="leg-d">Slot légendaire — arbre Commandement</div>
              </div>
            {/if}
          </div>
          <div class="pillrow" style="margin-top:9px">
            {#each commandant.squadBonuses as bonus (bonus)}<Pill variant="k">{bonus}</Pill>{/each}
          </div>
        </div>
      {:else}
        {@render emplacement('cmd', 'Assigner un commandant')}
        <div class="sans-commandant">
          Aucun commandant assigné — l'escouade ne dispose d'aucun point d'action.
        </div>
      {/if}
    </div>
    <div class="brow">
      <div class="lbl">
        <div class="t">Flotte</div>
        <div class="d">
          3 emplacements. Une escadrille compte plusieurs appareils, une unité un seul.
        </div>
      </div>
      {#each escouade?.ships ?? [] as id, j (j)}
        {@const unite = combattant(id)}
        {#if unite}
          <UnitCard unit={unite} size="mid" laterPhase="unassign-unit" />
        {:else}
          {@render emplacement('ship', 'Vaisseau')}
        {/if}
      {/each}
      <div style="flex:1"></div>
    </div>
    <div class="brow">
      <div class="lbl">
        <div class="t">Force méca</div>
        <div class="d">2 emplacements. Engagée uniquement sur les combats terrestres.</div>
      </div>
      {#each escouade?.mechs ?? [] as id, j (j)}
        {@const unite = combattant(id)}
        {#if unite}
          <UnitCard unit={unite} size="mid" laterPhase="unassign-unit" />
        {:else}
          {@render emplacement('mech', 'Méca')}
        {/if}
      {/each}
      <div style="flex:1"></div>
    </div>
  </div>
</Panel>

<style>
  .rangees {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--line-hi) transparent;
  }
  .brow {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
  }
  .brow:last-child {
    border-bottom: 0;
  }
  .lbl {
    width: 104px;
    flex: 0 0 auto;
  }
  .lbl .t {
    font-size: 11px;
    letter-spacing: 0.18em;
    color: var(--paper);
    text-transform: uppercase;
  }
  .lbl .d {
    font-size: 8.5px;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-top: 3px;
    line-height: 1.4;
  }
  .acts {
    display: flex;
    gap: 4px;
    margin-top: 7px;
  }
  .acts i {
    width: 11px;
    height: 11px;
    border: 1px solid var(--gold);
    transform: rotate(45deg);
    display: block;
  }
  .acts i.f {
    background: var(--gold);
    box-shadow: 0 0 7px rgba(245, 166, 35, 0.5);
  }
  .acts i.locked {
    border-color: var(--line-hi);
  }
  .competences {
    flex: 1;
    padding-left: 6px;
  }
  .skills {
    display: flex;
    gap: 7px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .skill {
    width: 104px;
    padding: 7px;
    border: 1px solid var(--line-hi);
    background: #0b110f;
  }
  .skill.off {
    border-color: var(--line);
    opacity: 0.35;
  }
  .sk-n {
    font-size: 9px;
    letter-spacing: 0.08em;
    color: var(--paper);
    margin-top: 5px;
    line-height: 1.2;
  }
  .sk-d {
    font-size: 8px;
    color: var(--muted);
    margin-top: 3px;
    line-height: 1.35;
  }
  .skill-leg {
    width: 104px;
    padding: 7px;
    align-items: flex-start;
    justify-content: flex-start;
  }
  .leg-n {
    font-size: 9px;
    letter-spacing: 0.08em;
    color: var(--gold);
    line-height: 1.2;
    text-align: left;
  }
  .leg-d {
    font-size: 8px;
    color: var(--muted);
    line-height: 1.35;
    text-align: left;
  }
  .sans-commandant {
    flex: 1;
    padding-left: 10px;
    color: var(--muted);
    font-size: 11px;
  }
</style>
