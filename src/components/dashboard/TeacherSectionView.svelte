<script lang="ts">
  import Modal from '@components/ui/Modal.svelte'
  import Tabs from '@components/ui/Tabs.svelte'
  import PanelHeader from '@components/ui/PanelHeader.svelte'
  import Select from '@components/ui/Select.svelte'
  import { toast } from 'svelte-sonner'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import UserTable from '@components/ui/UserTable.svelte'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'

  type Student = {
    id: string
    discordId: string
    discordUsername: string
    discordAvatar: string | null
    name: string | null
    enrollmentId: string
  }

  type Section = {
    id: string
    name: string
    courseId: string
    courseName: string
    studentCount: number
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

  // Observations state
  let selectedStudent = $state<Student | null>(null)
  let observationsList = $state<Observation[]>([])
  let observationsLoading = $state(false)
  let newObservation = $state('')
  let isObservationModalOpen = $state(false)

  // Modules/Materials state
  let selectedModule = $state<Module | null>(null)

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

  // Search state
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

  // Effect to fetch students on tab change or search
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

  // Also fetch students when activeTab changes to students for the first time
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
        description: `La asistencia de ${studentsList.find(({ id }) => id === studentId)?.name} ha sido actualizada a ${statusLabels[status] || status}.`,
        duration: 2000,
      })
    } else {
      toast.error('Error al actualizar asistencia')
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
            <button
              class="button button--small button--primary"
              onclick={() => openObservations(student)}
            >
              📝 Observaciones
            </button>
          {/snippet}
        </UserTable>
      </DashboardContent>
    {:else if activeTab === 'modules'}
      <div class="modules-manager">
        {#if modulesLoading}
          <div class="loading-state">Cargando módulos...</div>
        {:else if modulesList.length === 0}
          <div class="empty-state">
            <p>No hay módulos creados aún.</p>
          </div>
        {:else}
          <div class="modules-grid">
            {#each modulesList as mod}
              <article class="module-card">
                <header class="module-card__header">
                  <h3 class="module-card__title">{mod.title}</h3>
                </header>

                <ul class="materials-list">
                  {#each mod.materials as mat}
                    <li class="material-list__item">
                      <a
                        href={mat.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="material-list__link"
                      >
                        {mat.type === 'document' ? '📄' : '🔗'}
                        {mat.title}
                      </a>
                    </li>
                  {/each}
                </ul>
              </article>
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
        <p>Cargando...</p>
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
      <button
        class="button button--primary"
        onclick={saveObservation}
        disabled={!newObservation.trim()}
      >
        Guardar Observación
      </button>
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

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .module-card {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 1.25rem;
    padding: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    border-left: 4px solid var(--brand-primary);
  }

  .module-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.05);
    border-color: var(--brand-primary);
  }

  .module-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .module-card__title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-color-primary);
  }

  .materials-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .materials-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
    padding: 0.5rem 0.75rem;
    background: white;
    border-radius: 0.75rem;
    transition: background-color 0.2s;
  }

  .materials-list__item:hover {
    background-color: rgba(var(--brand-primary-rgb), 0.05);
  }

  .materials-list__link {
    color: var(--text-color-primary);
    text-decoration: none;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .materials-list__link:hover {
    color: var(--brand-primary);
  }

  .attendance-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .loading-state,
  .empty-state {
    padding: 4rem;
    text-align: center;
    color: var(--text-color-secondary);
    background: white;
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
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
    background: white;
    color: var(--text-color-primary);
    margin-bottom: 1rem;
    resize: vertical;
  }

  .button {
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-color-primary);
    background: var(--border-color-light);
  }

  .button:hover:not(:disabled) {
    background: var(--border-color);
  }

  .button--primary {
    background: var(--brand-primary);
    color: white;
  }

  .button--primary:hover:not(:disabled) {
    background: var(--brand-primary);
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--brand-primary-rgb), 0.3);
  }

  .button--small {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    border-radius: 0.5rem;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
