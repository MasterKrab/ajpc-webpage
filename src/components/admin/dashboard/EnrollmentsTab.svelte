<script lang="ts">
  import { onMount } from 'svelte'
  import { toast } from 'svelte-sonner'
  import Select from '@components/ui/Select.svelte'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import InfiniteScroll from '@components/ui/InfiniteScroll.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import EnrollmentDetailModal from '@components/admin/EnrollmentDetailModal.svelte'
  import type { Enrollment } from '@db/schema'

  type EnrollmentItem = {
    enrollment: Enrollment & {
      notifiedAt: Date | null
      sectionId: string | null
    }
    courseName: string
    discordUsername: string
  }

  type Section = {
    id: string
    courseId: string
    name: string
  }

  interface Props {
    courseId: string
    initialEnrollments: EnrollmentItem[]
    sectionsList: Section[]
  }

  let { courseId, initialEnrollments, sectionsList }: Props = $props()

  let enrollmentsList = $state<EnrollmentItem[]>(initialEnrollments)
  let enrollmentTotal = $state(initialEnrollments.length) // Initial count
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
    ...sectionsList.map((s) => ({ value: s.id, label: s.name })),
  ])

  async function refreshEnrollments(page = 1, append = false) {
    if (!append) enrollmentLoading = true
    const response = await fetch(
      `/api/admin/inscripciones?courseId=${courseId}&page=${page}&limit=${ENROLLMENTS_PER_PAGE}&search=${studentSearch}`,
    )
    const data = await response.json()

    if (append)
      enrollmentsList = [...enrollmentsList, ...(data.enrollments || [])]
    else enrollmentsList = data.enrollments || []

    enrollmentTotal = data.total || 0
    enrollmentPage = page
    enrollmentLoading = false
  }

  // Effect for search
  let searchTimeout: any
  $effect(() => {
    if (studentSearch !== undefined) {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        refreshEnrollments(1, false)
      }, 300)
    }
  })

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
    await refreshEnrollments(1, false)
  }

  async function notify(enrollmentId?: string) {
    actionLoading = enrollmentId || 'batch'
    const res = await fetch('/api/admin/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollmentId,
        courseId: enrollmentId ? undefined : courseId,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      toast.success(
        data.count
          ? `Se enviaron ${data.count} notificaciones.`
          : 'Notificación enviada.',
      )
      await refreshEnrollments(1, false)
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
      // Map local update for better UX instead of full refresh
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
                <span class="status-pill status--{item.enrollment.status}">
                  {statusLabel(item.enrollment.status)}
                </span>
              </td>
              <td>
                <Select
                  options={sectionOptions}
                  value={item.enrollment.sectionId || ''}
                  onChange={(value) =>
                    assignSectionToStudent(item.enrollment.id, value)}
                  extraClass="section-select"
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
                    {actionLoading === item.enrollment.id ? '...' : 'Notificar'}
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

<style>
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
  .button--small {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
  }
  .empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-color-secondary);
  }
  .loading-state {
    padding: 2rem;
    display: flex;
    justify-content: center;
  }
</style>
