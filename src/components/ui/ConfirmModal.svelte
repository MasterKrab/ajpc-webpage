<script lang="ts">
  import Modal from './Modal.svelte'

  interface Props {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel: () => void
    type?: 'primary' | 'danger'
  }

  let {
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    type = 'primary',
  }: Props = $props()
</script>

<Modal {isOpen} {title} onClose={onCancel}>
  <div class="confirm-modal">
    <p class="confirm-modal__message">{message}</p>

    <div class="confirm-modal__actions">
      <button class="button button--secondary" onclick={onCancel}>
        {cancelText}
      </button>
      <button
        class="button"
        class:button--primary={type === 'primary'}
        class:button--danger={type === 'danger'}
        onclick={onConfirm}
      >
        {confirmText}
      </button>
    </div>
  </div>
</Modal>

<style>
  .confirm-modal {
    padding: 0.5rem 0;
  }

  .confirm-modal__message {
    margin: 0 0 1.5rem;
    color: var(--text-color-secondary);
    line-height: 1.5;
  }

  .confirm-modal__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .button {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 0.375rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .button--primary {
    background-color: var(--brand-primary);
    color: white;
  }

  .button--danger {
    background-color: var(--color-danger, #dc3545);
    color: white;
  }

  .button--secondary {
    background: none;
    border: 1px solid var(--border-color);
    color: var(--text-color-primary);
  }

  .button--secondary:hover {
    background-color: rgba(128, 128, 128, 0.05);
  }
</style>
