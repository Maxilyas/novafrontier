<script lang="ts">
  import { demoState, type IconId } from '@nova/data';
  import { LATER_PHASE_MESSAGE, showToast } from '../state/toast.svelte';
  import { nombre, pourcent } from '../ui/format';
  import Icon from '../ui/Icon.svelte';
  import MainNav from './MainNav.svelte';

  /** Bandeau superieur de la maquette (lignes 671-713, CSS 148-188), present sur les 9 ecrans. */

  const { profile, resources, pendingIncome } = demoState;
  const uid = $props.id();

  const RESSOURCES: { icon: IconId; color: string; label: string; value: number }[] = [
    { icon: 'ic-credits', color: '#f5a623', label: 'Crédits', value: resources.credits },
    { icon: 'ic-alloy', color: '#c9a06a', label: 'Alliage', value: resources.alloy },
    { icon: 'ic-fuel', color: '#63d6bc', label: 'Carburant', value: resources.fuel },
    { icon: 'ic-artefact', color: '#ff5fc0', label: 'Artefacts', value: resources.artefacts },
  ];
</script>

<header class="topbar">
  <div class="profile">
    <div class="avatar notched">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="avg-{uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#2c443f" />
            <stop offset="1" stop-color="#0d1615" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#avg-{uid})" />
        <path
          d="M50 20c15 0 25 10 25 25v13c0 6-5 9-8 11l-2 11H35l-2-11c-3-2-8-5-8-11V45c0-15 10-25 25-25z"
          fill="#182421"
          stroke="#63d6bc"
          stroke-width="2"
        />
        <path d="M31 45h38v13c0 4-4 7-8 7H39c-4 0-8-3-8-7z" fill="#63d6bc" opacity=".8" />
        <path d="M43 72h14l-2 9H45z" fill="#243330" stroke="#63d6bc" stroke-width="1" />
      </svg>
      <div class="rank">{profile.badge}</div>
    </div>
    <div>
      <div class="pname">{profile.name}</div>
      <div class="prank">{profile.rank} · {profile.wing}</div>
      <div class="xp"><i style="width:{pourcent(profile.xpProgress)}"></i></div>
      <div class="xpl">
        <span>NIVEAU {profile.level}</span>
        <span>ULTIME SUIVANT · <b>NIV {profile.nextUltimateLevel}</b></span>
      </div>
    </div>
  </div>

  <MainNav />

  <div class="resbar">
    {#each RESSOURCES as ressource (ressource.icon)}
      <div class="res">
        <Icon icon={ressource.icon} size={18} stroke={ressource.color} />
        <div>
          <div class="v">{nombre(ressource.value)}</div>
          <div class="n">{ressource.label}</div>
        </div>
      </div>
    {/each}
    <button
      type="button"
      class="collect notched"
      data-later-phase="collect"
      onclick={() => showToast(LATER_PHASE_MESSAGE)}
    >
      <Icon icon="ic-hq" size={22} stroke="#f5a623" />
      <span>
        <span class="cl">Collecter</span>
        <span class="cn">+{nombre(pendingIncome.amount)}</span>
        <span class="cap"><i style="width:{pourcent(pendingIncome.gauge)}"></i></span>
      </span>
    </button>
  </div>
</header>

<style>
  .topbar {
    position: relative;
    z-index: 60;
    display: flex;
    align-items: stretch;
    background: linear-gradient(180deg, #141c19, #0a100e);
    border-bottom: 1px solid var(--line-hi);
  }
  .profile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    border-right: 1px solid var(--line);
    min-width: 318px;
  }
  .avatar {
    width: 54px;
    height: 54px;
    position: relative;
    flex: 0 0 auto;
    border: 1px solid var(--sig-dim);
    background: linear-gradient(160deg, #1c2b28, #0a100f);
    --notch: 6px;
    overflow: hidden;
  }
  .avatar svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .rank {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--sig);
    color: #04120f;
    font-size: 9px;
    padding: 1px 4px;
    letter-spacing: 0.08em;
  }
  .pname {
    font-size: 16px;
    letter-spacing: 0.14em;
    color: var(--paper);
    white-space: nowrap;
  }
  .prank {
    font-size: 9.5px;
    letter-spacing: 0.18em;
    color: var(--muted);
    text-transform: uppercase;
    margin: 2px 0 5px;
  }
  .xp {
    width: 196px;
    height: 7px;
    background: #0a0f0e;
    border: 1px solid var(--line-hi);
    position: relative;
    overflow: hidden;
  }
  .xp i {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, var(--sig-dim), var(--sig));
  }
  .xpl {
    display: flex;
    justify-content: space-between;
    width: 196px;
    margin-top: 3px;
    font-family: var(--f-mono);
    font-size: 8.5px;
    color: var(--muted);
  }
  .xpl b {
    color: var(--gold);
    font-weight: 400;
  }

  /* ressources : 4 au lieu de 8 (CR point 9) */
  .resbar {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0;
    padding-right: 14px;
  }
  .res {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 15px;
    border-left: 1px solid var(--line);
    height: 100%;
  }
  .res :global(svg) {
    flex: 0 0 auto;
  }
  .res .v {
    font-family: var(--f-mono);
    font-size: 14px;
    color: var(--paper);
    line-height: 1;
  }
  .res .n {
    font-size: 8px;
    letter-spacing: 0.14em;
    color: var(--muted);
    text-transform: uppercase;
    margin-top: 3px;
  }
  .collect {
    margin-left: 14px;
    align-self: center;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 12px;
    border: 1px solid rgba(245, 166, 35, 0.45);
    background: rgba(245, 166, 35, 0.07);
    cursor: pointer;
    --notch: 5px;
    transition: 0.14s;
    text-align: left;
  }
  .collect:hover {
    background: rgba(245, 166, 35, 0.18);
    box-shadow: 0 0 18px rgba(245, 166, 35, 0.18);
  }
  .collect > span,
  .collect span span {
    display: block;
  }
  .collect .cl {
    font-size: 10px;
    letter-spacing: 0.18em;
    color: var(--gold);
    text-transform: uppercase;
  }
  .collect .cn {
    font-family: var(--f-mono);
    font-size: 13px;
    color: var(--paper);
    margin-top: 2px;
  }
  .collect .cap {
    width: 78px;
    height: 4px;
    background: #0a0f0e;
    border: 1px solid rgba(245, 166, 35, 0.3);
    position: relative;
    margin-top: 4px;
  }
  .collect .cap i {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: var(--gold);
  }
</style>
