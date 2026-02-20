<script lang="ts">
  import { onMount } from 'svelte'
  import { toast } from 'svelte-sonner'
  import ConfirmModal from '../ui/ConfirmModal.svelte'
  import trashIcon from '@assets/icons/trash.svg?raw'

  type Invite = {
    code: string
    role: 'student' | 'docente' | 'admin'
    createdBy: string
    usedBy: string | null
    createdAt: string
    usedAt: string | null
  }

  interface Props {
    isSudo: boolean
  }

  let { isSudo }: Props = $props()

  let invites = $state<Invite[]>([])
  let loading = $state(true)
  let generating = $state(false)
  let deleting = $state<string | null>(null)
  let selectedRole = $state<'student' | 'docente' | 'admin'>('student')

  let isDeleteModalOpen = $state(false)
  let inviteToDelete = $state<string | null>(null)

  const fetchInvites = async () => {
    loading = true
    const res = await fetch('/api/admin/invites')
    invites = await res.json()
    loading = false
  }

  const generateInvite = async () => {
    generating = true
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: selectedRole }),
    })

    if (res.ok) {
      toast.success('Invitación generada')
      await fetchInvites()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Error al generar invitación')
    }
    generating = false
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

    const res = await fetch(`/api/admin/invites?code=${code}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      toast.success('Invitación eliminada')
      await fetchInvites()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Error al eliminar invitación')
    }
    deleting = null
    inviteToDelete = null
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
      <select class="form-input" bind:value={selectedRole}>
        <option value="student">Estudiante</option>
        <option value="docente">Docente</option>
        {#if isSudo}
          <option value="admin">Administrador</option>
        {/if}
      </select>
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
    <p class="loading">Cargando invitaciones...</p>
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

  .form-input {
    padding: 0.5rem 0.75rem;
    border: 2px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.5rem;
    background: var(--foreground-color);
    color: var(--text-color-primary);
    font-family: inherit;
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
    background: #fce4ec;
    color: #c62828;
  }
  .role-badge--docente {
    background: #fff3e0;
    color: #e65100;
  }
  .role-badge--student {
    background: #e3f2fd;
    color: #1565c0;
  }

  .status-pill {
    padding: 0.125rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .status--available {
    background: #d4edda;
    color: #155724;
  }
  .status--used {
    background: #f8d7da;
    color: #721c24;
  }

  .code-text {
    font-family: monospace;
    background: rgba(128, 128, 128, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
  }

  .loading,
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
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }

  .button--danger:hover {
    background: rgba(220, 53, 69, 0.2);
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
