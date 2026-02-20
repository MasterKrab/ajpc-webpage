<script lang="ts">
  interface Props {
    isOpen: boolean
    title: string
    onClose: () => void
    children: any
  }

  let { isOpen, title, onClose, children }: Props = $props()

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
      e.stopPropagation()
    }
  }

  $effect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''

    return () => document.body.style.overflow = ''
  })

  function portal(node: HTMLElement) {
    document.body.appendChild(node)
    return {
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node)
        }
      },
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="modal-overlay" use:portal onclick={onClose} role="presentation">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleKeydown}
    >
      <header class="modal__header">
        <h3 id="modal-title" class="modal__title">{title}</h3>
        <button class="close-button" onclick={onClose} aria-label="Cerrar"
          >Cerrar</button
        >
      </header>

      <div class="modal__content">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100000;
    animation: fadeIn 0.2s ease-out;
  }

  @media screen and (min-width: 30rem) {
    .modal-overlay {
      padding: 5rem 1rem;
    }
  }

  .modal {
    background-color: var(--foreground-color);
    padding: 1.5rem;
    width: 100%;
    max-width: 60rem;
    max-height: 100vh;
    overflow-y: auto;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(128, 128, 128, 0.15);
    animation: slideUp 0.2s ease-out;
    display: flex;
    flex-direction: column;
  }

  @media screen and (min-width: 30rem) {
    .modal {
      border-radius: 0.75rem;
    }
  }

  .modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .modal__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .close-button {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 0.375rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    background-color: var(--foreground-color);
    border: 1px solid var(--border-color);
    color: var(--text-color-primary);
  }

  .close-button:hover {
    background-color: var(--border-color-light);
  }

  .close-button:hover {
    background-color: rgba(128, 128, 128, 0.1);
    color: var(--text-color-primary);
  }

  .modal__content {
    flex: 1;
    overflow-y: auto;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
