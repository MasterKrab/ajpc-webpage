<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Modal from '@components/ui/Modal.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import Button from '@components/ui/Button.svelte'

  type Teacher = {
    id: string
    discordUsername: string
    name: string | null
  }

  type Section = {
    id: string
    courseId: string
    name: string
    docentes: Teacher[]
  }

  interface Props {
    courseId: string
    initialSections: Section[]
    teachersList: Teacher[]
    studentCounts: Record<string, number>
  }

  let {
    courseId,
    initialSections,
    teachersList,
    studentCounts = $bindable(),
  }: Props = $props()

  let sectionsList = $state<Section[]>(initialSections)
  let sectionsLoading = $state(false)
  let showSectionForm = $state(false)
  let sectionFormLoading = $state(false)
  let editingSectionId = $state<string | null>(null)
  let sectionForm = $state({
    name: '',
    teacherIds: [] as string[],
  })

  let isStudentModalOpen = $state(false)
  let assignmentSection = $state<Section | null>(null)
  let studentSearch = $state('')
  let enrollmentsList = $state<any[]>([])
  let enrollmentLoading = $state(false)

  async function fetchStudents() {
    enrollmentLoading = true
    const response = await fetch(
      `/api/admin/inscripciones?courseId=${courseId}&status=approved&search=${studentSearch}&limit=100`,
    )
    const data = await response.json()
    enrollmentsList = data.enrollments || []
    enrollmentLoading = false
  }

  $effect(() => {
    if (isStudentModalOpen) {
      fetchStudents()
    }
  })

  // Debounced search for students
  let searchTimeout: any
  $effect(() => {
    if (isStudentModalOpen && studentSearch !== undefined) {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        fetchStudents()
      }, 300)
    }
  })

  async function fetchSections() {
    sectionsLoading = true
    const response = await fetch(`/api/admin/sections?courseId=${courseId}`)
    sectionsList = await response.json()
    sectionsLoading = false
  }

  async function saveSection() {
    sectionFormLoading = true
    const isEditing = !!editingSectionId
    const url = isEditing
      ? `/api/admin/sections?id=${editingSectionId}`
      : '/api/admin/sections'
    const method = isEditing ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sectionForm,
        courseId,
      }),
    })

    if (response.ok) {
      toast.success(
        isEditing
          ? 'Paralelo actualizado correctamente'
          : 'Paralelo creado correctamente',
      )
      showSectionForm = false
      sectionForm = { name: '', teacherIds: [] }
      editingSectionId = null
      await fetchSections()
    } else {
      toast.error(
        isEditing
          ? 'Error al actualizar el paralelo'
          : 'Error al crear el paralelo',
      )
    }
    sectionFormLoading = false
  }

  function openCreateSection() {
    editingSectionId = null
    sectionForm = { name: '', teacherIds: [] }
    showSectionForm = true
  }

  function openEditSection(section: Section) {
    editingSectionId = section.id
    sectionForm = {
      name: section.name,
      teacherIds: section.docentes.map((d) => d.id),
    }
    showSectionForm = true
  }

  function toggleTeacherInForm(teacherId: string) {
    if (sectionForm.teacherIds.includes(teacherId)) {
      sectionForm.teacherIds = sectionForm.teacherIds.filter(
        (id) => id !== teacherId,
      )
    } else {
      sectionForm.teacherIds = [...sectionForm.teacherIds, teacherId]
    }
  }

  async function deleteSection(id: string) {
    if (!confirm('¿Estás seguro de eliminar este paralelo?')) return

    const response = await fetch(`/api/admin/sections?id=${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      toast.success('Paralelo eliminado')
      await fetchSections()
    } else {
      const data = await response.json()
      toast.error(data.error || 'Error al eliminar el paralelo')
    }
  }

  async function assignSectionToStudent(
    enrollmentId: string,
    sectionId: string,
  ) {
    const res = await fetch(`/api/admin/inscripciones?id=${enrollmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionId: sectionId || null }),
    })

    if (res.ok) {
      toast.success('Paralelo asignado')
      // Update local state optimistically
      enrollmentsList = enrollmentsList.map((item) => {
        if (item.enrollment.id === enrollmentId) {
          // Track old section for count update
          const oldSectionId = item.enrollment.sectionId

          // Update student count locally
          if (oldSectionId)
            studentCounts[oldSectionId] = Math.max(
              0,
              (studentCounts[oldSectionId] || 0) - 1,
            )

          if (sectionId)
            studentCounts[sectionId] = (studentCounts[sectionId] || 0) + 1

          return {
            ...item,
            enrollment: { ...item.enrollment, sectionId: sectionId || null },
          }
        }
        return item
      })
    } else {
      toast.error('Error al asignar paralelo')
    }
  }
</script>

<div class="panel-header">
  <h2>Gestión de Paralelos</h2>
  <Button onclick={openCreateSection}>+ Nuevo Paralelo</Button>
</div>

{#if sectionsLoading}
  <Loader label="Cargando paralelos..." />
{:else if sectionsList.length === 0}
  <div class="empty-state">
    <p>No hay paralelos creados para este curso.</p>
  </div>
{:else}
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th class="table__th">Nombre</th>
          <th class="table__th">Docentes</th>
          <th class="table__th">Alumnos</th>
          <th class="table__th">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each sectionsList as section}
          <tr>
            <td class="table__td"><strong>{section.name}</strong></td>
            <td class="table__td">
              <div class="docentes-list">
                {#each section.docentes as teacher}
                  <span class="docente-tag"
                    >{teacher.name || teacher.discordUsername}</span
                  >
                {:else}
                  <span class="text-muted">Sin docente</span>
                {/each}
              </div>
            </td>
            <td class="table__td">
              {studentCounts[section.id] || 0}
            </td>
            <td class="table__td">
              <div class="actions-row">
                <Button
                  size="sm"
                  variant="secondary"
                  onclick={() => {
                    assignmentSection = section
                    isStudentModalOpen = true
                  }}
                >
                  Gestionar Alumnos
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onclick={() => openEditSection(section)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onclick={() => deleteSection(section.id)}
                >
                  Eliminar
                </Button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<Modal
  isOpen={showSectionForm}
  title={editingSectionId ? 'Editar Paralelo' : 'Crear Nuevo Paralelo'}
  onClose={() => (showSectionForm = false)}
>
  <form
    class="edit-form"
    onsubmit={(e) => {
      e.preventDefault()
      saveSection()
    }}
  >
    <div class="form-group">
      <label for="sectionName">Nombre del Paralelo *</label>
      <input
        id="sectionName"
        class="form-input"
        bind:value={sectionForm.name}
        required
        placeholder="Ej: Paralelo 1"
      />
    </div>
    <div class="form-group">
      <p>Docentes Asignados (opcional)</p>
      <div class="teacher-selector">
        {#each teachersList as t}
          <label class="teacher-checkbox">
            <input
              type="checkbox"
              checked={sectionForm.teacherIds.includes(t.id)}
              onchange={() => toggleTeacherInForm(t.id)}
            />
            {t.name || t.discordUsername}
          </label>
        {/each}
      </div>
    </div>
    <div class="modal-actions">
      <Button
        type="button"
        variant="secondary"
        onclick={() => (showSectionForm = false)}
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        loading={sectionFormLoading}
        loadingText="Procesando..."
      >
        {editingSectionId ? 'Guardar Cambios' : 'Crear Paralelo'}
      </Button>
    </div>
  </form>
</Modal>

<Modal
  isOpen={isStudentModalOpen}
  title={`Gestionar Alumnos - ${assignmentSection?.name}`}
  onClose={() => (isStudentModalOpen = false)}
>
  <div class="student-management">
    <div class="search-bar">
      <SearchBox
        bind:value={studentSearch}
        placeholder="Buscar alumnos..."
        fullWidth
      />
    </div>

    {#if enrollmentLoading}
      <Loader label="Cargando alumnos..." />
    {:else if enrollmentsList.length === 0}
      <div class="empty-state">
        <p>No se encontraron alumnos aprobados para este curso.</p>
      </div>
    {:else}
      <div class="student-list">
        {#each enrollmentsList as item}
          {@const isAssigned =
            item.enrollment.sectionId === assignmentSection?.id}
          <div class="student-item">
            <div class="student-info">
              <strong>{item.enrollment.fullName}</strong>
              <small class="text-muted">@{item.discordUsername}</small>
              {#if item.enrollment.sectionId && !isAssigned}
                <span class="other-section-tag">
                  En: {sectionsList.find(
                    (s) => s.id === item.enrollment.sectionId,
                  )?.name || 'Otro'}
                </span>
              {/if}
            </div>
            <Button
              size="sm"
              variant={isAssigned ? 'danger' : 'primary'}
              onclick={() =>
                assignSectionToStudent(
                  item.enrollment.id,
                  isAssigned ? '' : assignmentSection?.id || '',
                )}
            >
              {isAssigned ? 'Quitar' : 'Asignar'}
            </Button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Modal>

<style>
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table__th,
  .table__td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  }

  .docente-tag {
    background: rgba(var(--brand-primary-rgb), 0.1);
    color: var(--brand-primary);
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    margin-right: 0.25rem;
  }

  .actions-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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
    background: var(--foreground-color);
    color: var(--text-color-primary);
  }

  .teacher-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
    padding: 0.5rem;
    border: 1px solid rgba(128, 128, 128, 0.1);
    border-radius: 0.375rem;
  }

  .teacher-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-color-secondary);
  }

  .student-management {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 70vh;
  }

  .student-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .student-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid rgba(128, 128, 128, 0.1);
    border-radius: 0.5rem;
    background: var(--foreground-color);
  }

  .student-info {
    display: flex;
    flex-direction: column;
  }

  .other-section-tag {
    font-size: 0.7rem;
    color: var(--text-color-secondary);
    background: rgba(128, 128, 128, 0.1);
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
    width: fit-content;
    margin-top: 0.25rem;
  }

  .text-muted {
    color: var(--text-color-secondary);
    font-size: 0.85em;
  }
</style>
