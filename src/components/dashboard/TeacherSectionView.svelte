<script lang="ts">
  import Modal from '@components/ui/Modal.svelte'
  import Tabs from '@components/ui/Tabs.svelte'
  import PanelHeader from '@components/ui/PanelHeader.svelte'
  import Select from '@components/ui/Select.svelte'
  import { toast } from 'svelte-sonner'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import UserTable from '@components/ui/UserTable.svelte'
  import type { Student } from '@app-types/users'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import ModuleCard from '@components/ui/ModuleCard.svelte'
  import ConfirmModal from '@components/ui/ConfirmModal.svelte'
  import Button from '@components/ui/Button.svelte'
  import type { Module } from '@app-types/modules'

  type Section = {
    id: string
    name: string
    courseId: string
    courseName: string
    studentCount: number
  }

  type Observation = {
    id: string
    observation: string
    createdAt: string
  }

  type Attendance = {
    studentId: string
    status: 'present' | 'absent' | 'late' | 'excused'
  }

  let {
    section,
    isAdmin,
    onBack,
  }: {
    section: Section
    isAdmin: boolean
    onBack: () => void
  } = $props()

  let activeTab = $state<'modules' | 'attendance' | 'students'>('modules')
  let modulesList = $state<Module[]>([])
  let modulesLoading = $state(false)

  let selectedStudent = $state<Student | null>(null)
  let observationsList = $state<Observation[]>([])
  let observationsLoading = $state(false)
  let savingObservation = $state(false)
  let newObservation = $state('')
  let isObservationModalOpen = $state(false)

  let selectedModule = $state<Module | null>(null)
  let isMaterialModalOpen = $state(false)
  let newMaterial = $state({
    title: '',
    url: '',
    type: 'link' as 'link' | 'document',
  })

  let isModuleModalOpen = $state(false)
  let editingModuleId = $state<string | null>(null)
  let newModule = $state({
    title: '',
    description: '',
  })

  let confirmModal = $state({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'primary' as 'primary' | 'danger',
  })

  let studentsList = $state<Student[]>([])
  let studentsTotal = $state(0)
  let studentsLoading = $state(false)
  let studentsPage = $state(1)
  const STUDENTS_PER_PAGE = 20

  let attendanceList = $state<Attendance[]>([])
  let attendanceTotal = $state(0)
  let attendanceLoading = $state(false)
  let attendancePage = $state(1)
  const ATTENDANCE_PER_PAGE = 50

  let currentAttendance = $state<Attendance[]>([])

  let studentSearchQuery = $state('')

  const hasMoreStudents = $derived(studentsList.length < studentsTotal)
  const hasMoreAttendance = $derived(attendanceList.length < attendanceTotal)

  const tabs = [
    { id: 'modules', label: 'Contenidos', icon: '📚' },
    { id: 'attendance', label: 'Asistencia', icon: '📝' },
    { id: 'students', label: 'Alumnos', icon: '👥' },
  ]

  let selectedModuleId = $state('')

  $effect(() => {
    const mod = modulesList.find((m) => m.id === selectedModuleId)
    if (mod) selectModuleForAttendance(mod)
  })

  async function fetchModules() {
    modulesLoading = true
    try {
      const response = await fetch(
        `/api/docente/modules?courseId=${section.courseId}`,
      )
      modulesList = await response.json()
    } catch (error) {
      console.error(error)
    } finally {
      modulesLoading = false
    }
  }

  const fetchStudents = async (page = 1, append = false) => {
    if (!append) studentsLoading = true
    const searchParam = studentSearchQuery
      ? `&search=${encodeURIComponent(studentSearchQuery)}`
      : ''
    const response = await fetch(
      `/api/docente/students?sectionId=${section.id}&page=${page}&limit=${STUDENTS_PER_PAGE}${searchParam}`,
    )
    const data = await response.json()

    if (append) {
      studentsList = [...studentsList, ...(data.students || [])]
    } else {
      studentsList = data.students || []
    }
    studentsTotal = data.total || 0
    studentsPage = page
    studentsLoading = false
  }

  let hasRequestedStudents = false
  let hasRequestedAttendance = false

  let lastSearch = ''
  $effect(() => {
    if (activeTab === 'students' || activeTab === 'attendance') {
      if (studentSearchQuery !== lastSearch) {
        const timer = setTimeout(() => {
          lastSearch = studentSearchQuery
          fetchStudents(1, false)
        }, 400)
        return () => clearTimeout(timer)
      }
    }
  })

  $effect(() => {
    if (
      (activeTab === 'students' || activeTab === 'attendance') &&
      studentsList.length === 0 &&
      !hasRequestedStudents &&
      !studentsLoading
    ) {
      hasRequestedStudents = true
      fetchStudents(1, false)
    }
  })

  $effect(() => {
    if (
      activeTab === 'attendance' &&
      attendanceList.length === 0 &&
      !hasRequestedAttendance &&
      !attendanceLoading
    ) {
      hasRequestedAttendance = true
      fetchAttendance(1, false)
    }
  })

  async function openObservations(student: Student) {
    selectedStudent = student
    isObservationModalOpen = true
    observationsLoading = true
    const res = await fetch(
      `/api/docente/observations?studentId=${student.id}&courseId=${section.courseId}`,
    )
    observationsList = await res.json()
    observationsLoading = false
  }

  async function saveObservation() {
    if (!newObservation.trim() || !selectedStudent) return
    savingObservation = true
    const response = await fetch('/api/docente/observations', {
      method: 'POST',
      body: JSON.stringify({
        studentId: selectedStudent.id,
        courseId: section.courseId,
        observation: newObservation,
      }),
    })

    if (response.ok) {
      toast.success('Observación guardada')
      newObservation = ''
      const updated = await fetch(
        `/api/docente/observations?studentId=${selectedStudent.id}&courseId=${section.courseId}`,
      )
      observationsList = await updated.json()
    } else {
      toast.error('Error al guardar la observación')
    }
    savingObservation = false
  }

  async function fetchAttendance(page = 1, append = false) {
    if (!selectedModule) return
    if (!append) attendanceLoading = true
    const response = await fetch(
      `/api/docente/attendance?moduleId=${selectedModule.id}&sectionId=${section.id}&page=${page}&limit=${ATTENDANCE_PER_PAGE}`,
    )
    const data = await response.json()

    if (append) {
      attendanceList = [...attendanceList, ...(data.attendance || [])]
    } else {
      attendanceList = data.attendance || []
    }
    attendanceTotal = data.total || 0
    attendancePage = page
    attendanceLoading = false
  }

  async function selectModuleForAttendance(mod: Module) {
    selectedModule = mod
    attendancePage = 1
    await fetchAttendance(1, false)
  }

  async function saveAttendance(studentId: string, status: string) {
    if (!selectedModule) return
    const response = await fetch('/api/docente/attendance', {
      method: 'POST',
      body: JSON.stringify({
        moduleId: selectedModule.id,
        sectionId: section.id,
        studentId,
        status,
      }),
    })

    if (response.ok) {
      const entry = attendanceList.find((a) => a.studentId === studentId)
      if (entry) {
        entry.status = status as any
      } else {
        attendanceList = [
          ...attendanceList,
          { studentId, status, moduleId: selectedModule.id } as any,
        ]
      }

      const statusLabels: Record<string, string> = {
        present: 'Presente',
        absent: 'Ausente',
        late: 'Atraso',
        excused: 'Justificado',
      }

      toast.success(`Asistencia: ${statusLabels[status] || status}`, {
        description: `La asistencia de ${studentsList.find((s) => s.id === studentId)?.name || 'alumno'} ha sido actualizada a ${statusLabels[status] || status}.`,
        duration: 2000,
      })
    } else {
      toast.error('Error al actualizar asistencia')
    }
  }

  async function saveModule() {
    if (!newModule.title.trim() || !editingModuleId) return
    const response = await fetch(`/api/docente/modules?id=${editingModuleId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        courseId: section.courseId,
        ...newModule,
      }),
    })
    if (!response.ok) return

    toast.success('Módulo actualizado')
    isModuleModalOpen = false
    editingModuleId = null
    fetchModules()
  }

  function openEditModule(mod: Module) {
    editingModuleId = mod.id
    newModule = {
      title: mod.title,
      description: mod.description || '',
    }
    isModuleModalOpen = true
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
    confirmModal = {
      open: true,
      title: type === 'module' ? 'Eliminar Módulo' : 'Eliminar Material',
      message:
        type === 'module'
          ? '¿Estás seguro de que deseas eliminar este módulo y todo su contenido? Esta acción no se puede deshacer.'
          : '¿Estás seguro de que deseas eliminar este material?',
      type: 'danger',
      onConfirm: async () => {
        const response = await fetch(
          `/api/docente/modules?id=${id}&type=${type}`,
          {
            method: 'DELETE',
          },
        )
        if (!response.ok) return

        toast.success('Eliminado')
        confirmModal.open = false
        fetchModules()
      },
    }
  }

  const getAttendanceClass = (status: string | undefined) => {
    if (!status) return ''
    return `attendance-select--${status}`
  }

  const moduleOptions = $derived(
    modulesList.map(({ id, title }) => ({ value: id, label: title })),
  )

  $effect(() => {
    fetchModules()
  })
</script>

<div class="section-dashboard">
  <PanelHeader title={section.name} subtitle={section.courseName} {onBack}>
    <Tabs {tabs} bind:activeTab />
  </PanelHeader>

  <main class="dashboard-content">
    {#if activeTab === 'students'}
      <SubHeader title="Alumnos">
        {#snippet actions()}
          <SearchBox
            bind:value={studentSearchQuery}
            placeholder="Buscar alumnos..."
          />
        {/snippet}
      </SubHeader>

      <DashboardContent padding={false}>
        <UserTable
          users={studentsList}
          loading={studentsLoading}
          hasMore={hasMoreStudents}
          onLoadMore={() => fetchStudents(studentsPage + 1, true)}
        >
          {#snippet actions(student)}
            <Button size="sm" onclick={() => openObservations(student)}>
              📝 Observaciones
            </Button>
          {/snippet}
        </UserTable>
      </DashboardContent>
    {:else if activeTab === 'modules'}
      <div class="modules-manager">
        {#if modulesLoading}
          <Loader label="Cargando módulos..." />
        {:else if modulesList.length === 0}
          <div class="empty-state">
            <p>No hay módulos creados aún.</p>
          </div>
        {:else}
          <div class="modules-grid">
            {#each modulesList as mod}
              <ModuleCard
                module={mod}
                {isAdmin}
                onAddMaterial={() => {
                  selectedModule = mod
                  isMaterialModalOpen = true
                }}
                onDeleteMaterial={(id) => deleteModuleItem(id, 'material')}
                onDeleteModule={() => deleteModuleItem(mod.id, 'module')}
                onEditModule={() => openEditModule(mod)}
              />
            {/each}
          </div>
        {/if}
      </div>
    {:else if activeTab === 'attendance'}
      <div class="attendance-container">
        <SubHeader title="Asistencia">
          {#snippet actions()}
            <Select
              options={moduleOptions}
              bind:value={selectedModuleId}
              placeholder="Selecciona un módulo..."
            />
            <SearchBox
              bind:value={studentSearchQuery}
              placeholder="Filtrar por nombre..."
            />
          {/snippet}
        </SubHeader>

        <DashboardContent padding={false}>
          {#if !selectedModule}
            <div class="empty-state">
              <p>Selecciona un módulo para registrar la asistencia.</p>
            </div>
          {:else}
            <UserTable users={studentsList} loading={studentsLoading}>
              {#snippet actions(student)}
                {@const attendanceEntry = attendanceList.find(
                  (entry) => entry.studentId === student.id,
                )}
                <Select
                  options={[
                    { value: 'present', label: 'Presente' },
                    { value: 'absent', label: 'Ausente' },
                    { value: 'late', label: 'Atraso' },
                    { value: 'excused', label: 'Justificado' },
                  ]}
                  value={attendanceEntry?.status || ''}
                  onChange={(value) => saveAttendance(student.id, value)}
                  placeholder="Marcar..."
                  extraClass={getAttendanceClass(attendanceEntry?.status)}
                />
              {/snippet}
            </UserTable>
          {/if}
        </DashboardContent>
      </div>
    {/if}
  </main>
</div>

<Modal
  isOpen={isObservationModalOpen}
  title="Observaciones: {selectedStudent?.name ||
    selectedStudent?.discordUsername}"
  onClose={() => (isObservationModalOpen = false)}
>
  <div class="observations-modal">
    <div class="observations-list">
      {#if observationsLoading}
        <Loader size="sm" />
      {:else if observationsList.length === 0}
        <p class="empty-text">No hay observaciones para este alumno.</p>
      {:else}
        {#each observationsList as obs}
          <div class="observation-item">
            <p>{obs.observation}</p>
            <time>{new Date(obs.createdAt).toLocaleString()}</time>
          </div>
        {/each}
      {/if}
    </div>
    <div class="observation-form">
      <textarea
        class="observation-form__textarea"
        bind:value={newObservation}
        placeholder="Escribe una nueva observación..."
      ></textarea>
      <Button
        size="lg"
        loading={savingObservation}
        loadingText="Guardando..."
        disabled={!newObservation.trim()}
        onclick={saveObservation}
      >
        Guardar Observación
      </Button>
    </div>
  </div>
</Modal>

<Modal
  isOpen={isModuleModalOpen}
  title="Editar Módulo"
  onClose={() => (isModuleModalOpen = false)}
>
  <div class="form-modal">
    <div class="form-group">
      <label for="module-title">Título del Módulo</label>
      <input
        id="module-title"
        class="form-input"
        bind:value={newModule.title}
        placeholder="Ej: Clase 1: Introducción"
      />
    </div>
    <div class="form-group">
      <label for="module-description">Descripción (opcional)</label>
      <textarea
        id="module-description"
        class="form-input"
        bind:value={newModule.description}
        placeholder="Breve descripción del contenido..."
        rows="3"
      ></textarea>
    </div>
    <div class="modal-actions">
      <Button variant="secondary" onclick={() => (isModuleModalOpen = false)}
        >Cancelar</Button
      >
      <Button onclick={saveModule}>Guardar</Button>
    </div>
  </div>
</Modal>

<ConfirmModal
  isOpen={confirmModal.open}
  title={confirmModal.title}
  message={confirmModal.message}
  type={confirmModal.type}
  onConfirm={confirmModal.onConfirm}
  onCancel={() => (confirmModal.open = false)}
/>

<Modal
  isOpen={isMaterialModalOpen}
  title="Agregar Material a: {selectedModule?.title}"
  onClose={() => (isMaterialModalOpen = false)}
>
  <div class="form-modal">
    <div class="form-group">
      <label for="material-title">Título</label>
      <input
        id="material-title"
        class="form-input"
        bind:value={newMaterial.title}
        placeholder="Ej: Diapositivas"
      />
    </div>
    <div class="form-group">
      <label for="material-url">URL (Link)</label>
      <input
        id="material-url"
        class="form-input"
        type="url"
        bind:value={newMaterial.url}
        placeholder="https://..."
      />
    </div>
    <div class="form-group">
      <label for="module-type">Tipo de Material</label>
      <select id="module-type" class="form-input" bind:value={newMaterial.type}>
        <option value="link">🔗 Enlace página web</option>
        <option value="document">📄 Documento / Recurso</option>
      </select>
    </div>
    <div class="modal-actions">
      <Button variant="secondary" onclick={() => (isMaterialModalOpen = false)}
        >Cancelar</Button
      >
      <Button onclick={addMaterial}>Agregar</Button>
    </div>
  </div>
</Modal>

<style>
  .section-dashboard {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dashboard-content {
    min-height: 500px;
  }

  .attendance-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .empty-state {
    padding: 4rem;
    text-align: center;
    background-color: var(--background-color);
    color: var(--text-color-secondary);
    border-radius: 1.25rem;
    border: 2px dashed var(--border-color);
  }

  .observations-list {
    max-height: 400px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .observation-item {
    background: white;
    padding: 1rem;
    border-radius: 0.75rem;
    border-left: 4px solid var(--brand-primary);
  }

  .observation-form__textarea {
    width: 100%;
    min-height: 120px;
    padding: 1rem;
    background-color: var(--background-color);
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
    color: var(--text-color-primary);
    margin-bottom: 1rem;
    resize: vertical;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form-input {
    padding: 0.625rem;
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.375rem;
    background: var(--foreground-color);
    color: var(--text-color-primary);
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
</style>
