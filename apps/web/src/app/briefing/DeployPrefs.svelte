<script lang="ts">
  import { selection } from '../../state/selection.svelte';
  import OpenBadge from '../../ui/OpenBadge.svelte';
  import Panel from '../../ui/Panel.svelte';
  import Seg from '../../ui/Seg.svelte';
  import Switch from '../../ui/Switch.svelte';

  /**
   * Preferences de deploiement (renderBrief, lignes 1908-1926). L'interrupteur releve d'une phase
   * ulterieure (FR-018) ; la formation est partagee avec Escouades et Deploiement (FR-016).
   */
  const FORMATIONS = [
    { value: 'ring', label: '360°' },
    { value: 'arc', label: 'Arc' },
  ] as const;

  const formation = $derived(selection.current.formation[selection.current.squad]);
</script>

<Panel title="Déploiement" right="CR POINT 4">
  <div class="toggle">
    <div>
      <div class="tt">Déploiement automatique</div>
      <div class="td">Blindés devant, unités à portée derrière, selon la formation par défaut.</div>
    </div>
    <Switch checked={true} label="Déploiement automatique" laterPhase="auto-deploy-toggle" />
  </div>
  <div class="toggle">
    <div>
      <div class="tt">Formation par défaut</div>
      <div class="td">
        {formation === 'ring' ? "Défense 360° autour de l'objectif" : 'Arc depuis un bord de carte'}
      </div>
    </div>
    <Seg
      label="Formation par défaut"
      options={FORMATIONS}
      value={formation}
      onchange={(choix) => selection.setFormation(choix)}
    />
  </div>
  <div class="bd">
    <OpenBadge>Objectif et disposition à trancher — point 2 du CR</OpenBadge>
    <div class="note">
      L'objectif retenu pour la maquette est la défense d'une relique. La variante « point
      stratégique à tenir pendant N vagues » utilise le même plateau.
    </div>
  </div>
</Panel>

<style>
  .note {
    font-size: 9.5px;
    color: var(--muted);
    line-height: 1.55;
    margin-top: 9px;
  }
</style>
