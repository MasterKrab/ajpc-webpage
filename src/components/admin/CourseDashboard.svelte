<script lang="ts">
  import DeleteConfirmation from './DeleteConfirmation.svelte'
  import Modal from '@components/ui/Modal.svelte'
  import Tabs from '@components/ui/Tabs.svelte'
  import PanelHeader from '@components/ui/PanelHeader.svelte'
  import Select from '@components/ui/Select.svelte'
  import { toast } from 'svelte-sonner'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import InfiniteScroll from '@components/ui/InfiniteScroll.svelte'
  import Loader from '@components/ui/Loader.svelte'

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

  type Section = {
    id: string
    courseId: string
    name: string
    docentes: Teacher[]
  }

  type Teacher = {
    id: string
    discordUsername: string
    name: string | null
  }

  type Module = {
    id: string
    title: string
    materials: {
      id: string
      title: string
      url: string
      type: 'link' | 'document'
    }[]
  }

  import type { Enrollment } from '@db/schema'

  type EnrollmentItem = {
    enrollment: Enrollment & {
      notifiedAt: Date | null
      sectionId: string | null
    }
    courseName: string
    discordUsername: string
  }

  interface Props {
    course: Course
    initialEnrollments: EnrollmentItem[]
    isSudo: boolean
  }

  let { course = $bindable(), initialEnrollments }: Props = $props()

  let enrollmentsList = $state<EnrollmentItem[]>(initialEnrollments)
  let enrollmentTotal = $state(0)
  let enrollmentLoading = $state(false)
  let enrollmentPage = $state(1)
  const ENROLLMENTS_PER_PAGE = 20

  let activeTab = $state<'enrollments' | 'sections' | 'modules' | 'settings'>(
    'enrollments',
  )
  let actionLoading = $state<string | null>(null)
  let isDeleteModalOpen = $state(false)
  let updateLoading = $state(false)

  let sectionsList = $state<Section[]>([])

  const sectionOptions = $derived([
    { value: '', label: 'Sin asignar' },
    ...sectionsList.map((s) => ({ value: s.id, label: s.name })),
  ])
  let teachersList = $state<Teacher[]>([])
  let sectionsLoading = $state(false)
  let showSectionForm = $state(false)
  let sectionFormLoading = $state(false)
  let editingSectionId = $state<string | null>(null)
  let sectionForm = $state({
    name: '',
    teacherIds: [] as string[],
  })

  // Modules state
  let modulesList = $state<Module[]>([])
  let modulesLoading = $state(false)
  let isModuleModalOpen = $state(false)
  let newModuleTitle = $state('')
  let isMaterialModalOpen = $state(false)
  let selectedModule = $state<Module | null>(null)
  let newMaterial = $state({
    title: '',
    url: '',
    type: 'link' as 'link' | 'document',
  })

  let isStudentModalOpen = $state(false)
  let assignmentSection = $state<Section | null>(null)
  let studentSearch = $state('')

  const filteredStudentsForAssignment = $derived(
    enrollmentsList.filter(
      (e) =>
        e.enrollment.status === 'approved' &&
        (e.enrollment.fullName
          .toLowerCase()
          .includes(studentSearch.toLowerCase()) ||
          e.discordUsername
            .toLowerCase()
            .includes(studentSearch.toLowerCase())),
    ),
  )

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

  async function refreshEnrollments(page = 1, append = false) {
    if (!append) enrollmentLoading = true
    const response = await fetch(
      `/api/admin/inscripciones?courseId=${course.id}&page=${page}&limit=${ENROLLMENTS_PER_PAGE}`,
    )
    const data = await response.json()

    if (append)
      enrollmentsList = [...enrollmentsList, ...(data.enrollments || [])]
    else enrollmentsList = data.enrollments || []

    enrollmentTotal = data.total || 0
    enrollmentPage = page
    enrollmentLoading = false
  }

  let hasRequestedEnrollments = false

  $effect(() => {
    if (
      activeTab === 'enrollments' &&
      enrollmentTotal === 0 &&
      !hasRequestedEnrollments &&
      !enrollmentLoading
    ) {
      hasRequestedEnrollments = true
      refreshEnrollments(1, false)
    }
  })

  async function fetchSections() {
    sectionsLoading = true
    const response = await fetch(`/api/admin/sections?courseId=${course.id}`)
    sectionsList = await response.json()
    sectionsLoading = false
  }

  async function fetchTeachers() {
    const response = await fetch('/api/admin/users?role=docente')
    teachersList = await response.json()
  }

  async function fetchModules() {
    modulesLoading = true
    const response = await fetch(`/api/docente/modules?courseId=${course.id}`)
    modulesList = await response.json()
    modulesLoading = false
  }

  async function createModule() {
    if (!newModuleTitle.trim()) return
    const response = await fetch('/api/docente/modules', {
      method: 'POST',
      body: JSON.stringify({
        courseId: course.id,
        title: newModuleTitle,
      }),
    })
    if (!response.ok) return

    toast.success('Módulo creado')
    isModuleModalOpen = false
    newModuleTitle = ''
    fetchModules()
  }

  async function addMaterial() {
    if (!newMaterial.title.trim() || !newMaterial.url.trim() || !selectedModule)
      return
    const response = await fetch('/api/docente/modules?action=material', {
      method: 'POST',
      body: JSON.stringify({ moduleId: selectedModule.id, ...newMaterial }),
    })

    if (!response.ok) return

    toast.success('Material agregado')
    isMaterialModalOpen = false
    newMaterial = { title: '', url: '', type: 'link' }
    fetchModules()
  }

  async function deleteModuleItem(id: string, type: 'module' | 'material') {
    if (!confirm('¿Seguro?')) return
    const response = await fetch(`/api/docente/modules?id=${id}&type=${type}`, {
      method: 'DELETE',
    })
    if (!response.ok) return

    toast.success('Eliminado')
    fetchModules()
  }

  $effect(() => {
    if (activeTab === 'sections') {
      fetchSections()
      fetchTeachers()
    } else if (activeTab === 'modules') {
      fetchModules()
    }
  })

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

  async function saveSection() {
    sectionFormLoading = true
    const isEditing = !!editingSectionId
    const url = isEditing
      ? `/api/admin/sections?id=${editingSectionId}`
      : '/api/admin/sections'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sectionForm,
        courseId: course.id,
      }),
    })

    if (res.ok) {
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
      await refreshEnrollments()
    } else {
      toast.error('Error al asignar paralelo')
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

  const hasMoreEnrollments = $derived(enrollmentsList.length < enrollmentTotal)

  const tabs = $derived([
    {
      id: 'enrollments',
      label: 'Inscripciones',
      count: enrollmentTotal,
    },
    { id: 'sections', label: 'Paralelos' },
    { id: 'modules', label: 'Módulos' },
    { id: 'settings', label: 'Configuración' },
  ])
</script>

<div class="course-dash">
  <PanelHeader title={course.name} onBack={() => window.history.back()}>
    {#snippet extra()}
      <div class="course-header__badges">
        <span class="badge badge--level">{levelLabel(course.level)}</span>
        <span class="badge badge--year">{course.year}</span>
        <span class="badge badge--status status--{course.status}">
          {course.status === 'open' ? 'Abierto' : 'Cerrado'}
        </span>
      </div>
    {/snippet}
    <Tabs {tabs} bind:activeTab />
  </PanelHeader>

  <main class="course-content">
    {#if activeTab === 'enrollments'}
      <SubHeader title="Inscripciones">
        {#snippet actions()}
          <SearchBox
            bind:value={studentSearch}
            placeholder="Buscar inscritos..."
          />
        {/snippet}
      </SubHeader>

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

      <DashboardContent padding={false}>
        {#if enrollmentsList.length === 0 && !enrollmentLoading}
          <div class="empty-state">
            <p>No hay estudiantes inscritos en este curso.</p>
          </div>
        {:else}
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Info</th>
                  <th>Estado</th>
                  <th>Paralelo</th>
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
                      <span
                        class="status-pill status--{item.enrollment.status}"
                      >
                        {statusLabel(item.enrollment.status)}
                      </span>
                    </td>
                    <td>
                      <Select
                        options={sectionOptions}
                        value={item.enrollment.sectionId || ''}
                        onChange={(val) =>
                          assignSectionToStudent(item.enrollment.id, val)}
                        placeholder=""
                      />
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

          {#if enrollmentLoading && enrollmentsList.length === 0}
            <div class="loading-state">
              <Loader label="Cargando inscripciones..." />
            </div>
          {/if}

          {#if hasMoreEnrollments}
            <InfiniteScroll
              hasMore={hasMoreEnrollments}
              loading={enrollmentLoading}
              onLoadMore={() => refreshEnrollments(enrollmentPage + 1, true)}
            />
          {/if}
        {/if}
      </DashboardContent>
    {:else if activeTab === 'sections'}
      <section class="sections">
        <div class="panel-header">
          <h2>Gestión de Paralelos</h2>
          <button class="button button--primary" onclick={openCreateSection}>
            + Nuevo Paralelo
          </button>
        </div>

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
              <button
                type="button"
                class="button"
                onclick={() => (showSectionForm = false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="button button--primary"
                disabled={sectionFormLoading}
              >
                {sectionFormLoading
                  ? editingSectionId
                    ? 'Guardando...'
                    : 'Creando...'
                  : editingSectionId
                    ? 'Guardar Cambios'
                    : 'Crear Paralelo'}
              </button>
            </div>
          </form>
        </Modal>

        {#if sectionsLoading}
          <div class="loading-state">
            <Loader label="Cargando paralelos..." />
          </div>
        {:else if sectionsList.length === 0}
          <div class="empty-state">
            <p>No hay paralelos creados para este curso.</p>
          </div>
        {:else}
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Docentes</th>
                  <th>Alumnos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {#each sectionsList as s}
                  <tr>
                    <td><strong>{s.name}</strong></td>
                    <td>
                      <div class="docentes-list">
                        {#each s.docentes as d}
                          <span class="docente-tag"
                            >{d.name || d.discordUsername}</span
                          >
                        {:else}
                          <span class="text-muted">Sin docente</span>
                        {/each}
                      </div>
                    </td>
                    <td>
                      {enrollmentsList.filter(
                        (e) => e.enrollment.sectionId === s.id,
                      ).length}
                    </td>
                    <td class="actions-cell">
                      <button
                        class="button button--small"
                        onclick={() => {
                          assignmentSection = s
                          isStudentModalOpen = true
                        }}
                      >
                        Gestionar Alumnos
                      </button>
                      <button
                        class="button button--small"
                        onclick={() => openEditSection(s)}
                      >
                        Editar
                      </button>
                      <button
                        class="button button--small button-danger"
                        onclick={() => deleteSection(s.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    {:else if activeTab === 'modules'}
      <section class="modules-panel">
        <div class="panel-header">
          <h2>Módulos y Materiales</h2>
          <button
            class="button button--primary"
            onclick={() => (isModuleModalOpen = true)}>+ Nuevo Módulo</button
          >
        </div>

        {#if modulesLoading}
          <div class="loading-state">
            <Loader label="Cargando módulos..." />
          </div>
        {:else if modulesList.length === 0}
          <div class="empty-state">
            <p>No hay módulos creados para este curso.</p>
          </div>
        {:else}
          <div class="modules-grid">
            {#each modulesList as mod}
              <div class="module-card">
                <header class="module-card__header">
                  <h3 id="module" class="module-card__title">{mod.title}</h3>
                  <button
                    class="button button--icon-danger"
                    onclick={() => deleteModuleItem(mod.id, 'module')}
                    aria-label="Eliminar módulo">×</button
                  >
                </header>

                <ul class="materials-list">
                  {#each mod.materials as mat}
                    <li>
                      <a
                        href={mat.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        >{mat.type === 'document' ? '📄' : '🔗'} {mat.title}</a
                      >
                      <button
                        class="button button--icon-danger button--tiny"
                        onclick={() => deleteModuleItem(mat.id, 'material')}
                        aria-label="Eliminar material">×</button
                      >
                    </li>
                  {/each}
                  <li>
                    <button
                      class="button button--link button--small"
                      onclick={() => {
                        selectedModule = mod
                        isMaterialModalOpen = true
                      }}>+ Agregar material</button
                    >
                  </li>
                </ul>
              </div>
            {/each}
          </div>
        {/if}
      </section>
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
                <Select
                  options={[
                    { value: 'beginner', label: 'Básico' },
                    { value: 'intermediate', label: 'Intermedio' },
                    { value: 'advanced', label: 'Avanzado' },
                  ]}
                  bind:value={editForm.level}
                  placeholder=""
                />
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
                <Select
                  options={[
                    { value: 'open', label: 'Abierto' },
                    { value: 'closed', label: 'Cerrado' },
                  ]}
                  bind:value={editForm.status}
                  placeholder=""
                />
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

<Modal
  isOpen={isModuleModalOpen}
  title="Crear Nuevo Módulo"
  onClose={() => (isModuleModalOpen = false)}
>
  <div class="form-modal">
    <div class="form-group">
      <label for="modTitle">Título del Módulo</label>
      <input
        id="modTitle"
        type="text"
        bind:value={newModuleTitle}
        placeholder="Ej: Clase 1: Introducción"
      />
    </div>
    <div class="modal-actions">
      <button class="button" onclick={() => (isModuleModalOpen = false)}
        >Cancelar</button
      >
      <button class="button button--primary" onclick={createModule}
        >Crear</button
      >
    </div>
  </div>
</Modal>

<Modal
  isOpen={isMaterialModalOpen}
  title="Agregar Material a: {selectedModule?.title}"
  onClose={() => (isMaterialModalOpen = false)}
>
  <div class="form-modal">
    <div class="form-group">
      <label for="matTitle">Título</label>
      <input
        id="matTitle"
        type="text"
        bind:value={newMaterial.title}
        placeholder="Ej: Diapositivas"
      />
    </div>
    <div class="form-group">
      <label for="matUrl">URL (Link)</label>
      <input
        id="matUrl"
        type="url"
        bind:value={newMaterial.url}
        placeholder="https://..."
      />
    </div>
    <div class="form-group">
      <label for="matType">Tipo de Material</label>
      <select id="matType" class="form-input" bind:value={newMaterial.type}>
        <option value="link">🔗 Enlace página web</option>
        <option value="document">📄 Documento / Recurso</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="button" onclick={() => (isMaterialModalOpen = false)}
        >Cancelar</button
      >
      <button class="button button--primary" onclick={addMaterial}
        >Agregar</button
      >
    </div>
  </div>
</Modal>

<Modal
  isOpen={isStudentModalOpen}
  title="Gestionar Alumnos: {assignmentSection?.name}"
  onClose={() => (isStudentModalOpen = false)}
>
  <div class="student-assignment">
    <div class="form-group">
      <input
        type="text"
        class="form-input"
        placeholder="Buscar estudiante..."
        bind:value={studentSearch}
      />
    </div>

    <div class="students-scroll-list">
      {#each filteredStudentsForAssignment as item}
        {@const isInSection =
          item.enrollment.sectionId === assignmentSection?.id}
        {@const currentSection = sectionsList.find(
          (s) => s.id === item.enrollment.sectionId,
        )}

        <div class="student-assignment-item" class:is-active={isInSection}>
          <div class="student-info">
            <strong>{item.enrollment.fullName}</strong>
            <small class="text-muted">
              {currentSection
                ? `Asignado a: ${currentSection.name}`
                : 'Sin asignar'}
            </small>
          </div>
          <button
            class="button button--small"
            class:button--primary={!isInSection}
            onclick={() =>
              assignSectionToStudent(
                item.enrollment.id,
                isInSection ? '' : assignmentSection?.id || '',
              )}
          >
            {isInSection ? 'Quitar' : 'Asignar'}
          </button>
        </div>
      {:else}
        <p class="empty-state">No se encontraron estudiantes aprobados.</p>
      {/each}
    </div>
  </div>
</Modal>

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
    background-color: var(
      --color-success-background-color,
      var(--color-success-bg)
    );
    color: var(--color-success-text-color, var(--color-success-text));
  }
  .status--closed {
    background-color: var(
      --color-danger-background-color,
      var(--color-danger-bg)
    );
    color: var(--color-danger-text-color, var(--color-danger-text));
  }

  .table-wrapper {
    overflow-x: auto;
  }
  .table {
    width: 100%;
    border-collapse: collapse;
  }
  .table th,
  .table td {
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
    background-color: var(
      --color-success-background-color,
      var(--color-success-bg)
    );
    color: var(--color-success-text-color, var(--color-success-text));
  }
  .status--rejected {
    background-color: var(
      --color-danger-background-color,
      var(--color-danger-bg)
    );
    color: var(--color-danger-text-color, var(--color-danger-text));
  }
  .status--pending {
    background-color: var(
      --color-warning-background-color,
      var(--color-warning-bg)
    );
    color: var(--color-warning-text-color, var(--color-warning-text));
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
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
  }

  .form-input--small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8125rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-color-primary);
  }

  .button--primary {
    background: var(--brand-primary);
    color: white;
  }

  .button--danger {
    background: #dc3545;
    color: white;
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
  .teacher-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    background: var(--background-color);
  }

  .teacher-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .teacher-checkbox:hover {
    background-color: rgba(128, 128, 128, 0.05);
  }

  .docentes-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .docente-tag {
    background: rgba(var(--brand-primary-rgb), 0.1);
    color: var(--brand-primary);
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .modules-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .panel-header h2 {
    margin: 0;
  }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .module-card {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: var(--shadow-sm);
  }

  .module-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .module-card__title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .materials-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .materials-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid rgba(128, 128, 128, 0.05);
  }

  .materials-list a {
    color: var(--brand-primary);
    text-decoration: none;
    font-weight: 500;
  }

  .materials-list a:hover {
    text-decoration: underline;
  }

  .button--tiny {
    padding: 0.1rem 0.3rem;
    font-size: 0.75rem;
  }
  .student-assignment {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .students-scroll-list {
    max-height: 400px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-right: 0.5rem;
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
  }

  .student-assignment-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--background-color);
    transition: all 0.2s;
  }

  .student-assignment-item.is-active {
    background: rgba(var(--brand-primary-rgb), 0.05);
    border-color: var(--brand-primary);
  }

  .student-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .student-info strong {
    font-size: 0.95rem;
  }
</style>
