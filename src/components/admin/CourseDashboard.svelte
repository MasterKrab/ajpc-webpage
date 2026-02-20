<script lang="ts">
  import DeleteConfirmation from './DeleteConfirmation.svelte'
  import { toast } from 'svelte-sonner'

  type Course = {
    id: string
    name: string
    description: string | null
    level: string
    year: number
    maxStudents: number | null
    status: string
    enrollmentStartDate: Date | null
    enrollmentEndDate: Date | null
  }

  import type { Enrollment } from '@db/schema'

  type EnrollmentItem = {
    enrollment: Enrollment & { notifiedAt: Date | null }
    courseName: string
    discordUsername: string
  }

  interface Props {
    course: Course
    initialEnrollments: EnrollmentItem[]
    isSudo: boolean
  }

  let { course = $bindable(), initialEnrollments, isSudo }: Props = $props()

  let enrollmentsList = $state(initialEnrollments)
  let activeTab = $state<'enrollments' | 'settings'>('enrollments')
  let actionLoading = $state<string | null>(null)
  let adminNotesInput = $state<Record<string, string>>({})
  let isDeleteModalOpen = $state(false)
  let updateLoading = $state(false)

  // Helper to format Date to datetime-local string (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 16)
  }

  let editForm = $state({
    name: course.name,
    description: course.description || '',
    level: course.level,
    year: course.year,
    maxStudents: course.maxStudents,
    status: course.status,
    enrollmentStartDate: formatDateForInput(course.enrollmentStartDate),
    enrollmentEndDate: formatDateForInput(course.enrollmentEndDate),
  })

  async function refreshEnrollments() {
    const res = await fetch(`/api/admin/inscripciones?courseId=${course.id}`)
    enrollmentsList = await res.json()
  }

  import EnrollmentDetailModal from './EnrollmentDetailModal.svelte'

  let selectedEnrollment = $state<
    | (EnrollmentItem['enrollment'] & {
        courseName?: string
        discordUsername?: string
      })
    | null
  >(null)
  let isDetailModalOpen = $state(false)

  async function updateEnrollment(
    id: string,
    status: 'approved' | 'rejected' | 'pending',
    notes?: string,
    feedback?: string,
  ) {
    await fetch(`/api/admin/inscripciones?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        adminNotes: notes,
        feedback,
      }),
    })
    await refreshEnrollments()
  }

  async function notify(enrollmentId?: string) {
    actionLoading = enrollmentId || 'batch'
    const res = await fetch('/api/admin/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollmentId,
        courseId: enrollmentId ? undefined : course.id,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      toast.success(
        data.count
          ? `Se enviaron ${data.count} notificaciones.`
          : 'Notificación enviada.',
      )
      await refreshEnrollments()
    } else {
      toast.error('Error al enviar notificaciones')
    }
    actionLoading = null
  }

  function openEnrollmentDetail(item: EnrollmentItem) {
    selectedEnrollment = {
      ...item.enrollment,
      courseName: item.courseName,
      discordUsername: item.discordUsername,
    }
    isDetailModalOpen = true
  }

  async function updateCourse() {
    updateLoading = true

    let payload = {
      ...editForm,
      enrollmentStartDate: editForm.enrollmentStartDate || null,
      enrollmentEndDate: editForm.enrollmentEndDate || null,
    }

    const res = await fetch(`/api/admin/courses?id=${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      course = {
        ...course,
        ...editForm,
        enrollmentStartDate: payload.enrollmentStartDate
          ? new Date(payload.enrollmentStartDate)
          : null,
        enrollmentEndDate: payload.enrollmentEndDate
          ? new Date(payload.enrollmentEndDate)
          : null,
      }
      toast.success('Curso actualizado correctamente')
    } else {
      toast.error('Error al actualizar el curso')
    }
    updateLoading = false
  }

  async function deleteCourse() {
    const res = await fetch(`/api/admin/courses?id=${course.id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      window.location.href = '/admin'
    } else {
      toast.error('Error al eliminar el curso')
    }
  }

  const levelLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return '🟢 Básico'
      case 'intermediate':
        return '🟡 Intermedio'
      case 'advanced':
        return '🔴 Avanzado'
      default:
        return level
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Pendiente'
      case 'approved':
        return '✅ Aprobada'
      case 'rejected':
        return '❌ Rechazada'
      default:
        return status
    }
  }
</script>

<div class="course-dash">
  <header class="course-header">
    <div class="course-header__info">
      <h1 class="course-header__title">{course.name}</h1>
      <div class="course-header__badges">
        <span class="badge badge--level">{levelLabel(course.level)}</span>
        <span class="badge badge--year">{course.year}</span>
        <span class="badge badge--status status--{course.status}">
          {course.status === 'open' ? 'Abierto' : 'Cerrado'}
        </span>
      </div>
    </div>
    <div class="course-header__tabs" role="tablist">
      <button
        class="tab-button"
        class:active={activeTab === 'enrollments'}
        onclick={() => (activeTab = 'enrollments')}
        role="tab"
        aria-selected={activeTab === 'enrollments'}
      >
        Inscripciones ({enrollmentsList.length})
      </button>
      <button
        class="tab-button"
        class:active={activeTab === 'settings'}
        onclick={() => (activeTab = 'settings')}
        role="tab"
        aria-selected={activeTab === 'settings'}
      >
        Configuración
      </button>
    </div>
  </header>

  <main class="course-content">
    {#if activeTab === 'enrollments'}
      {#if enrollmentsList.some((e) => !e.enrollment.notifiedAt && e.enrollment.status !== 'pending')}
        <div class="pending-notice">
          <span>Hay notificaciones pendientes para este curso.</span>
          <button
            class="button button--small button--primary"
            onclick={() => notify()}
            disabled={actionLoading === 'batch'}
          >
            {actionLoading === 'batch' ? 'Enviando...' : 'Notificar Pendientes'}
          </button>
        </div>
      {/if}

      {#if enrollmentsList.length === 0}
        <div class="empty-state">
          <p>No hay estudiantes inscritos en este curso.</p>
        </div>
      {:else}
        <div class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Info</th>
                <th>Estado</th>
                <th>Notificación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {#each enrollmentsList as item}
                <tr>
                  <td>
                    <strong>{item.enrollment.fullName}</strong><br />
                    <small class="text-muted">@{item.discordUsername}</small>
                  </td>
                  <td>
                    {item.enrollment.age} años<br />
                    <small class="text-muted">{item.enrollment.email}</small>
                  </td>
                  <td>
                    <span class="status-pill status--{item.enrollment.status}">
                      {statusLabel(item.enrollment.status)}
                    </span>
                  </td>
                  <td>
                    {#if item.enrollment.notifiedAt}
                      <span class="notified-at">
                        📩 {new Date(
                          item.enrollment.notifiedAt,
                        ).toLocaleDateString()}
                      </span>
                    {:else if item.enrollment.status !== 'pending'}
                      <button
                        class="button button--small"
                        onclick={() => notify(item.enrollment.id)}
                        disabled={actionLoading === item.enrollment.id}
                      >
                        {actionLoading === item.enrollment.id
                          ? '...'
                          : 'Notificar'}
                      </button>
                    {:else}
                      <span class="text-muted">—</span>
                    {/if}
                  </td>
                  <td class="actions-cell">
                    <button
                      class="button button--small button--primary"
                      onclick={() => openEnrollmentDetail(item)}
                    >
                      Ver postulación
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {:else if activeTab === 'settings'}
      <div class="settings-panel">
        <section class="settings-section">
          <h2>Editar Curso</h2>
          <form
            class="edit-form"
            onsubmit={(e) => {
              e.preventDefault()
              updateCourse()
            }}
          >
            <div class="form-grid">
              <div class="form-group">
                <label for="name">Nombre</label>
                <input
                  id="name"
                  class="form-input"
                  bind:value={editForm.name}
                  required
                />
              </div>
              <div class="form-group">
                <label for="year">Año</label>
                <input
                  id="year"
                  type="number"
                  class="form-input"
                  bind:value={editForm.year}
                  required
                />
              </div>
              <div class="form-group">
                <label for="level">Nivel</label>
                <select
                  id="level"
                  class="form-input"
                  bind:value={editForm.level}
                >
                  <option value="beginner">Básico</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>
              <div class="form-group">
                <label for="maxStudents">Máx. Estudiantes</label>
                <input
                  id="maxStudents"
                  type="number"
                  class="form-input"
                  bind:value={editForm.maxStudents}
                />
              </div>
              <div class="form-group">
                <label for="status">Estado</label>
                <select
                  id="status"
                  class="form-input"
                  bind:value={editForm.status}
                >
                  <option value="open">Abierto</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>
              <div class="form-group">
                <label for="startDate">Inicio inscripciones (opcional)</label>
                <input
                  id="startDate"
                  type="datetime-local"
                  class="form-input"
                  bind:value={editForm.enrollmentStartDate}
                />
              </div>
              <div class="form-group">
                <label for="endDate">Fin inscripciones (opcional)</label>
                <input
                  id="endDate"
                  type="datetime-local"
                  class="form-input"
                  bind:value={editForm.enrollmentEndDate}
                />
              </div>
            </div>
            <div class="form-group">
              <label for="description">Descripción</label>
              <textarea
                id="description"
                class="form-input"
                rows="3"
                bind:value={editForm.description}
              ></textarea>
            </div>
            <button
              type="submit"
              class="button button-primary"
              disabled={updateLoading}
            >
              {updateLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </section>

        <section class="settings-section danger-zone">
          <h2>Zona de Peligro</h2>
          <p>
            Eliminar este curso borrará permanentemente todas las inscripciones
            asociadas.
          </p>
          <button
            class="button button-danger"
            onclick={() => (isDeleteModalOpen = true)}
          >
            Eliminar curso
          </button>
        </section>
      </div>
    {/if}
  </main>
</div>

{#if selectedEnrollment && isDetailModalOpen}
  <EnrollmentDetailModal
    isOpen={isDetailModalOpen}
    enrollment={selectedEnrollment}
    onClose={() => {
      isDetailModalOpen = false
      selectedEnrollment = null
    }}
    onStatusChange={updateEnrollment}
  />
{/if}

<DeleteConfirmation
  isOpen={isDeleteModalOpen}
  title="¿Eliminar curso?"
  message="Esta acción no se puede deshacer. Esto eliminará permanentemente el curso y todas sus inscripciones."
  itemName={course.name}
  confirmText="Eliminar curso"
  onConfirm={deleteCourse}
  onCancel={() => (isDeleteModalOpen = false)}
/>

<style>
  .course-dash {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .course-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    border-bottom: 1px solid rgba(128, 128, 128, 0.15);
    padding-bottom: 0;
  }

  .course-header__title {
    font-size: 2rem;
    margin: 0 0 0.5rem;
  }

  .course-header__badges {
    display: flex;
    gap: 0.5rem;
  }

  .badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    background: rgba(128, 128, 128, 0.1);
  }

  .status--open {
    background: #d4edda;
    color: #155724;
  }
  .status--closed {
    background: #f8d7da;
    color: #721c24;
  }

  .course-header__tabs {
    display: flex;
    gap: 1rem;
  }

  .tab-button {
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-weight: 600;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-button:hover {
    color: var(--text-color-primary);
  }
  .tab-button.active {
    color: var(--brand-primary);
    border-bottom-color: var(--brand-primary);
  }

  /* Tables */
  .table-wrapper {
    overflow-x: auto;
  }
  .admin-table {
    width: 100%;
    border-collapse: collapse;
  }
  .admin-table th,
  .admin-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  }
  .text-muted {
    color: var(--text-color-secondary);
    font-size: 0.85em;
  }

  .status-pill {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .status--approved {
    background: #d4edda;
    color: #155724;
  }
  .status--rejected {
    background: #f8d7da;
    color: #721c24;
  }
  .status--pending {
    background: #fff3cd;
    color: #856404;
  }

  .actions-cell {
    min-width: 200px;
  }

  .notes-input {
    width: 100%;
    margin-bottom: 0.5rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.25rem;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  .button-icon {
    padding: 0.25rem 0.5rem;
    border: 1px solid rgba(128, 128, 128, 0.2);
    background: var(--foreground-color);
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .button-icon:hover:not(:disabled) {
    background: rgba(128, 128, 128, 0.1);
  }

  .button-icon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 600px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-input {
    padding: 0.5rem;
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.375rem;
    font-size: 1rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-color-primary);
  }

  .button-primary {
    background: var(--brand-primary);
  }

  .button-danger {
    background: #dc3545;
  }

  .danger-zone {
    margin-top: 3rem;
    padding: 1.5rem;
    border: 1px solid #f8d7da;
    border-radius: 0.5rem;
    background: #fff5f5;
  }
  .danger-zone h2 {
    color: #dc3545;
    font-size: 1.25rem;
    margin-top: 0;
  }

  .pending-notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: #fff3cd;
    color: #856404;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .notified-at {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }
</style>
