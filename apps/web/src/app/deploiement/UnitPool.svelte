<script lang="ts">
  import { demoState, rarityById } from '@nova/data';
  import { engagedUnits, formationSlots } from '@nova/sim';
  import { deployment } from '../../state/deployment.svelte';
  import { slotOf } from '../../state/deployment-rules';
  import { selection } from '../../state/selection.svelte';
  import UnitArt from '../../ui/art/UnitArt.svelte';
  import Panel from '../../ui/Panel.svelte';
  import { glissable } from './glisser';

  /**
   * Unites a placer (renderDeployPanels, lignes 2075-2104 ; CSS 509-525 ; FR-039, FR-042). Choisir
   * une unite libre la designe pour le plateau ; choisir une unite placee la retire. Chaque ligne se
   * fait aussi glisser vers un emplacement.
   */
  const escouade = $derived(demoState.squads.find((s) => s.id === selection.current.squad));
  const unites = $derived(escouade ? engagedUnits(escouade, selection.current.theatre) : []);
  const placement = $derived(deployment.current);
  const placees = $derived(unites.filter((u) => slotOf(placement, u.id) !== undefined).length);
  const spatial = $derived(selection.current.theatre === 'orbital');
  const slots = $derived(
    formationSlots(selection.current.formation[selection.current.squad], selection.current.theatre),
  );

  /** Ligne de l'emplacement occupe : la place de l'unite sur le plateau. */
  function ligneDe(unite: string): 'front' | 'back' | undefined {
    const rang = slotOf(placement, unite);
    return rang === undefined ? undefined : slots.find((s) => s.index === rang)?.line;
  }
</script>

<Panel title="Unités à placer" right="{placees}/{unites.length}" class="pool">
  <div class="upool" data-placed="{placees}/{unites.length}">
    {#each unites as unite (unite.id)}
      {@const ligne = ligneDe(unite.id)}
      <button
        type="button"
        class="urow"
        class:placed={ligne !== undefined}
        class:picked={deployment.picked === unite.id}
        data-unit={unite.id}
        aria-pressed={deployment.picked === unite.id}
        onclick={() => {
          if (ligne !== undefined) deployment.removeUnit(unite.id);
          else deployment.pick(unite.id);
        }}
        use:glissable={{ unit: unite.id, from: 'list' }}
      >
        <span class="uav" style="--rc:{rarityById(unite.rarity)?.color}"><UnitArt unit={unite} /></span>
        <span>
          <span class="un">{unite.name}</span>
          <span class="ust">
            <span class="hp">{unite.stats.hp} PV</span><span class="at"
              >{unite.stats.attack} ATQ</span
            ><span class="df">{unite.stats.defense} DÉF</span>
          </span>
        </span>
        <span class="utag {ligne ?? ''}">
          {ligne === 'back' ? '2ᵉ L.' : ligne === 'front' ? '1ʳᵉ L.' : 'À placer'}
        </span>
      </button>
    {/each}
  </div>
  <div class="bd" style="border-top:1px solid var(--line)">
    <div class="legendrow">
      <span class="sq" style="background:#e8543f"></span>Première ligne — blindage moyen et lourd
    </div>
    <div class="legendrow">
      <span class="sq" style="background:#63d6bc"></span>Seconde ligne — unités à portée
    </div>
    <div class="legendrow">
      <span class="sq hex" style="background:var(--slot-ship)"></span>Emplacement libre — vaisseau
    </div>
    {#if !spatial}
      <div class="legendrow">
        <span class="sq hex" style="background:var(--slot-mech)"></span>Emplacement libre — méca
      </div>
    {/if}
    <div class="legendrow">
      <span class="sq" style="background:#f5a623"></span>Objectif à défendre
    </div>
  </div>
</Panel>

<style>
  .upool {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 9px;
    overflow-y: auto;
    flex: 1;
  }
  .upool::-webkit-scrollbar {
    width: 5px;
  }
  .upool::-webkit-scrollbar-thumb {
    background: var(--line-hi);
  }
  .urow {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 8px;
    border: 1px solid var(--line);
    cursor: grab;
    transition: 0.14s;
    background: #0b110f;
    color: inherit;
    font: inherit;
    text-align: left;
  }
  .urow:hover {
    border-color: var(--sig-dim);
    background: rgba(99, 214, 188, 0.06);
  }
  .urow.placed {
    opacity: 0.34;
  }
  .urow.picked {
    border-color: var(--sig);
    box-shadow: 0 0 14px var(--sig-glow);
  }
  .urow {
    touch-action: none;
  }
  .uav {
    width: 30px;
    height: 38px;
    flex: 0 0 auto;
    border: 1px solid var(--rc, #3a4741);
    overflow: hidden;
    position: relative;
  }
  .uav :global(svg) {
    width: 100%;
    height: 100%;
  }
  .un,
  .ust {
    display: block;
  }
  .un {
    font-size: 10px;
    color: var(--paper);
    letter-spacing: 0.04em;
  }
  .ust {
    font-family: var(--f-mono);
    font-size: 8.5px;
    color: var(--muted);
    margin-top: 2px;
    display: flex;
    gap: 7px;
  }
  .hp {
    color: var(--ok);
  }
  .at {
    color: var(--warn);
  }
  .df {
    color: var(--sig);
  }
  .utag {
    margin-left: auto;
    font-size: 8px;
    letter-spacing: 0.1em;
    padding: 2px 5px;
    border: 1px solid var(--line-hi);
    color: var(--muted);
  }
  .utag.front {
    border-color: rgba(232, 84, 63, 0.45);
    color: #ff9c8f;
  }
  .utag.back {
    border-color: var(--sig-dim);
    color: var(--sig);
  }
  .legendrow {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 4px 0;
    font-size: 9px;
    letter-spacing: 0.1em;
    color: var(--muted);
  }
  .sq {
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
  }
  .sq.hex {
    clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
  }
</style>
