<script lang="ts">
  import Modal from '@components/ui/Modal.svelte'
  import Button from '@components/ui/Button.svelte'

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
      <Button variant="secondary" onclick={onCancel}>{cancelText}</Button>
      <Button variant={type} onclick={onConfirm}>{confirmText}</Button>
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
</style>
