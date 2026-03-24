<script lang="ts">
  import type { Module } from '@app-types/modules'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'

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
      <div class="table-wrapper">
        <table class="user-table">
          <thead>
            <tr class="user-table__tr">
              <th class="user-table__th">Módulo</th>
              <th class="user-table__th">Fecha</th>
              <th class="user-table__th">Estado</th>
            </tr>
          </thead>
          <tbody>
            {#each modules as mod}
              {@const status = attendanceRecords[mod.id]}
              <tr class="user-table__tr">
                <td class="user-table__td column-title">{mod.title}</td>
                <td class="user-table__td column-date">
                  {mod.createdAt
                    ? new Date(mod.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-'}
                </td>
                <td class="user-table__td column-status">
                  {#if status && statusLabels[status]}
                    <span class="status-badge {statusLabels[status].class}">
                      {statusLabels[status].label}
                    </span>
                  {:else}
                    <span class="status-badge status--pending"
                      >Sin registrar</span
                    >
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
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

  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    background: var(--foreground-color);
    box-shadow: var(--shadow-sm);
    border-radius: 0.75rem;
  }

  .user-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    text-align: left;
  }

  .user-table__td,
  .user-table__th {
    min-width: 12.5rem;
  }

  .user-table__th {
    padding: 1rem 1.25rem;
    font-weight: 700;
    color: var(--text-color-secondary);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 0.125rem solid
      var(--border-color-light, rgba(128, 128, 128, 0.1));
    background: rgba(var(--brand-primary-rgb), 0.02);
  }

  .user-table__td {
    padding: 1rem 1.25rem;
    border-bottom: 0.063rem solid
      var(--border-color-light, rgba(128, 128, 128, 0.1));
    color: var(--text-color-primary);
    vertical-align: middle;
  }

  .user-table__tr:last-child .user-table__td {
    border-bottom: none;
  }

  .user-table__tr:hover {
    background-color: rgba(var(--brand-primary-rgb), 0.03);
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
