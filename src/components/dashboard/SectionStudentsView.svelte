<script lang="ts">
  import { toast } from 'svelte-sonner'
  import UserTable from '@components/ui/UserTable.svelte'
  import Modal from '@components/ui/Modal.svelte'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import Button from '@components/ui/Button.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import type { Student } from '@app-types/users'

  interface Observation {
    id: string
    observation: string
    createdAt: string
  }

  interface Props {
    sectionId: string
    courseId: string
    initialStudents?: Student[]
    initialTotal?: number
  }

  let {
    sectionId,
    courseId,
    initialStudents = [],
    initialTotal = 0,
  }: Props = $props()

  const STUDENTS_PER_PAGE = 20

  let studentsList = $state<Student[]>(initialStudents)
  let studentsTotal = $state(initialTotal)
  let studentsLoading = $state(initialStudents.length === 0)
  let studentsPage = $state(1)

  let selectedStudent = $state<Student | null>(null)
  let observationsList = $state<Observation[]>([])
  let observationsLoading = $state(false)
  let savingObservation = $state(false)
  let newObservation = $state('')
  let isObservationModalOpen = $state(false)

  let studentSearchQuery = $state('')
  const hasMoreStudents = $derived(studentsList.length < studentsTotal)

  const fetchStudents = async (page = 1, append = false) => {
    if (!append) studentsLoading = true
    const searchParam = studentSearchQuery
      ? `&search=${encodeURIComponent(studentSearchQuery)}`
      : ''
    const response = await fetch(
      `/api/docente/students?sectionId=${sectionId}&page=${page}&limit=${STUDENTS_PER_PAGE}${searchParam}`,
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

  async function openObservations(student: Student) {
    selectedStudent = student
    isObservationModalOpen = true
    observationsLoading = true
    const res = await fetch(
      `/api/docente/observations?studentId=${student.id}&courseId=${courseId}`,
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
        courseId,
        observation: newObservation,
      }),
    })
    if (response.ok) {
      toast.success('Observación guardada')
      newObservation = ''
      const updated = await fetch(
        `/api/docente/observations?studentId=${selectedStudent.id}&courseId=${courseId}`,
      )
      observationsList = await updated.json()
    } else {
      toast.error('Error al guardar la observación')
    }
    savingObservation = false
  }

  let lastSearch = ''
  $effect(() => {
    if (studentSearchQuery === lastSearch) return
    const timer = setTimeout(() => {
      lastSearch = studentSearchQuery
      fetchStudents(1, false)
    }, 400)
    return () => clearTimeout(timer)
  })

  if (initialStudents.length === 0) fetchStudents(1, false)
</script>

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

<style>
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
    box-sizing: border-box;
  }

  .empty-text {
    color: var(--text-color-secondary);
    text-align: center;
    padding: 2rem;
  }
</style>
