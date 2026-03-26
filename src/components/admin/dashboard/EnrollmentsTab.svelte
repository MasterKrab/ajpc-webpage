<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { onMount } from 'svelte'
  import Select from '@components/ui/Select.svelte'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import InfiniteScroll from '@components/ui/InfiniteScroll.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import EnrollmentDetailModal from '@components/admin/EnrollmentDetailModal.svelte'
  import Button from '@components/ui/Button.svelte'
  import type { Enrollment } from '@db/schema'

  interface EnrollmentItem {
    enrollment: Enrollment & {
      notifiedAt: Date | null
      sectionId: string | null
    }
    courseName: string
    discordUsername: string
  }

  interface Section {
    id: string
    courseId: string
    name: string
  }

  interface Props {
    courseId: string
    initialEnrollments: EnrollmentItem[]
    sectionsList: Section[]
    availableSchedules: Array<{ id: string; day: string; timeRange: string }>
  }

  let {
    courseId,
    initialEnrollments,
    sectionsList,
    availableSchedules,
  }: Props = $props()

  let enrollmentsList = $state<EnrollmentItem[]>(initialEnrollments)
  let enrollmentTotal = $state(initialEnrollments.length)
  let enrollmentLoading = $state(false)
  let enrollmentPage = $state(1)
  const ENROLLMENTS_PER_PAGE = 20
  let studentSearch = $state('')
  let actionLoading = $state<string | null>(null)

  let selectedEnrollment = $state<
    | (EnrollmentItem['enrollment'] & {
        courseName?: string
        discordUsername?: string
      })
    | null
  >(null)
  let isDetailModalOpen = $state(false)

  const sectionOptions = $derived([
    { value: '', label: 'Sin asignar' },
    ...sectionsList.map((section) => ({ value: section.id, label: section.name })),
  ])

  const refreshEnrollments = async (page = 1, append = false) => {
    if (!append) enrollmentLoading = true
    try {
      const response = await fetch(
        `/api/admin/inscripciones?courseId=${courseId}&page=${page}&limit=${ENROLLMENTS_PER_PAGE}&search=${studentSearch}`,
      )
      const data = await response.json()

      if (append) {
        enrollmentsList = [...enrollmentsList, ...(data.enrollments || [])]
      } else {
        enrollmentsList = data.enrollments || []
      }

      enrollmentTotal = data.total || 0
      enrollmentPage = page
    } catch (error) {
      toast.error('Error al cargar inscripciones')
    } finally {
      enrollmentLoading = false
    }
  }

  let searchTimeout: any
  $effect(() => {
    if (studentSearch !== undefined) {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        refreshEnrollments(1, false)
      }, 300)
    }
  })

  const updateEnrollment = async (
    enrollmentId: string,
    status: 'approved' | 'rejected' | 'pending',
    notes?: string,
    feedback?: string,
  ) => {
    try {
      const response = await fetch(`/api/admin/inscripciones?id=${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes: notes,
          feedback,
        }),
      })
      if (response.ok) {
        await refreshEnrollments(1, false)
      } else {
        toast.error('Error al actualizar inscripción')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const notify = async (enrollmentId?: string) => {
    actionLoading = enrollmentId || 'batch'
    try {
      const response = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          courseId: enrollmentId ? undefined : courseId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(
          data.count
            ? `Se enviaron ${data.count} notificaciones.`
            : 'Notificación enviada.',
        )
        await refreshEnrollments(1, false)
      } else {
        toast.error('Error al enviar notificaciones')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      actionLoading = null
    }
  }

  const openEnrollmentDetail = (item: EnrollmentItem) => {
    selectedEnrollment = {
      ...item.enrollment,
      courseName: item.courseName,
      discordUsername: item.discordUsername,
    }
    isDetailModalOpen = true
  }

  const assignSectionToStudent = async (
    enrollmentId: string,
    sectionId: string,
  ) => {
    try {
      const response = await fetch(`/api/admin/inscripciones?id=${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: sectionId || null }),
      })

      if (response.ok) {
        toast.success('Paralelo asignado')
        enrollmentsList = enrollmentsList.map((item) => {
          if (item.enrollment.id === enrollmentId) {
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
    } catch (error) {
      toast.error('Error de conexión')
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
</script>

<SubHeader title="Inscripciones">
  {#snippet actions()}
    <SearchBox bind:value={studentSearch} placeholder="Buscar inscritos..." />
  {/snippet}
</SubHeader>

{#if enrollmentsList.some((item) => !item.enrollment.notifiedAt && item.enrollment.status !== 'pending')}
  <div class="pending-notice">
    <span>Hay notificaciones pendientes para este curso.</span>
    <Button
      size="sm"
      loading={actionLoading === 'batch'}
      loadingText="Enviando..."
      onclick={() => notify()}
    >
      Notificar Pendientes
    </Button>
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
        <caption class="sr-only">Lista de inscripciones al curso</caption>
        <thead>
          <tr>
            <th scope="col" class="table__header">Estudiante</th>
            <th scope="col" class="table__header">Info</th>
            <th scope="col" class="table__header">Estado</th>
            <th scope="col" class="table__header">Paralelo</th>
            <th scope="col" class="table__header">Notificación</th>
            <th scope="col" class="table__header">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each enrollmentsList as item}
            <tr class="table__row">
              <td class="table__cell">
                <strong>{item.enrollment.fullName}</strong><br />
                <small class="text-muted">@{item.discordUsername}</small>
              </td>
              <td class="table__cell">
                {item.enrollment.age} años<br />
                <small class="text-muted">{item.enrollment.email}</small>
              </td>
              <td class="table__cell">
                <span
                  class="status-pill status--{item.enrollment.status}"
                  role="status"
                >
                  {statusLabel(item.enrollment.status)}
                </span>
              </td>
              <td class="table__cell">
                <Select
                  options={sectionOptions}
                  value={item.enrollment.sectionId || ''}
                  onChange={(value) =>
                    assignSectionToStudent(item.enrollment.id, value)}
                  disabled={item.enrollment.status !== 'approved'}
                  extraClass="section-select"
                  placeholder=""
                  searchable={true}
                  aria-label="Asignar paralelo a {item.enrollment.fullName}"
                />
              </td>
              <td class="table__cell">
                {#if item.enrollment.notifiedAt}
                  <span class="notified-at">
                    📩 {new Date(
                      item.enrollment.notifiedAt,
                    ).toLocaleDateString()}
                  </span>
                {:else if item.enrollment.status !== 'pending'}
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={actionLoading === item.enrollment.id}
                    loadingText="..."
                    onclick={() => notify(item.enrollment.id)}
                    ariaLabel="Notificar a {item.enrollment.fullName}"
                  >
                    Notificar
                  </Button>
                {:else}
                  <span class="text-muted">—</span>
                {/if}
              </td>
              <td class="table__cell actions-cell">
                <Button
                  size="sm"
                  onclick={() => openEnrollmentDetail(item)}
                  ariaLabel="Ver postulación de {item.enrollment.fullName}"
                >
                  Ver postulación
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if enrollmentLoading && enrollmentsList.length === 0}
      <Loader label="Cargando inscripciones..." />
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

{#if selectedEnrollment && isDetailModalOpen}
  <EnrollmentDetailModal
    isOpen={isDetailModalOpen}
    enrollment={selectedEnrollment}
    {availableSchedules}
    onClose={() => {
      isDetailModalOpen = false
      selectedEnrollment = null
    }}
    onStatusChange={updateEnrollment}
  />
{/if}

<style>
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
    background-color: var(--color-success-bg);
    color: var(--color-success-text);
  }

  .status--rejected {
    background-color: var(--color-danger-bg);
    color: var(--color-danger-text);
  }

  .status--pending {
    background-color: var(--color-warning-bg);
    color: var(--color-warning-text);
  }

  .actions-cell {
    min-width: 200px;
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

  .section-select {
    min-width: 12rem;
  }

  .empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-color-secondary);
  }
</style>
