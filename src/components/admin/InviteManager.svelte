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
    creatorUsername?: string
    creatorAvatar?: string | null
    creatorDiscordId?: string | null
    usedBy: string | null
    createdAt: string
    usedAt: string | null
    maxUses: number
    uses: number
  }

  let { isSudo }: { isSudo: boolean } = $props()

  let invites = $state<Invite[]>([])
  let loading = $state(true)
  let generating = $state(false)
  let deleting = $state<string | null>(null)
  let selectedRole = $state<'student' | 'docente' | 'admin'>('student')
  let maxUses = $state(1)

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
    } catch (error) {
      console.error(error)
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
        body: JSON.stringify({ role: selectedRole, maxUses }),
      })

      if (response.ok) {
        toast.success('Invitación generada')
        await fetchInvites()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al generar invitación')
      }
    } catch (error) {
      console.error(error)
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
    } catch (error) {
      console.error(error)
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
      <div class="generator-group">
        <Select
          options={roleOptions}
          bind:value={selectedRole}
          placeholder="Selecciona un rol"
        />
      </div>
      <div class="generator-group generator-group--count">
        <label for="max-uses" class="generator-label">Cant. de usos</label>
        <input
          id="max-uses"
          type="number"
          min="1"
          max="100"
          bind:value={maxUses}
          class="count-input"
          title="Máximo de usos"
        />
      </div>
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
            <th>Usos</th>
            <th>Creador</th>
            <th>Fecha</th>
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
                <div class="usage-info">
                  <span class="usage-text"
                    >{invite.uses} / {invite.maxUses}</span
                  >
                  <div class="usage-bar">
                    <div
                      class="usage-bar-fill"
                      style:width="{(invite.uses / invite.maxUses) * 100}%"
                      class:usage-bar-fill--full={invite.uses >= invite.maxUses}
                    ></div>
                  </div>
                </div>
              </td>
              <td>
                <div class="creator-info">
                  {#if invite.creatorDiscordId && invite.creatorAvatar}
                    <img
                      src="https://cdn.discordapp.com/avatars/{invite.creatorDiscordId}/{invite.creatorAvatar}.png?size=32"
                      alt=""
                      class="creator-avatar"
                    />
                  {/if}
                  <span class="creator-name">
                    @{invite.creatorUsername || 'Sistema'}
                  </span>
                </div>
              </td>
              <td>
                <span class="date-text">
                  {new Date(invite.createdAt).toLocaleDateString()}
                </span>
              </td>
              <td>
                {#if invite.uses < invite.maxUses}
                  <button
                    class="button button--small"
                    onclick={() => copyToClipboard(invite.code)}
                  >
                    Copiar Link
                  </button>
                {/if}
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
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .generator-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .generator-group--count {
    padding-left: 1rem;
    border: 2px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.5rem;
  }

  .count-input {
    width: 4rem;
    padding-right: 1rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border: none;
    background-color: transparent;
    color: var(--text-color-primary);
    font-weight: 600;
    text-align: center;
    -moz-appearance: textfield;
  }

  .count-input::-webkit-outer-spin-button,
  .count-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
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

  .usage-info {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    min-width: 80px;
  }

  .usage-text {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-color-secondary);
  }

  .usage-bar {
    height: 4px;
    background: rgba(128, 128, 128, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .usage-bar-fill {
    height: 100%;
    background: var(--brand-primary);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .usage-bar-fill--full {
    background: #ef4444;
  }

  .generator-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-color-secondary);
    letter-spacing: 0.05em;
  }

  .creator-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .creator-avatar {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: rgba(128, 128, 128, 0.1);
  }

  .creator-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-color-primary);
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
