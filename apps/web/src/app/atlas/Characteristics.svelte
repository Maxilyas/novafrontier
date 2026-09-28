<script lang="ts">
  import { nodeById, rarityById, type Unit } from '@nova/data';
  import KeyValue from '../../ui/KeyValue.svelte';
  import Panel from '../../ui/Panel.svelte';
  import Pill from '../../ui/Pill.svelte';
  import StatLine from '../../ui/StatLine.svelte';

  /**
   * Caracteristiques de l'unite (renderAtlas, lignes 1293-1321) : commandant ou combattant, avec
   * les echelles de barre de la maquette, la note de progression visuelle et celle du porte-nefs.
   */
  let { unit }: { unit: Unit } = $props();

  const rarete = $derived(rarityById(unit.rarity));
  /** Recherche qui augmente la capacite de transport (noeud f9 de l'arbre Flotte). */
  const soutes = nodeById('f9')?.name;
</script>

<Panel title="Caractéristiques" right={unit.code} class="caracteristiques">
  <div class="bd">
    {#if unit.family === 'cmd'}
      <KeyValue label="Rôle" value={unit.role} />
      <KeyValue label="Points d'action" value={rarete?.actionPoints} valueClass="gold" />
      <KeyValue
        label="Slot légendaire"
        value={rarete?.legendarySlot ? 'Disponible' : 'Non'}
        valueStyle="color:{rarete?.legendarySlot ? 'var(--gold)' : 'var(--muted)'}"
      />
      <div class="tiny" style="margin:14px 0 6px">Bonus d'escadre</div>
      <div class="pillrow">
        {#each unit.squadBonuses as bonus (bonus)}<Pill variant="k">{bonus}</Pill>{/each}
      </div>
    {:else}
      {@const st = unit.stats}
      <StatLine label="PV" variant="k" percent={Math.min(100, st.hp / 16)} value={st.hp} />
      <StatLine label="Attaque" variant="r" percent={st.attack / 1.6} value={st.attack} />
      <StatLine label="Défense" percent={st.defense} value={st.defense} />
      <StatLine label="Portée" percent={st.range / 2.4} value={st.range} />
      <StatLine label="Vitesse" percent={st.speed} value={st.speed} />
      <KeyValue
        label="Type d'unité"
        value={unit.formation === 'unite' ? "À l'unité" : 'Escadrille'}
        valueStyle="color:var(--sig)"
        style="margin-top:12px"
      />
      <KeyValue label="Effectif" value="{unit.count} / {unit.maxCount} max" />
      <KeyValue label="Blindage" value={unit.armor} />
      {#if unit.family === 'ship'}<KeyValue label="Moteur" value={unit.engine ?? ''} />{/if}
      <div class="encart">
        <div class="tiny">Progression visuelle</div>
        <div class="texte">
          La silhouette ne change jamais. Chaque palier ajoute des éléments lisibles : canons au
          palier 2, structures au palier 3, escadron d'escorte au palier 4. Le joueur reconnaît son
          vaisseau tout en voyant qu'il a monté en puissance.
        </div>
      </div>
      {#if unit.carrier}
        <div class="encart porte-nefs">
          <div class="tiny sig">Porte-nefs</div>
          <div class="texte" style="line-height:1.5">
            Transporte 6 unités sur les trajets longue distance. Capacité augmentée par la recherche
            « {soutes} ».
          </div>
        </div>
      {/if}
    {/if}
  </div>
</Panel>

<style>
  .encart {
    margin-top: 12px;
    padding: 9px;
    border: 1px solid var(--line);
    background: #0b110f;
  }
  .encart.porte-nefs {
    margin-top: 10px;
    padding: 8px;
    border-color: var(--sig-dim);
    background: rgba(99, 214, 188, 0.05);
  }
  .texte {
    font-size: 9.5px;
    color: var(--txt);
    line-height: 1.55;
    margin-top: 5px;
  }
</style>
