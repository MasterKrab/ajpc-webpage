<script lang="ts">
  import { onMount } from 'svelte'
  import { toast } from 'svelte-sonner'
  import Button from '@components/ui/Button.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import Loader from '@components/ui/Loader.svelte'

  interface StudentSyncData {
    enrollmentId: string
    fullName: string
    discordId: string
    discordUsername: string
    hasToken: boolean
    inGuild: boolean
    currentNickname: string | null
    needsNicknameUpdate: boolean
    hasRole: boolean
  }

  interface DiscordSyncResponse {
    courseName: string
    discordGuildId: string
    discordRoleId: string | null
    students: StudentSyncData[]
  }

  interface Props {
    courseId: string
  }

  let { courseId }: Props = $props()

  let loading = $state(true)
  let syncData = $state<DiscordSyncResponse | null>(null)
  let actionLoading = $state<string | null>(null)
  let bulkProgress = $state({ current: 0, total: 0, active: false })

  const loadSyncData = async () => {
    loading = true
    try {
      const response = await fetch(
        `/api/admin/discord/sync?courseId=${courseId}`,
      )
      if (response.ok) {
        syncData = await response.json()
      } else {
        const data = await response.json().catch(() => ({ error: 'Error del servidor' }))
        toast.error(data.error || 'Error al cargar datos de Discord')
      }
    } catch (error: any) {
      console.error('Fetch Error:', error)
      toast.error(`Error de conexión: ${error.message || 'No se pudo contactar con el servidor'}`)
    } finally {
      loading = false
    }
  }

  const joinDiscord = async (student: StudentSyncData) => {
    actionLoading = `join-${student.enrollmentId}`
    try {
      const response = await fetch('/api/admin/discord/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: student.enrollmentId }),
      })
      if (response.ok) {
        toast.success(`Alumno ${student.fullName} añadido al servidor`)
        await loadSyncData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al añadir a Discord')
      }
    } catch (error: any) {
      toast.error(`Error de conexión: ${error.message}`)
    } finally {
      actionLoading = null
    }
  }

  const syncNickname = async (student: StudentSyncData) => {
    actionLoading = `sync-${student.enrollmentId}`
    try {
      const response = await fetch('/api/admin/discord/sync-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: student.enrollmentId })
      })
      if (response.ok) {
        toast.success(`Apodo de ${student.fullName} actualizado`)
        await loadSyncData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al sincronizar apodo')
      }
    } catch (error: any) {
      toast.error(`Error de conexión: ${error.message}`)
    } finally {
      actionLoading = null
    }
  }

  const bulkAdd = async () => {
    if (!syncData) return
    const toAdd = syncData.students.filter((student) => !student.inGuild && student.hasToken)
    if (toAdd.length === 0) return

    bulkProgress = { current: 0, total: toAdd.length, active: true }
    for (const student of toAdd) {
      await joinDiscord(student)
      bulkProgress.current++
    }
    bulkProgress.active = false
    toast.success('Proceso de adición masiva completado')
  }

  const bulkSyncNicknames = async () => {
    if (!syncData) return
    const toSync = syncData.students.filter((student) => student.inGuild && student.needsNicknameUpdate)
    if (toSync.length === 0) return

    bulkProgress = { current: 0, total: toSync.length, active: true }
    for (const student of toSync) {
      await syncNickname(student)
      bulkProgress.current++
    }
    bulkProgress.active = false
    toast.success('Proceso de sincronización de apodos completado')
  }

  onMount(() => {
    loadSyncData()
  })
</script>

<DashboardContent padding={false}>
  <div class="discord-header">
    <header class="discord-sync__header">
      <div class="header-info">
        <h2 id="discord-sync-title" class="header-title">Sincronización de Discord</h2>
        <p class="header-desc">Gestiona la presencia de los alumnos en el servidor de Discord.</p>
      </div>
      <div class="header-actions">
        <Button 
          variant="secondary" 
          onclick={loadSyncData} 
          disabled={loading || bulkProgress.active}
          ariaLabel="Refrescar datos de sincronización"
        >
          <span aria-hidden="true">🔄</span> Refrescar
        </Button>
        {#if syncData}
          <Button 
            variant="primary" 
            onclick={bulkAdd} 
            disabled={loading || bulkProgress.active || !syncData.students.some((student) => !student.inGuild && student.hasToken)}
          >
            Añadir Pendientes
          </Button>
          <Button 
            variant="secondary" 
            onclick={bulkSyncNicknames} 
            disabled={loading || bulkProgress.active || !syncData.students.some((student) => student.inGuild && student.needsNicknameUpdate)}
          >
            Sincronizar Apodos
          </Button>
        {/if}
      </div>
    </header>

    {#if bulkProgress.active}
      <div class="bulk-progress" role="progressbar" aria-valuenow={bulkProgress.current} aria-valuemin="0" aria-valuemax={bulkProgress.total}>
        <div class="progress-info">
          <span>Procesando... {bulkProgress.current} de {bulkProgress.total}</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {(bulkProgress.current / bulkProgress.total) * 100}%"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="loading-state" aria-live="polite" aria-busy="true">
      <Loader label="Cargando estado de Discord..." />
    </div>
  {:else if !syncData}
    <div class="error-state" role="alert">
      <p>No se pudo cargar la información de Discord. Asegúrate de que el servidor esté configurado correctamente en los ajustes del curso.</p>
    </div>
  {:else}
    <div class="table-wrapper" aria-busy={actionLoading !== null}>
      <table class="table" aria-labelledby="discord-sync-title">
        <caption class="sr-only">Lista de estudiantes aprobados y su estado en el servidor de Discord</caption>
        <thead>
          <tr>
            <th scope="col" class="table__header">Estudiante</th>
            <th scope="col" class="table__header">Usuario Discord</th>
            <th scope="col" class="table__header">Estado</th>
            <th scope="col" class="table__header">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each syncData.students as student}
            <tr class="table__row">
              <td class="table__cell">
                <strong>{student.fullName}</strong>
              </td>
              <td class="table__cell">
                <span class="discord-tag" aria-label="Usuario de Discord: @{student.discordUsername}">
                  @{student.discordUsername}
                </span>
              </td>
              <td class="table__cell">
                {#if student.inGuild}
                  <span class="status-badge status-badge--success">
                    <span aria-hidden="true">✅</span> En el servidor
                  </span>
                  {#if student.needsNicknameUpdate}
                    <span 
                      class="status-badge status-badge--warning" 
                      title="El apodo en Discord no coincide con el nombre real"
                      role="status"
                    >
                      <span aria-hidden="true">⚠️</span> Apodo desactualizado
                    </span>
                  {/if}
                {:else}
                  <span class="status-badge status-badge--pending">
                    <span aria-hidden="true">❌</span> No unido
                  </span>
                {/if}
              </td>
              <td class="table__cell">
                {#if !student.inGuild}
                  {#if student.hasToken}
                    <Button 
                      size="sm" 
                      onclick={() => joinDiscord(student)} 
                      loading={actionLoading === `join-${student.enrollmentId}`}
                      ariaLabel="Añadir a {student.fullName} al servidor de Discord"
                    >
                      Añadir
                    </Button>
                  {:else}
                    <span 
                      class="token-warning" 
                      title="El alumno debe volver a iniciar sesión para otorgar permisos"
                      role="status"
                    >
                      Faltan permisos
                    </span>
                  {/if}
                {:else if student.needsNicknameUpdate}
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onclick={() => syncNickname(student)} 
                    loading={actionLoading === `sync-${student.enrollmentId}`}
                    ariaLabel="Sincronizar apodo de {student.fullName}"
                  >
                    Sincronizar Apodo
                  </Button>
                {:else}
                  <span class="text-muted" aria-hidden="true">—</span>
                  <span class="sr-only">Sin acciones disponibles</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</DashboardContent>

<style>
  .discord-header {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .discord-sync__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .header-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .header-desc {
    margin: 0.25rem 0 0;
    color: var(--text-color-secondary);
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table__header,
  .table__cell {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  }

  .discord-tag {
    font-family: monospace;
    background: rgba(114, 137, 218, 0.1);
    color: #7289da;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 600;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.625rem;
    border-radius: 2rem;
    white-space: nowrap;
  }

  .status-badge--success {
    background: var(--color-success-bg);
    color: var(--color-success-text);
  }

  .status-badge--pending {
    background: var(--color-warning-bg);
    color: var(--color-warning-text);
  }

  .status-badge--warning {
    background: #fff3cd;
    color: #856404;
    cursor: help;
  }

  .token-warning {
    color: var(--color-danger-text);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: help;
  }

  .text-muted {
    color: var(--text-color-secondary);
    font-size: 0.9rem;
  }

  .loading-state {
    padding: 4rem;
    display: flex;
    justify-content: center;
  }

  .error-state {
    padding: 3rem;
    text-align: center;
    color: #721c24;
  }

  .bulk-progress {
    background: var(--foreground-color);
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
  }

  .progress-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .progress-bar {
    height: 0.5rem;
    background: rgba(128, 128, 128, 0.1);
    border-radius: 1rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--brand-primary);
    transition: width 0.3s ease;
  }
</style>
