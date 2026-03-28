<script lang="ts">
  import type { Module } from '@app-types/modules'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import Table from '@components/tables/Table.svelte'
  import TableHead from '@components/tables/TableHead.svelte'
  import TableBody from '@components/tables/TableBody.svelte'
  import TableRow from '@components/tables/TableRow.svelte'
  import TableCell from '@components/tables/TableCell.svelte'
  import TableHeader from '@components/tables/TableHeader.svelte'

  interface Props {
    modules: Module[]
    attendanceRecords: Record<string, 'present' | 'absent' | 'late' | 'excused'>
  }

  let { modules, attendanceRecords }: Props = $props()

  const statusLabels: Record<string, { label: string; class: string }> = {
    present: { label: 'Presente', class: 'status--present' },
    absent: { label: 'Ausente', class: 'status--absent' },
    late: { label: 'Atraso', class: 'status--late' },
    excused: { label: 'Justificado', class: 'status--excused' },
  }
</script>

<div class="student-attendance">
  <SubHeader title="Mi Asistencia" />

  <DashboardContent>
    {#if modules.length === 0}
      <div class="empty-state">
        <p>Aún no hay módulos registrados en este curso.</p>
      </div>
    {:else}
      <Table ariaLabel="Tabla de mi asistencia">
        <TableHead>
          <TableRow>
            <TableHeader>Módulo</TableHeader>
            <TableHeader>Fecha</TableHeader>
            <TableHeader>Estado</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each modules as mod}
            {@const status = attendanceRecords[mod.id]}
            <TableRow>
              <TableCell class="column-title">{mod.title}</TableCell>
              <TableCell class="column-date">
                {mod.createdAt
                  ? new Date(mod.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '-'}
              </TableCell>
              <TableCell class="column-status">
                {#if status && statusLabels[status]}
                  <span class="status-badge {statusLabels[status].class}">
                    {statusLabels[status].label}
                  </span>
                {:else}
                  <span class="status-badge status--pending"
                    >Sin registrar</span
                  >
                {/if}
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {/if}
  </DashboardContent>
</div>

<style>
  .student-attendance {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-color-secondary);
  }

  .column-title {
    font-weight: 500;
    color: var(--text-color-primary);
  }

  .column-date {
    color: var(--text-color-secondary);
    font-size: 0.9rem;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .status--present {
    background-color: var(--color-success-bg, #dcfce7);
    color: var(--color-success-text, #166534);
  }

  .status--absent {
    background-color: var(--color-danger-bg, #fee2e2);
    color: var(--color-danger-text, #991b1b);
  }

  .status--late {
    background-color: var(--color-warning-bg, #fef9c3);
    color: var(--color-warning-text, #854d0e);
  }

  .status--excused {
    background-color: var(--color-info-bg, #e0f2fe);
    color: var(--color-info-text, #075985);
  }

  .status--pending {
    background-color: var(--border-color-light);
    color: var(--text-color-secondary);
  }
</style>
