<script lang="ts">
  interface Props {
    isOpen: boolean
    title: string
    message: string
    itemName: string
    confirmText?: string
    onConfirm: () => void
    onCancel: () => void
  }

  let {
    isOpen,
    title,
    message,
    itemName,
    confirmText = 'Eliminar',
    onConfirm,
    onCancel,
  }: Props = $props()

  let inputValue = $state('')
  let isMatch = $derived(inputValue === itemName)

  function handleConfirm() {
    if (isMatch) {
      onConfirm()
      inputValue = ''
    }
  }

  function handleCancel() {
    inputValue = ''
    onCancel()
  }
</script>

{#if isOpen}
  <div class="modal-overlay" onclick={handleCancel} role="presentation">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <h3 id="modal-title" class="modal__title">{title}</h3>
      <p class="modal__message">{message}</p>

      <div class="modal__input-group">
        <label for="confirmation-input" class="modal__label">
          Escribe <strong class="modal__item-name">{itemName}</strong> para confirmar:
        </label>
        <input
          id="confirmation-input"
          class="modal__input"
          type="text"
          bind:value={inputValue}
          placeholder={itemName}
          autocomplete="off"
        />
      </div>

      <div class="modal__actions">
        <button class="button button--secondary" onclick={handleCancel}>
          Cancelar
        </button>
        <button
          class="button button--danger"
          disabled={!isMatch}
          onclick={handleConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
  }

  .modal {
    background-color: var(--foreground-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    width: 100%;
    max-width: 28rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(128, 128, 128, 0.15);
    animation: slideUp 0.2s ease-out;
  }

  .modal__title {
    margin: 0 0 1rem;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .modal__message {
    margin: 0 0 1.5rem;
    color: var(--text-color-secondary);
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  .modal__input-group {
    margin-bottom: 1.5rem;
  }

  .modal__label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-primary);
  }

  .modal__item-name {
    user-select: all;
    background-color: rgba(128, 128, 128, 0.1);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: monospace;
  }

  .modal__input {
    width: 100%;
    padding: 0.625rem;
    border: 2px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 0.9375rem;
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
  }

  .modal__input:focus {
    border-color: #dc3545;
    outline: none;
  }

  .modal__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button--secondary {
    background: none;
    color: var(--text-color-secondary);
  }

  .button--secondary:hover {
    color: var(--text-color-primary);
    background-color: rgba(128, 128, 128, 0.1);
  }

  .button--danger {
    background-color: #dc3545;
    color: white;
  }

  .button--danger:hover:not(:disabled) {
    background-color: #c82333;
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
