<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Modal from '@components/ui/Modal.svelte'
  import Button from '@components/ui/Button.svelte'

  let isModalOpen = $state(false)
  let isDeleting = $state(false)

  async function handleDelete() {
    isDeleting = true
    try {
      const res = await fetch('/api/user/me', {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Cuenta eliminada correctamente')
        // El servidor limpió la cookie, solo redirigimos
        window.location.href = '/'
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Error al eliminar la cuenta')
      }
    } catch (err) {
      toast.error('Error de conexión')
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
