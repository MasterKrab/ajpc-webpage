<script lang="ts">
  import { toast } from 'svelte-sonner'
  import UserTable from '@components/ui/UserTable.svelte'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import Select from '@components/ui/Select.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import type { Student } from '@app-types/users'
  import type { Module } from '@app-types/modules'

  interface Attendance {
    studentId: string
    status: 'present' | 'absent' | 'late' | 'excused'
  }

  interface Props {
    sectionId: string
    courseId: string
    initialModules?: Module[]
    initialStudents?: Student[]
    initialTotal?: number
  }

  let {
    sectionId,
    courseId,
    initialModules = [],
    initialStudents = [],
    initialTotal = 0,
  }: Props = $props()

  const STUDENTS_PER_PAGE = 50

  let modulesList = $state<Module[]>(initialModules)
  let modulesLoading = $state(initialModules.length === 0)

  let studentsList = $state<Student[]>(initialStudents)
  let studentsTotal = $state(initialTotal)
  let studentsLoading = $state(initialStudents.length === 0)

  let attendanceList = $state<Attendance[]>([])
  let attendanceLoading = $state(false)

  let selectedModuleId = $state('')
  let selectedModule = $state<Module | null>(null)
  let studentSearchQuery = $state('')

  const moduleOptions = $derived(
    modulesList.map(({ id, title }) => ({ value: id, label: title })),
  )

  $effect(() => {
    const mod = modulesList.find((m) => m.id === selectedModuleId)
    if (mod) selectModuleForAttendance(mod)
  })

  async function fetchModules() {
    modulesLoading = true
    try {
      const res = await fetch(`/api/docente/modules?courseId=${courseId}`)
      modulesList = await res.json()
    } finally {
      modulesLoading = false
    }
  }

  const fetchStudents = async (page = 1) => {
    studentsLoading = true
    const searchParam = studentSearchQuery
      ? `&search=${encodeURIComponent(studentSearchQuery)}`
      : ''
    const res = await fetch(
      `/api/docente/students?sectionId=${sectionId}&page=${page}&limit=${STUDENTS_PER_PAGE}${searchParam}`,
    )
    const data = await res.json()
    studentsList = data.students || []
    studentsTotal = data.total || 0
    studentsLoading = false
  }

  async function fetchAttendance() {
    if (!selectedModule) return
    attendanceLoading = true
    const res = await fetch(
      `/api/docente/attendance?moduleId=${selectedModule.id}&sectionId=${sectionId}&page=1&limit=${STUDENTS_PER_PAGE}`,
    )
    const data = await res.json()
    attendanceList = data.attendance || []
    attendanceLoading = false
  }

  async function selectModuleForAttendance(mod: Module) {
    selectedModule = mod
    await fetchAttendance()
  }

  async function saveAttendance(studentId: string, status: string) {
    if (!selectedModule) return
    const response = await fetch('/api/docente/attendance', {
      method: 'POST',
      body: JSON.stringify({
        moduleId: selectedModule.id,
        sectionId,
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
      const labels: Record<string, string> = {
        present: 'Presente',
        absent: 'Ausente',
        late: 'Atraso',
        excused: 'Justificado',
      }
      toast.success(`Asistencia: ${labels[status] || status}`, {
        description: `${studentsList.find((s) => s.id === studentId)?.name || 'alumno'} → ${labels[status] || status}`,
        duration: 2000,
      })
    } else {
      toast.error('Error al actualizar asistencia')
    }
  }

  const getAttendanceClass = (status: string | undefined) =>
    status ? `attendance-select--${status}` : ''

  let lastSearch = ''
  $effect(() => {
    if (studentSearchQuery === lastSearch) return
    const timer = setTimeout(() => {
      lastSearch = studentSearchQuery
      fetchStudents(1)
    }, 400)
    return () => clearTimeout(timer)
  })

  if (initialModules.length === 0) fetchModules()
  if (initialStudents.length === 0) fetchStudents(1)
</script>

<div class="attendance-container">
  <SubHeader title="Asistencia">
    {#snippet actions()}
      {#if modulesLoading}
        <Loader size="sm" />
      {:else}
        <Select
          options={moduleOptions}
          bind:value={selectedModuleId}
          placeholder="Selecciona un módulo..."
        />
      {/if}
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
      <UserTable
        users={studentsList}
        loading={studentsLoading || attendanceLoading}
      >
        {#snippet actions(student)}
          {@const entry = attendanceList.find(
            (e) => e.studentId === student.id,
          )}
          <Select
            options={[
              { value: 'present', label: 'Presente' },
              { value: 'absent', label: 'Ausente' },
              { value: 'late', label: 'Atraso' },
              { value: 'excused', label: 'Justificado' },
            ]}
            value={entry?.status || ''}
            onChange={(value) => saveAttendance(student.id, value)}
            placeholder="Marcar..."
            extraClass={getAttendanceClass(entry?.status)}
          />
        {/snippet}
      </UserTable>
    {/if}
  </DashboardContent>
</div>

<style>
  .attendance-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .empty-state {
    padding: 4rem;
    text-align: center;
    color: var(--text-color-secondary);
    border-radius: 1.25rem;
    border: 0.125rem dashed var(--border-color);
  }
</style>
