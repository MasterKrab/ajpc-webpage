<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { onMount } from 'svelte'
  import Select from '@components/ui/Select.svelte'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import EnrollmentDetailModal from '@components/admin/EnrollmentDetailModal.svelte'
  import Button from '@components/ui/Button.svelte'
  import type { Enrollment } from '@db/schema'
  import TablePagination from '@components/tables/TablePagination.svelte'
  import TableSkeletonRow from '@components/tables/TableSkeletonRow.svelte'
  import Table from '@components/tables/Table.svelte'
  import TableHead from '@components/tables/TableHead.svelte'
  import TableBody from '@components/tables/TableBody.svelte'
  import TableRow from '@components/tables/TableRow.svelte'
  import TableCell from '@components/tables/TableCell.svelte'
  import TableHeader from '@components/tables/TableHeader.svelte'
  import { trpcClient } from '@app-trpc/client'

  interface EnrollmentItem {
    enrollment: Enrollment & {
      notifiedAt: Date | null
      sectionId: string | null
    }
    courseName: string
    discordUsername: string
    allEnrollments?: Array<{ courseName: string; status: string }>
  }

  interface Section {
    id: string
    courseId: string
    name: string
  }

  interface Props {
    courseId: string
    initialEnrollments: EnrollmentItem[]
    initialTotal?: number
    sectionsList: Section[]
    availableSchedules: Array<{ id: string; day: string; timeRange: string }>
  }

  let {
    courseId,
    initialEnrollments,
    initialTotal = 0,
    sectionsList,
    availableSchedules,
  }: Props = $props()

  let enrollmentsList = $state<EnrollmentItem[]>(initialEnrollments)
  let enrollmentTotal = $state(initialTotal)
  let enrollmentLoading = $state(false)
  let enrollmentPage = $state(1)
  let pageSize = $state(10)
  let studentSearch = $state('')
  let actionLoading = $state<string | null>(null)

  const totalPages = $derived(
    Math.max(1, Math.ceil(enrollmentTotal / pageSize)),
  )

  let selectedEnrollment = $state<
    | (EnrollmentItem['enrollment'] & {
        courseName?: string
        discordUsername?: string
        allEnrollments?: Array<{ courseName: string; status: string }>
      })
    | null
  >(null)
  let isDetailModalOpen = $state(false)

  const sectionOptions = $derived([
    { value: '', label: 'Sin asignar' },
    ...sectionsList.map((section) => ({
      value: section.id,
      label: section.name,
    })),
  ])

  const refreshEnrollments = async (page = 1) => {
    enrollmentLoading = true
    try {
      const result = await trpcClient.admin.enrollments.list.query({
        courseId,
        page,
        limit: pageSize,
        search: studentSearch || undefined,
      })

      enrollmentsList = result.enrollments as unknown as EnrollmentItem[]
      enrollmentTotal = result.total
      enrollmentPage = page
    } catch (error) {
      toast.error('Error al cargar inscripciones')
    } finally {
      enrollmentLoading = false
    }
  }

  const handlePageChange = (page: number) => {
    refreshEnrollments(page)
  }

  const handlePageSizeChange = (size: number) => {
    pageSize = size
    refreshEnrollments(1)
  }

  let searchTimeout: any
  $effect(() => {
    if (studentSearch !== undefined) {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        refreshEnrollments(1)
      }, 400)
    }
  })

  const updateEnrollment = async (
    enrollmentId: string,
    status: 'approved' | 'rejected' | 'pending',
    notes?: string,
    feedback?: string,
  ) => {
    try {
      await trpcClient.admin.enrollments.update.mutate({
        id: enrollmentId,
        status,
        adminNotes: notes,
        feedback,
      })
      await refreshEnrollments(1)
    } catch (error) {
      toast.error('Error al actualizar inscripción')
    }
  }

  const notify = async (enrollmentId?: string) => {
    actionLoading = enrollmentId || 'batch'
    try {
      const result = await trpcClient.admin.notifications.send.mutate(
        enrollmentId ? { enrollmentId } : { courseId },
      )
      toast.success(
        result.count
          ? `Se enviaron ${result.count} notificaciones.`
          : 'Notificación enviada.',
      )
      await refreshEnrollments(1)
    } catch (error: unknown) {
      const trpcError = error as { message?: string }
      toast.error(trpcError?.message || 'Error al enviar notificaciones')
    } finally {
      actionLoading = null
    }
  }

  const openEnrollmentDetail = (item: EnrollmentItem) => {
    selectedEnrollment = {
      ...item.enrollment,
      courseName: item.courseName,
      discordUsername: item.discordUsername,
      allEnrollments: item.allEnrollments,
    }
    isDetailModalOpen = true
  }

  const assignSectionToStudent = async (
    enrollmentId: string,
    sectionId: string,
  ) => {
    try {
      await trpcClient.admin.enrollments.update.mutate({
        id: enrollmentId,
        sectionId: sectionId || null,
      })
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
    } catch (error) {
      toast.error('Error al asignar paralelo')
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

  // Initial fetch if no SSR data or if search/pagination starts
  onMount(() => {
    if (initialEnrollments.length === 0 && enrollmentTotal > 0) {
      refreshEnrollments(1)
    }
  })
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
    <Table ariaLabel="Lista de inscripciones al curso">
      <TableHead>
        <TableRow>
          <TableHeader>Estudiante</TableHeader>
          <TableHeader>Info</TableHeader>
          <TableHeader>Estado</TableHeader>
          <TableHeader>Paralelo</TableHeader>
          <TableHeader>Notificación</TableHeader>
          <TableHeader>Acciones</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {#if enrollmentLoading}
          {#each Array(pageSize) as _}
            <TableSkeletonRow
              cells={['w150', 'w180', 'pill', 'w150', 'pill', 'action']}
            />
          {/each}
        {:else}
          {#each enrollmentsList as item}
            <TableRow>
              <TableCell>
                <strong>{item.enrollment.fullName}</strong>
                {#if item.allEnrollments && item.allEnrollments.length > 1}
                  <span
                    class="multi-badge"
                    title="Este estudiante tiene {item.allEnrollments
                      .length} postulaciones"
                  >
                    +{item.allEnrollments.length - 1}
                  </span>
                {/if}
                <br />
                <small class="text-muted">@{item.discordUsername}</small>
              </TableCell>
              <TableCell>
                {item.enrollment.age} años<br />
                <small class="text-muted">{item.enrollment.email}</small>
              </TableCell>
              <TableCell>
                <span
                  class="status-pill status--{item.enrollment.status}"
                  role="status"
                >
                  {statusLabel(item.enrollment.status)}
                </span>
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell class="actions-cell">
                <Button
                  size="sm"
                  onclick={() => openEnrollmentDetail(item)}
                  ariaLabel="Ver postulación de {item.enrollment.fullName}"
                >
                  Ver postulación
                </Button>
              </TableCell>
            </TableRow>
          {/each}
        {/if}
      </TableBody>
    </Table>

    <TablePagination
      currentPage={enrollmentPage}
      {totalPages}
      totalItems={enrollmentTotal}
      {pageSize}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
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

  .multi-badge {
    background-color: var(--brand-primary);
    color: white;
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border-radius: 1rem;
    vertical-align: middle;
    margin-left: 0.35rem;
    font-weight: 700;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: default;
  }
</style>
