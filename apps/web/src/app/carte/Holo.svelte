<script lang="ts">
  import { basePlanet, demoState, derivedValues, planetById } from '@nova/data';
  import { toHash } from '../../state/router.svelte';
  import Btn from '../../ui/Btn.svelte';
  import { nombre } from '../../ui/format';
  import Icon from '../../ui/Icon.svelte';
  import KeyValue from '../../ui/KeyValue.svelte';

  /**
   * Hologramme de la planete visee (renderHolo, lignes 1736-1788 ; CSS 452-466). La planete visee
   * est celle de la demonstration tant que la carte n'existe pas (FR-022) ; trajet, difficulte et
   * butin viennent de `derivedValues.route`. Les trois commandes menent au Briefing (FR-005).
   */
  const planete = planetById(demoState.mission.target);
  const depart = basePlanet();
  const { route, mission } = derivedValues;
  const briefing = toHash({ screen: 'briefing' });
  const operations = (planete?.operations ?? 0) > 0;
  const assautPossible = route.inRange && operations;
  const NIVEAUX = [1, 2, 3, 4, 5];
</script>

<div class="holo notched" data-panel>
  <div class="hd">
    <span class="dot"></span><span>{planete?.name}</span>
    <span class="rt" style:color={route.inRange ? 'var(--sig)' : 'var(--warn)'}>
      {route.inRange ? 'À PORTÉE' : 'HORS PORTÉE'}
    </span>
  </div>
  <div class="hglobe">
    <div
      class="globe"
      style:background="radial-gradient(circle at 32% 28%,{planete?.colors.light},{planete?.colors
        .dark} 60%,#04080a 100%)"
      style:box-shadow="inset -30px -16px 42px rgba(0,0,0,.85),0 0 50px {planete?.colors.light}33"
    ></div>
  </div>
  <div class="corps">
    <div class="description">{planete?.description}</div>
    <div class="tiny" style="margin:11px 0 6px">Trajet depuis {depart?.name}</div>
    <KeyValue label="Distance" value="{nombre(route.distance)} UA" />
    <KeyValue
      label="Carburant requis"
      value="{nombre(route.fuelRequired)} / {nombre(route.fuelAvailable)}"
      valueStyle="color:{route.fuelRequired <= route.fuelAvailable ? 'var(--paper)' : 'var(--warn)'}"
    />
    <KeyValue label="Temps de trajet" value={route.travelTime} />
    <KeyValue label="Vitesse d'escouade" value="{route.squadSpeed} UA/h" />
    <div class="bar" style="margin-top:9px">
      <i style="width:{Math.min(100, (route.fuelRequired / route.fuelAvailable) * 100)}%"></i>
    </div>
    <div class="tiny" style="margin:14px 0 6px">Généré par la distance</div>
    <KeyValue label="Difficulté">
      <span class="jauge">
        {#each NIVEAUX as niveau (niveau)}
          <i style="opacity:{niveau <= route.difficulty ? 1 : 0.2}"></i>
        {/each}
      </span>
    </KeyValue>
    <KeyValue label="Butin estimé" value="{nombre(route.loot)} crédits" valueClass="gold" />
    <KeyValue label="Ressources" value={planete?.resources.join(' · ')} />
    <div class="note" style="margin-top:8px">
      Plus la cible est loin, plus la défense et le butin montent. Aucune colonisation : le
      territoire s'étend en prenant la planète.
    </div>
    {#if operations}
      <div class="tiny" style="margin:14px 0 4px">Opérations disponibles</div>
      <a class="misrow" href={briefing}>
        <span class="mtype"><Icon icon="ic-atk" size={14} strokeWidth={1.4} /></span>
        <span>
          <span class="mt">Assaut sur {planete?.name}</span>
          <span class="md">{mission.waves.length} VAGUES · {nombre(route.loot)} CRÉDITS</span>
        </span>
        <span class="diff">
          {#each NIVEAUX as niveau (niveau)}<i class:on={niveau <= route.difficulty}></i>{/each}
        </span>
      </a>
    {/if}
    <div class="tiny" style="margin:16px 0 6px">Renseignement</div>
    <div class="renseignement">
      <div style="display:flex;align-items:center;gap:8px">
        <Icon icon="ic-spy" size={16} stroke="#6d7972" />
        <span style="font-size:10px;color:var(--muted)">Composition adverse inconnue</span>
      </div>
      <div class="note" style="margin-top:7px">
        L'espionnage révèle le nombre de vagues, leur composition et l'armement dominant. Sans lui,
        la simulation reste approximative.
      </div>
    </div>
  </div>
  <div class="actions">
    <Btn
      variant="solid"
      href={assautPossible ? briefing : undefined}
      disabled={!assautPossible}
      style="flex:1">Préparer l'assaut</Btn
    >
    <Btn variant="ghost" href={operations ? briefing : undefined} disabled={!operations}>
      Espionner
    </Btn>
  </div>
</div>

<style>
  .holo {
    grid-area: holo;
    position: relative;
    z-index: 14;
    overflow: hidden;
    background: linear-gradient(180deg, #091416, #05090a);
    border: 1px solid var(--sig-dim);
    display: flex;
    flex-direction: column;
  }
  .hglobe {
    height: 132px;
    flex: 0 0 auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-bottom: 1px solid var(--line);
    background: radial-gradient(ellipse at 50% 130%, rgba(99, 214, 188, 0.12), transparent 62%);
  }
  .hglobe::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      rgba(99, 214, 188, 0.09) 0 1px,
      transparent 1px 4px
    );
  }
  .globe {
    width: 110px;
    height: 110px;
    border-radius: 50%;
  }
  .corps {
    padding: 12px 13px;
    overflow: auto;
    flex: 1;
  }
  .description {
    font-size: 10.5px;
    line-height: 1.55;
    min-height: 32px;
  }
  .jauge {
    display: inline-flex;
    gap: 2px;
    vertical-align: middle;
  }
  .jauge i {
    width: 4px;
    height: 11px;
    display: inline-block;
    background: var(--warn);
  }
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.5;
  }
  .renseignement {
    padding: 9px;
    border: 1px solid var(--line);
    background: #0a1112;
  }
  .renseignement .note {
    line-height: 1.55;
  }
  .actions {
    padding: 11px 13px;
    display: flex;
    gap: 7px;
  }
  .misrow {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 12px;
    border: 1px solid var(--line);
    margin-top: 6px;
    cursor: pointer;
  }
  .misrow:hover {
    background: rgba(99, 214, 188, 0.06);
  }
  .mt,
  .md {
    display: block;
  }
  .mt {
    font-size: 10.5px;
    color: var(--paper);
    letter-spacing: 0.05em;
  }
  .md {
    font-size: 8.5px;
    color: var(--muted);
    font-family: var(--f-mono);
    margin-top: 2px;
  }
  .mtype {
    width: 24px;
    height: 24px;
    border: 1px solid var(--sig-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }
  .mtype :global(svg) {
    stroke: var(--sig);
  }
  .diff {
    margin-left: auto;
    display: flex;
    gap: 2px;
  }
  .diff i {
    width: 4px;
    height: 12px;
    background: var(--warn);
    opacity: 0.22;
  }
  .diff i.on {
    opacity: 1;
  }
</style>
