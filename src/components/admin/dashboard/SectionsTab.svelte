<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Modal from '@components/ui/Modal.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import Button from '@components/ui/Button.svelte'
  import MultiSelect from '@components/ui/MultiSelect.svelte'

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

  // Unified Management Modal
  let isManageModalOpen = $state(false)
  let activeTab = $state<'general' | 'teachers' | 'students'>('general')
  let sectionFormLoading = $state(false)
  let editingSectionId = $state<string | null>(null)
  let selectedSection = $state<Section | null>(null)

  let sectionForm = $state({
    name: '',
    teacherIds: [] as string[],
  })

  let studentSearch = $state('')
  let teacherSearch = $state('')
  let enrollmentsList = $state<any[]>([])
  let enrollmentLoading = $state(false)

  async function fetchStudents() {
    enrollmentLoading = true
    const response = await fetch(
      `/api/admin/inscripciones?courseId=${courseId}&status=approved&search=${studentSearch}&limit=100`,
    )
    const data = await response.json()
    if (response.ok) {
      enrollmentsList = data.enrollments || []
    } else {
      toast.error('Error al cargar alumnos')
    }
    enrollmentLoading = false
  }

  $effect(() => {
    if (isManageModalOpen && activeTab === 'students') {
      fetchStudents()
    }
  })

  // Debounced search for students
  let searchTimeout: any
  $effect(() => {
    if (
      isManageModalOpen &&
      activeTab === 'students' &&
      studentSearch !== undefined
    ) {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        fetchStudents()
      }, 300)
    }
  })

  async function fetchSections() {
    sectionsLoading = true
    const response = await fetch(`/api/admin/sections?courseId=${courseId}`)
    if (response.ok) {
      sectionsList = await response.json()
    } else {
      toast.error('Error al cargar paralelos')
    }
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
        activeTab === 'teachers'
          ? 'Lista de docentes actualizada'
          : isEditing
            ? 'Paralelo actualizado'
            : 'Paralelo creado',
      )
      // If creating new, close modal. If editing, we stay in the modal.
      if (!isEditing) isManageModalOpen = false

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
    selectedSection = null
    sectionForm = { name: '', teacherIds: [] }
    activeTab = 'general'
    isManageModalOpen = true
  }

  function openManageSection(
    section: Section,
    tab: 'general' | 'teachers' | 'students' = 'general',
  ) {
    editingSectionId = section.id
    selectedSection = section
    sectionForm = {
      name: section.name,
      teacherIds: section.docentes.map((d) => d.id),
    }
    activeTab = tab
    isManageModalOpen = true
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
          <th class="table__header">Nombre</th>
          <th class="table__header">Docentes</th>
          <th class="table__header">Alumnos</th>
          <th class="table__header">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each sectionsList as section}
          <tr class="table__row">
            <td class="table__cell"><strong>{section.name}</strong></td>
            <td class="table__cell">
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
            <td class="table__cell">
              {studentCounts[section.id] || 0}
            </td>
            <td class="table__cell">
              <div class="actions-row">
                <Button
                  size="sm"
                  variant="secondary"
                  onclick={() => openManageSection(section, 'students')}
                >
                  Alumnos
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onclick={() => openManageSection(section, 'general')}
                >
                  Gestionar
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
  isOpen={isManageModalOpen}
  title={editingSectionId
    ? `Gestionar Paralelo - ${sectionForm.name}`
    : 'Crear Nuevo Paralelo'}
  onClose={() => (isManageModalOpen = false)}
  size={activeTab === 'students' ? 'lg' : 'md'}
>
  {#if editingSectionId}
    <div class="tabs-header">
      <button
        class="tab-btn"
        class:tab-btn--active={activeTab === 'general'}
        onclick={() => (activeTab = 'general')}
      >
        ⚙️ Configuración
      </button>
      <button
        class="tab-btn"
        class:tab-btn--active={activeTab === 'teachers'}
        onclick={() => (activeTab = 'teachers')}
      >
        🎓 Docentes
      </button>
      <button
        class="tab-btn"
        class:tab-btn--active={activeTab === 'students'}
        onclick={() => (activeTab = 'students')}
      >
        👥 Estudiantes ({studentCounts[editingSectionId] || 0})
      </button>
    </div>
  {/if}

  <div
    class="modal-content"
    class:modal-content--students={activeTab === 'students'}
  >
    {#if activeTab === 'general'}
      <form
        class="manage-form"
        onsubmit={(event) => {
          event.preventDefault()
          saveSection()
        }}
      >
        <div class="form-group">
          <label class="form-label" for="sectionName"
            >Nombre del Paralelo *</label
          >
          <input
            id="sectionName"
            class="form-input"
            bind:value={sectionForm.name}
            required
            placeholder="Ej: Paralelo 1"
          />
        </div>

        {#if !editingSectionId}
          <div class="form-group">
            <span class="form-label">Docentes</span>
            <p class="text-muted">
              Podrás gestionar los docentes después de crear el paralelo.
            </p>
          </div>
        {/if}

        <div class="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onclick={() => (isManageModalOpen = false)}
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
    {:else if activeTab === 'teachers'}
      <div class="teacher-management">
        <div class="search-bar">
          <SearchBox
            bind:value={teacherSearch}
            placeholder="Buscar docentes..."
            fullWidth
          />
        </div>

        <div class="teacher-list">
          {#each teachersList.filter((t) => !teacherSearch || t.name
                ?.toLowerCase()
                .includes(teacherSearch.toLowerCase()) || t.discordUsername
                .toLowerCase()
                .includes(teacherSearch.toLowerCase())) as teacher}
            {@const isAssigned = sectionForm.teacherIds.includes(teacher.id)}
            <div class="teacher-item" class:teacher-item--assigned={isAssigned}>
              <div class="teacher-info">
                <span class="teacher-info__name"
                  >{teacher.name || teacher.discordUsername}</span
                >
                {#if teacher.name}
                  <small class="teacher-info__discord"
                    >@{teacher.discordUsername}</small
                  >
                {/if}
              </div>
              <Button
                size="sm"
                variant={isAssigned ? 'danger' : 'primary'}
                onclick={() => {
                  if (isAssigned) {
                    sectionForm.teacherIds = sectionForm.teacherIds.filter(
                      (id) => id !== teacher.id,
                    )
                  } else {
                    sectionForm.teacherIds = [
                      ...sectionForm.teacherIds,
                      teacher.id,
                    ]
                  }
                }}
              >
                {isAssigned ? 'Quitar' : 'Asignar'}
              </Button>
            </div>
          {/each}
        </div>

        <div class="modal-actions">
          <Button
            onclick={saveSection}
            loading={sectionFormLoading}
            loadingText="Guardando..."
          >
            Guardar Cambios
          </Button>
        </div>
      </div>
    {:else if activeTab === 'students'}
      <div class="student-management">
        <div class="search-bar">
          <SearchBox
            bind:value={studentSearch}
            placeholder="Buscar alumnos por nombre o discord..."
            fullWidth
          />
        </div>

        {#if enrollmentLoading}
          <div class="loader-container">
            <Loader label="Cargando alumnos..." />
          </div>
        {:else if enrollmentsList.length === 0}
          <div class="empty-state">
            <p>No se encontraron alumnos aprobados para este curso.</p>
          </div>
        {:else}
          <div class="student-list">
            {#each enrollmentsList as item}
              {@const isAssigned =
                item.enrollment.sectionId === editingSectionId}
              <div
                class="student-item"
                class:student-item--assigned={isAssigned}
              >
                <div class="student-info">
                  <span class="student-info__name"
                    >{item.enrollment.fullName}</span
                  >
                  <small class="student-info__discord"
                    >@{item.discordUsername}</small
                  >
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
                      isAssigned ? '' : editingSectionId || '',
                    )}
                >
                  {isAssigned ? 'Quitar' : 'Asignar'}
                </Button>
              </div>
            {/each}
          </div>
        {/if}
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

  .table__cell {
    font-size: 0.9375rem;
  }

  .docentes-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .docente-tag {
    background: rgba(var(--brand-primary-rgb), 0.1);
    color: var(--brand-primary);
    padding: 0.2rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid rgba(var(--brand-primary-rgb), 0.2);
  }

  .actions-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* Tabs UI */
  .tabs-header {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.25rem;
  }

  .tab-btn {
    padding: 0.625rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    border-radius: 0.375rem 0.375rem 0 0;
  }

  .tab-btn:hover {
    color: var(--brand-primary);
    background: var(--border-color-light);
  }

  .tab-btn--active {
    color: var(--brand-primary);
    border-bottom-color: var(--brand-primary);
    background: rgba(var(--brand-primary-rgb), 0.05);
  }

  /* Form & Content */
  .modal-content {
    min-height: 25rem;
    display: flex;
    flex-direction: column;
  }

  .modal-content--students {
    min-height: 40rem;
  }

  .manage-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-primary);
  }

  .form-input {
    padding: 0.625rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--foreground-color);
    color: var(--text-color-primary);
    font-family: inherit;
    transition: border-color 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 2px rgba(var(--brand-primary-rgb), 0.1);
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color-light);
  }

  .empty-state {
    padding: 4rem 2rem;
    text-align: center;
    color: var(--text-color-secondary);
    background: var(--foreground-color);
    border-radius: 0.75rem;
    border: 1px dashed var(--border-color);
  }

  /* Student Management */
  .student-management {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-height: 60vh;
  }

  .search-bar {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--foreground-color);
  }

  .loader-container {
    padding: 2rem;
    display: flex;
    justify-content: center;
  }

  .student-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .student-item--assigned,
  .teacher-item--assigned {
    border-left: 4px solid var(--brand-primary);
    background: rgba(var(--brand-primary-rgb), 0.02);
  }

  .student-info,
  .teacher-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .student-info__name,
  .teacher-info__name {
    font-weight: 600;
    font-size: 0.9375rem;
  }

  .student-info__discord,
  .teacher-info__discord {
    color: var(--text-color-secondary);
    font-size: 0.8125rem;
  }

  .teacher-management {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-height: 60vh;
  }

  .teacher-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .teacher-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    background: var(--foreground-color);
    transition: all 0.2s;
  }

  .teacher-item:hover {
    border-color: var(--brand-primary);
    background: rgba(var(--brand-primary-rgb), 0.02);
  }

  .other-section-tag {
    font-size: 0.7rem;
    color: var(--color-warning-text);
    background: var(--color-warning-bg);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    width: fit-content;
    margin-top: 0.375rem;
    font-weight: 600;
  }

  .text-muted {
    color: var(--text-color-secondary);
    font-size: 0.85em;
  }
</style>
