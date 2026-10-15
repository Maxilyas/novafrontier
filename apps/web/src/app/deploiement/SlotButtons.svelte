<script lang="ts">
  import { type Combatant, combatTuning, rarityById, unitById, weaponById } from '@nova/data';
  import { formationSlots, type Slot } from '@nova/sim';
  import { fitInto, toZone } from '../../scene/scenes/fit';
  import { deployment } from '../../state/deployment.svelte';
  import { occupant } from '../../state/deployment-rules';
  import { selection } from '../../state/selection.svelte';
  import { glissable } from './glisser';

  /**
   * Emplacements du plateau (FR-037 a FR-039, FR-043, contracts/scenes.md, research R18) : un
   * bouton par emplacement propose, pose sur la scene a la position de l'emplacement. Libre, il
   * prend la couleur de son type (vaisseau ou meca) ; occupe, il montre l'unite comme la maquette
   * (drawDeploy, lignes 2047-2068). Les textes du plateau sont ici, en DOM (principe III).
   */
  const F = 65536;
  const PLATEAU = combatTuning.board;

  let largeur = $state(0);
  let hauteur = $state(0);
  let zone: HTMLDivElement;

  const formation = $derived(selection.current.formation[selection.current.squad]);
  const theatre = $derived(selection.current.theatre);
  const slots = $derived(formationSlots(formation, theatre));
  const fit = $derived(fitInto(PLATEAU, { width: largeur || 1, height: hauteur || 1 }));
  const placement = $derived(deployment.current);
  const choisie = $derived(deployment.picked);
  const objectif = $derived(PLATEAU.objective[formation]);

  const position = (x: number, y: number) => toZone(fit, x, y);
  const uniteDe = (rang: number) => {
    const id = occupant(placement, rang);
    const u = id ? unitById(id) : undefined;
    return u && u.family !== 'cmd' ? (u as Combatant) : undefined;
  };
  const nomCourt = (nom: string) => nom.split(' ')[0] ?? nom;
  const ligne = (s: Slot) => (s.line === 'front' ? 'première ligne' : 'seconde ligne');
  const type = (s: Slot) => (s.kind === 'ship' ? 'vaisseau' : 'méca');

  /** Pendant un choix, un emplacement libre de l'autre type ne se designe pas. */
  const inactif = (s: Slot) =>
    choisie !== null && occupant(placement, s.index) === undefined && !deployment.canPlace(s.index);

  /** Fleches : emplacement designable suivant ou precedent (FR-043). */
  function clavier(e: KeyboardEvent) {
    const sens = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (sens === undefined) return;
    e.preventDefault();
    const boutons = [...zone.querySelectorAll<HTMLButtonElement>('[data-slot]')].filter(
      (b) => b.getAttribute('aria-disabled') !== 'true',
    );
    const i = boutons.indexOf(e.currentTarget as HTMLButtonElement);
    boutons[(i + sens + boutons.length) % boutons.length]?.focus();
  }

  const glisse = $derived(deployment.dragging ? unitById(deployment.dragging.unit) : undefined);
</script>

<div class="slots" bind:this={zone} bind:clientWidth={largeur} bind:clientHeight={hauteur}>
  {#if largeur > 0}
    {@const arrivees = position(18, 26)}
    {@const sousRelique = position(objectif.x, objectif.y + 70)}
    <div class="txt arrivees" style:left="{arrivees.x}px" style:top="{arrivees.y}px">
      {formation === 'ring' ? 'ARRIVÉES ENNEMIES — 360°' : 'ARRIVÉES ENNEMIES — BORD OUEST'}
    </div>
    <div class="txt relique" style:left="{sousRelique.x}px" style:top="{sousRelique.y}px">
      RELIQUE — OBJECTIF
    </div>

    {#each slots as slot (slot.index)}
      {@const p = position(slot.board.x / F, slot.board.y / F)}
      {@const unite = uniteDe(slot.index)}
      {@const arme = unite ? weaponById(unite.weapon) : undefined}
      <button
        type="button"
        class="slot {slot.kind} {slot.line}"
        class:occupe={unite !== undefined}
        class:valide={choisie !== null && deployment.canPlace(slot.index)}
        style:left="{p.x}px"
        style:top="{p.y}px"
        style:--s={fit.scale}
        data-slot={slot.index}
        data-slot-kind={slot.kind}
        data-slot-line={slot.line}
        data-slot-unit={unite?.id}
        aria-disabled={inactif(slot)}
        tabindex={inactif(slot) ? -1 : 0}
        aria-label="Emplacement {type(slot)}, {ligne(slot)}, {unite ? `occupé par ${unite.name}` : 'libre'}"
        onclick={() => {
          if (!inactif(slot)) deployment.activateSlot(slot.index);
        }}
        onkeydown={clavier}
        use:glissable={unite ? { unit: unite.id, from: slot.index } : null}
      >
        <svg viewBox="-28 -25 56 50" aria-hidden="true">
          <polygon points="27,0 13.5,20.8 -13.5,20.8 -27,0 -13.5,-20.8 13.5,-20.8" />
        </svg>
        {#if unite}
          <span class="nom" style:color={rarityById(unite.rarity)?.color}>{nomCourt(unite.name)}</span>
          <span class="arme" style:background={arme?.color}></span>
          <span class="pv">{unite.count > 1 ? `×${unite.count} · ` : ''}{unite.stats.hp}PV</span>
          <span class="marque">{slot.line === 'front' ? '1L' : '2L'}</span>
        {:else}
          <span class="plus">+</span>
        {/if}
      </button>
    {/each}

    {#if choisie}
      <div class="aide" role="status">
        ▸ CLIQUEZ UN EMPLACEMENT POUR PLACER {unitById(choisie)?.name}
      </div>
    {/if}
  {/if}
</div>

{#if deployment.dragging && glisse}
  <div
    class="fantome"
    style:left="{deployment.dragging.x}px"
    style:top="{deployment.dragging.y}px"
    aria-hidden="true"
  >
    {glisse.name}
  </div>
{/if}

<style>
  .slots {
    position: absolute;
    inset: 0;
    z-index: 2;
  }
  .txt {
    position: absolute;
    font-family: var(--f-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    pointer-events: none;
    white-space: nowrap;
  }
  .arrivees {
    color: rgba(232, 84, 63, 0.7);
    transform: translateY(-80%);
  }
  .relique {
    color: var(--gold);
    transform: translate(-50%, -80%);
  }
  .slot {
    --kind: var(--slot-ship);
    --trait: var(--kind);
    position: absolute;
    width: calc(56px * var(--s));
    height: calc(50px * var(--s));
    transform: translate(-50%, -50%);
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: calc(2px * var(--s));
    touch-action: none;
  }
  .slot.mech {
    --kind: var(--slot-mech);
  }
  /* Occupe : contour de la couleur de sa ligne, comme la maquette. */
  .slot.occupe.front {
    --trait: #e8543f;
  }
  .slot.occupe.back {
    --trait: #63d6bc;
  }
  .slot[aria-disabled='true'] {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .slot svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .slot polygon {
    fill: color-mix(in srgb, var(--kind) 12%, transparent);
    stroke: var(--trait);
    stroke-width: 1.2;
    stroke-opacity: 0.75;
  }
  .slot.occupe polygon {
    fill: rgba(10, 16, 15, 0.92);
    stroke-width: 1.6;
    stroke-opacity: 1;
  }
  .slot.valide polygon {
    stroke-width: 2.4;
    stroke-opacity: 1;
    filter: drop-shadow(0 0 6px var(--kind));
  }
  .slot:focus-visible polygon {
    stroke: var(--paper);
    stroke-width: 2.4;
    stroke-opacity: 1;
  }
  .slot > span {
    position: relative;
    line-height: 1;
    pointer-events: none;
  }
  .plus {
    font-family: var(--f-mono);
    font-size: max(10px, calc(15px * var(--s)));
    color: var(--kind);
  }
  .nom {
    font-family: var(--f-head);
    font-size: max(7px, calc(9px * var(--s)));
  }
  .arme {
    width: calc(26px * var(--s));
    height: 2px;
  }
  .pv {
    font-family: var(--f-mono);
    font-size: max(6.5px, calc(8px * var(--s)));
    color: var(--txt);
  }
  .slot > .marque {
    position: absolute;
    right: calc(-4px * var(--s));
    top: calc(-6px * var(--s));
    width: calc(16px * var(--s));
    height: calc(16px * var(--s));
    border-radius: 50%;
    background: #0a100f;
    border: 1px solid var(--trait);
    color: var(--trait);
    font-family: var(--f-mono);
    font-size: max(6px, calc(8px * var(--s)));
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .aide {
    position: absolute;
    left: 18px;
    bottom: 14px;
    font-family: var(--f-mono);
    font-size: 11px;
    color: rgba(99, 214, 188, 0.85);
    pointer-events: none;
  }
  .fantome {
    position: fixed;
    z-index: 300;
    transform: translate(-50%, -120%);
    padding: 3px 8px;
    border: 1px solid var(--sig);
    background: rgba(10, 16, 15, 0.92);
    font-family: var(--f-head);
    font-size: 10px;
    color: var(--paper);
    pointer-events: none;
    white-space: nowrap;
  }
</style>
