<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { onMount } from 'svelte'
  import UserTable from '@components/ui/UserTable.svelte'
  import Modal from '@components/ui/Modal.svelte'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import Button from '@components/ui/Button.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import type { Student } from '@app-types/users'
  import { trpcClient } from '@app-trpc/client'

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

  const intl = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

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
    try {
      const result = await trpcClient.docente.students.list.query({
        sectionId,
        page,
        limit: STUDENTS_PER_PAGE,
        search: studentSearchQuery || undefined,
      })
      if (append) {
        studentsList = [...studentsList, ...result.students as unknown as Student[]]
      } else {
        studentsList = result.students as unknown as Student[]
      }
      studentsTotal = result.total
      studentsPage = page
    } finally {
      studentsLoading = false
    }
  }

  async function openObservations(student: Student) {
    selectedStudent = student
    isObservationModalOpen = true
    observationsLoading = true
    try {
      const result = await trpcClient.docente.observations.list.query({
        studentId: student.id,
        courseId,
      })
      observationsList = result as unknown as Observation[]
    } finally {
      observationsLoading = false
    }
  }

  async function saveObservation() {
    if (!newObservation.trim() || !selectedStudent) return
    savingObservation = true
    try {
      await trpcClient.docente.observations.create.mutate({
        studentId: selectedStudent.id,
        courseId,
        observation: newObservation,
      })
      toast.success('Observación guardada')
      newObservation = ''
      const result = await trpcClient.docente.observations.list.query({
        studentId: selectedStudent.id,
        courseId,
      })
      observationsList = result as unknown as Observation[]
    } catch (error: unknown) {
      const trpcError = error as { message?: string }
      toast.error(trpcError?.message || 'Error al guardar la observación')
    } finally {
      savingObservation = false
    }
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

  onMount(() => {
    if (initialStudents.length === 0) fetchStudents(1, false)
  })
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
            <p class="observation-item__text">{obs.observation}</p>
            <time class="observation-item__time"
              >{intl.format(new Date(obs.createdAt))}</time
            >
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
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 25rem;
    margin-bottom: 1.5rem;
    overflow-y: auto;
  }

  .observation-item {
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    border-left: 0.25rem solid var(--brand-primary);
  }

  .observation-item__text {
    margin-top: 0;
    margin-bottom: 0.5rem;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .observation-item__time {
    color: var(--text-color-secondary);
    font-size: 0.9rem;
  }

  .observation-form__textarea {
    width: 100%;
    min-height: 120px;
    padding: 1rem;
    border-radius: 0.75rem;
    border: 0.125rem solid var(--border-color);
    background-color: var(--background-color);
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
