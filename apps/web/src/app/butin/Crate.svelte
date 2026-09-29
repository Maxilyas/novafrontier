<script lang="ts">
  import { type Crate, rarityById } from '@nova/data';
  import { LATER_PHASE_MESSAGE, showToast } from '../../state/toast.svelte';
  import Icon from '../../ui/Icon.svelte';

  /**
   * Coffre (renderButin, lignes 2391-2406 ; CSS 578-594) : taux par rarete, delai et appel a
   * l'action. Ouvrir ou acheter un coffre releve d'une phase ulterieure (FR-018).
   */
  let { crate }: { crate: Crate } = $props();

  /** Couleurs de la maquette par type de coffre : icone, fond et texte de l'appel a l'action. */
  const TEINTES = {
    free: { icone: '#63d6bc', fond: 'rgba(99,214,188,.16)', texte: '#9ff0dd' },
    week: { icone: '#f5a623', fond: 'rgba(245,166,35,.14)', texte: '#f5a623' },
    prem: { icone: '#ff5fc0', fond: 'rgba(255,95,192,.12)', texte: '#ff5fc0' },
  } as const;
  const teinte = $derived(TEINTES[crate.id]);
  const taux = (n: number) => `${String(n).replace('.', ',')}%`;
</script>

<div class="crate notched {crate.id}" style="--notch:8px" data-panel>
  <div class="ch">
    <Icon icon={crate.icon} size={18} stroke={teinte.icone} />
    <div>
      <div class="ct">{crate.title}</div>
      <div class="tiny" style="margin-top:2px">{crate.subtitle}</div>
    </div>
  </div>
  <div class="cb">
    <div class="odds">
      {#each crate.odds as ligne (ligne.rarity)}
        {@const rarete = rarityById(ligne.rarity)}
        <div class="orow">
          <span class="on" style:color={rarete?.color}>{rarete?.label}</span>
          <span class="ob"><i style="width:{ligne.percent}%;background:{rarete?.color}"></i></span>
          <span class="ov">{taux(ligne.percent)}</span>
        </div>
      {/each}
    </div>
  </div>
  <div class="cd"><div class="tiny">{crate.availability}</div></div>
  <button
    type="button"
    class="cta"
    style:background={teinte.fond}
    style:color={teinte.texte}
    data-later-phase="open-crate"
    onclick={() => showToast(LATER_PHASE_MESSAGE)}
  >
    {crate.cta}
  </button>
</div>

<style>
  .crate {
    width: 262px;
    position: relative;
    cursor: pointer;
    transition: 0.2s;
    border: 1px solid var(--line-hi);
    background: linear-gradient(180deg, #161d18, #0a0e0d);
    display: flex;
    flex-direction: column;
  }
  .crate:hover {
    transform: translateY(-5px);
  }
  .crate.free {
    border-color: var(--sig-dim);
  }
  .crate.week {
    border-color: rgba(245, 166, 35, 0.55);
  }
  .crate.prem {
    border-color: rgba(255, 95, 192, 0.45);
  }
  .ch {
    padding: 9px 12px;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ct {
    font-size: 11px;
    letter-spacing: 0.18em;
    color: var(--paper);
    text-transform: uppercase;
  }
  .cb {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    position: relative;
  }
  .cd {
    padding: 9px 12px;
    border-top: 1px solid var(--line);
  }
  .odds {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .orow {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: var(--f-mono);
    font-size: 9.5px;
  }
  .on {
    width: 74px;
    letter-spacing: 0.06em;
  }
  .ob {
    flex: 1;
    height: 5px;
    background: #0a0f0e;
    position: relative;
  }
  .ob i {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
  }
  .ov {
    width: 38px;
    text-align: right;
    color: var(--paper);
  }
  .cta {
    padding: 9px 12px;
    text-align: center;
    font-size: 10.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    border: 0;
    border-top: 1px solid var(--line);
    cursor: pointer;
  }
  .cta:focus-visible {
    outline-offset: -3px;
  }
</style>
