<script lang="ts">
  import type { IconId } from '@nova/data';
  import { router, toHash } from '../state/router.svelte';
  import type { NavSection } from '../state/routes';
  import Icon from '../ui/Icon.svelte';

  /**
   * Navigation principale (MAIN, ligne 2469 ; CSS lignes 172-181) : cinq liens dans l'ordre de la
   * maquette. La section courante porte `aria-current="page"` et le style `on` (FR-003).
   */
  const ENTREES: { section: NavSection; icon: IconId; label: string }[] = [
    { section: 'escouades', icon: 'ic-squad', label: 'Escouades' },
    { section: 'base', icon: 'ic-hq', label: 'Base' },
    { section: 'recherche', icon: 'ic-tech', label: 'Recherche' },
    { section: 'carte', icon: 'ic-map', label: 'Carte' },
    { section: 'butin', icon: 'ic-crate', label: 'Butin' },
  ];
</script>

<nav class="mainnav" aria-label="Navigation principale">
  {#each ENTREES as entree (entree.section)}
    {@const courante = router.section === entree.section}
    <a
      href={toHash({ screen: entree.section })}
      class:on={courante}
      aria-current={courante ? 'page' : undefined}
    >
      <Icon icon={entree.icon} size={26} />{entree.label}
    </a>
  {/each}
</nav>

<style>
  .mainnav {
    display: flex;
    align-items: stretch;
  }
  .mainnav a {
    position: relative;
    width: 118px;
    border-right: 1px solid var(--line);
    cursor: pointer;
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--muted);
    letter-spacing: 0.18em;
    font-size: 10.5px;
    text-transform: uppercase;
    transition: 0.14s;
  }
  .mainnav a:hover {
    color: var(--sig-hi);
    background: rgba(99, 214, 188, 0.06);
  }
  .mainnav a.on {
    color: var(--sig-hi);
    background: rgba(99, 214, 188, 0.1);
  }
  .mainnav a.on::after {
    content: '';
    position: absolute;
    bottom: 0;
    height: 2px;
    width: 100%;
    background: var(--sig);
  }
  .mainnav a:focus-visible {
    outline-offset: -3px;
  }
</style>
