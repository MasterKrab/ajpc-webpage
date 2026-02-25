<script lang="ts">
  import { onMount } from 'svelte'
  import { toast } from 'svelte-sonner'
  import ConfirmModal from '@components/ui/ConfirmModal.svelte'
  import Select from '@components/ui/Select.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import trashIcon from '@assets/icons/trash.svg?raw'

  type Invite = {
    code: string
    role: 'student' | 'docente' | 'admin'
    createdBy: string
    usedBy: string | null
    createdAt: string
    usedAt: string | null
  }

  let { isSudo }: { isSudo: boolean } = $props()

  let invites = $state<Invite[]>([])
  let loading = $state(true)
  let generating = $state(false)
  let deleting = $state<string | null>(null)
  let selectedRole = $state<'student' | 'docente' | 'admin'>('student')

  const roleOptions = $derived([
    { value: 'student', label: 'Estudiante' },
    { value: 'docente', label: 'Docente' },
    ...(isSudo ? [{ value: 'admin', label: 'Administrador' }] : []),
  ])

  let isDeleteModalOpen = $state(false)
  let inviteToDelete = $state<string | null>(null)

  const fetchInvites = async () => {
    loading = true
    try {
      const response = await fetch('/api/admin/invites')
      invites = await response.json()
    } catch (e) {
      console.error(e)
    } finally {
      loading = false
    }
  }

  const generateInvite = async () => {
    generating = true
    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })

      if (response.ok) {
        toast.success('Invitación generada')
        await fetchInvites()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al generar invitación')
      }
    } catch (e) {
      toast.error('Error al generar invitación')
    } finally {
      generating = false
    }
  }

  const confirmDelete = (code: string) => {
    inviteToDelete = code
    isDeleteModalOpen = true
  }

  const deleteInvite = async () => {
    if (!inviteToDelete) return
    const code = inviteToDelete
    isDeleteModalOpen = false
    deleting = code

    try {
      const response = await fetch(`/api/admin/invites?code=${code}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Invitación eliminada')
        await fetchInvites()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al eliminar invitación')
      }
    } catch (e) {
      toast.error('Error al eliminar invitación')
    } finally {
      deleting = null
      inviteToDelete = null
    }
  }

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/login?code=${code}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado al portapapeles')
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case 'student':
        return '👨‍🎓 Estudiante'
      case 'docente':
        return '👨‍🏫 Docente'
      case 'admin':
        return '🔑 Admin'
      default:
        return role
    }
  }

  onMount(fetchInvites)
</script>

<div class="invite-manager">
  <header class="invite-manager__header">
    <div class="invite-manager__title-group">
      <h2 class="invite-manager__title">Sistema de Invitaciones</h2>
      <p class="invite-manager__subtitle">
        Genera links de un solo uso para registrar nuevos miembros.
      </p>
    </div>

    <div class="invite-generator">
      <Select
        options={roleOptions}
        bind:value={selectedRole}
        placeholder="Selecciona un rol"
      />
      <button
        class="button button--primary"
        onclick={generateInvite}
        disabled={generating}
      >
        {generating ? 'Generando...' : 'Generar Link'}
      </button>
    </div>
  </header>

  {#if loading}
    <Loader label="Cargando invitaciones..." />
  {:else if invites.length === 0}
    <div class="empty-state">
      <p>No hay invitaciones generadas aún.</p>
    </div>
  {:else}
    <div class="table-wrapper">
      <table class="invite-table">
        <thead>
          <tr>
            <th>Rol</th>
            <th>Link / Código</th>
            <th>Estado</th>
            <th>Creado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each invites as invite}
            <tr>
              <td>
                <span class="role-badge role-badge--{invite.role}">
                  {roleLabel(invite.role)}
                </span>
              </td>
              <td>
                <code class="code-text">{invite.code}</code>
              </td>
              <td>
                {#if invite.usedBy}
                  <span class="status-pill status--used">Usado</span>
                {:else}
                  <span class="status-pill status--available">Disponible</span>
                {/if}
              </td>
              <td>
                <span class="date-text">
                  {new Date(invite.createdAt).toLocaleDateString()}
                </span>
              </td>
              <td>
                {#if !invite.usedBy}
                  <button
                    class="button button--small"
                    onclick={() => copyToClipboard(invite.code)}
                  >
                    Copiar Link
                  </button>
                  <button
                    class="button button--small button--danger"
                    onclick={() => confirmDelete(invite.code)}
                    disabled={deleting === invite.code}
                    aria-label="Eliminar invitación"
                  >
                    {#if deleting === invite.code}
                      ...
                    {:else}
                      <span class="icon-trash">{@html trashIcon}</span>
                    {/if}
                  </button>
                {:else}
                  <span class="text-muted">Usado por {invite.usedBy}</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<ConfirmModal
  isOpen={isDeleteModalOpen}
  title="Eliminar invitación"
  message="¿Estás seguro de que quieres eliminar esta invitación? Esta acción no se puede deshacer."
  confirmText="Eliminar"
  type="danger"
  onConfirm={deleteInvite}
  onCancel={() => {
    isDeleteModalOpen = false
    inviteToDelete = null
  }}
/>

<style>
  .invite-manager {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .invite-manager__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .invite-manager__title {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
  }

  .invite-manager__subtitle {
    margin: 0;
    color: var(--text-color-secondary);
    font-size: 0.875rem;
  }

  .invite-generator {
    display: flex;
    gap: 0.75rem;
  }

  .button {
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .button--primary {
    background: var(--brand-primary);
    color: white;
  }

  .button--small {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    background: rgba(128, 128, 128, 0.1);
    color: var(--text-color-primary);
  }

  .button--small:hover {
    background: rgba(128, 128, 128, 0.2);
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .invite-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .invite-table th,
  .invite-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  }

  .invite-table th {
    color: var(--text-color-secondary);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
  }

  .role-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    background: rgba(128, 128, 128, 0.1);
  }

  .role-badge--admin {
    background-color: var(--role-admin-background-color);
    color: var(--role-admin-text-color);
  }
  .role-badge--docente {
    background-color: var(--role-docente-background-color);
    color: var(--role-docente-text-color);
  }
  .role-badge--student {
    background-color: var(--role-student-background-color);
    color: var(--role-student-text-color);
  }

  .status-pill {
    padding: 0.125rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .status--available {
    background-color: var(
      --color-success-background-color,
      var(--color-success-bg)
    );
    color: var(--color-success-text-color, var(--color-success-text));
  }
  .status--used {
    background-color: var(
      --color-danger-background-color,
      var(--color-danger-bg)
    );
    color: var(--color-danger-text-color, var(--color-danger-text));
  }

  .code-text {
    font-family: monospace;
    background: rgba(128, 128, 128, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
  }

  .empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-color-secondary);
    background: rgba(128, 128, 128, 0.05);
    border-radius: 1rem;
    border: 2px dashed rgba(128, 128, 128, 0.1);
  }

  .text-muted {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }

  .button--danger {
    background-color: var(
      --color-danger-background-color,
      var(--color-danger-bg)
    );
    color: var(--color-danger-text-color, var(--color-danger-text));
  }

  .button--danger:hover {
    opacity: 0.8;
  }

  .icon-trash {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
  }

  :global(.icon-trash svg) {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }
</style>
