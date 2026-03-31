<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Modal from '@components/ui/Modal.svelte'
  import Button from '@components/ui/Button.svelte'
  import { trpcClient } from '@app-trpc/client'

  let isModalOpen = $state(false)
  let isDeleting = $state(false)

  async function handleDelete() {
    isDeleting = true
    try {
      await trpcClient.user.deleteAccount.mutate()
      toast.success('Cuenta eliminada correctamente')
      window.location.href = '/'
    } catch (error: unknown) {
      const trpcError = error as { message?: string }
      toast.error(trpcError?.message || 'Error al eliminar la cuenta')
    } finally {
      isDeleting = false
      isModalOpen = false
    }
  }
</script>

<Button variant="danger" onclick={() => (isModalOpen = true)}>
  Eliminar mi cuenta
</Button>

<Modal
  isOpen={isModalOpen}
  onClose={() => {
    if (!isDeleting) isModalOpen = false
  }}
  title="Eliminar cuenta"
>
  <div class="delete-content">
    <p class="delete-warning">
      <strong>¡Advertencia!</strong> Esta acción es irreversible. Se eliminarán permanentemente
      todos tus datos, incluyendo tus inscripciones, asistencia y cualquier otro
      registro asociado a tu cuenta.
    </p>
    <p>¿Estás completamente seguro de que deseas eliminar tu cuenta?</p>
  </div>

  <div class="delete-actions">
    <Button
      variant="secondary"
      onclick={() => (isModalOpen = false)}
      disabled={isDeleting}
    >
      Cancelar
    </Button>
    <Button variant="danger" onclick={handleDelete} loading={isDeleting}>
      Sí, eliminar mi cuenta
    </Button>
  </div>
</Modal>

<style>
  .delete-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    color: var(--text-color-primary);
  }

  .delete-warning {
    color: #dc3545;
    background-color: rgba(220, 53, 69, 0.1);
    padding: 1rem;
    border-radius: 0.5rem;
    border-left: 4px solid #dc3545;
    margin: 0;
  }

  .delete-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    width: 100%;
  }
</style>
