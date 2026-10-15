<script lang="ts">
  import { onMount, type Snippet } from 'svelte';

  /**
   * Fenetre de la maquette (showModal, #modal et .mbox, lignes 607-611 et 2427-2429 ; research R17) :
   * fond assombri, boite a coins coupes. Le focus va a la premiere commande a l'ouverture et revient
   * a l'element d'origine a la fermeture. Echap ferme la fenetre seulement si `onclose` est fourni ;
   * le fond n'est pas une commande (la maquette le rendait cliquable, sans equivalent au clavier).
   */
  let {
    label,
    modal,
    onclose,
    attributes = {},
    children,
  }: {
    /** Nom accessible de la fenetre. */
    label: string;
    /** Valeur de `data-modal` (contracts/ui-testing.md). */
    modal: string;
    onclose?: (() => void) | undefined;
    /** Attributs `data-*` supplementaires de la boite. */
    attributes?: Record<string, string>;
    children: Snippet;
  } = $props();

  let boite: HTMLDivElement;

  onMount(() => {
    const origine = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    boite.querySelector<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')?.focus();
    return () => origine?.focus();
  });

  function clavier(e: KeyboardEvent) {
    if (e.key === 'Escape' && onclose) {
      e.preventDefault();
      onclose();
    }
  }
</script>

<svelte:window onkeydown={clavier} />

<div class="fond">
  <div
    bind:this={boite}
    class="mbox notched"
    role="dialog"
    aria-modal="true"
    aria-label={label}
    data-modal={modal}
    {...attributes}
  >
    {@render children()}
  </div>
</div>

<style>
  .fond {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(2, 4, 4, 0.86);
    backdrop-filter: blur(2px);
  }
  .mbox {
    --notch: 10px;
    width: min(960px, calc(100% - 32px));
    max-height: min(760px, calc(100% - 32px));
    overflow: auto;
    background: linear-gradient(180deg, #121a17, #080c0b);
    border: 1px solid var(--line-hi);
    box-shadow: 0 0 70px rgba(0, 0, 0, 0.9);
  }
</style>
