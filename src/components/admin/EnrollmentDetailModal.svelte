<script lang="ts">
  import Modal from '@components/ui/Modal.svelte'

  interface EnrollmentType {
    id: string
    fullName: string
    email: string
    age: number
    gender: string
    schoolYear: string
    schoolName: string | null
    region: string | null
    commune: string | null
    previousExperience: string | null
    motivation: string | null
    status: string
    adminNotes: string | null
    feedback: string | null
    selectedSchedules: string[] | null
    courseName?: string
    discordUsername?: string
  }

  interface Props {
    enrollment: EnrollmentType
    isOpen: boolean
    availableSchedules: Array<{ id: string; day: string; timeRange: string }>
    onClose: () => void
    onStatusChange: (
      id: string,
      status: 'approved' | 'rejected' | 'pending',
      notes?: string,
      feedback?: string,
    ) => Promise<void>
  }

  let {
    enrollment,
    isOpen,
    availableSchedules,
    onClose,
    onStatusChange,
  }: Props = $props()

  let notes = $state(enrollment.adminNotes || '')
  let feedback = $state(enrollment.feedback || '')
  let isLoading = $state(false)

  $effect(() => {
    if (isOpen) {
      notes = enrollment.adminNotes || ''
      feedback = enrollment.feedback || ''
    }
  })

  async function handleAction(status: 'approved' | 'rejected' | 'pending') {
    isLoading = true
    await onStatusChange(enrollment.id, status, notes, feedback)
    isLoading = false
    onClose()
  }

  const genderLabel = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'Masculino'
      case 'female':
        return 'Femenino'
      case 'non-binary':
        return 'No binario'
      case 'other':
        return 'Otro'
      case 'prefer-not-to-say':
        return 'Prefiero no decir'
      default:
        return gender
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
</script>

<Modal {isOpen} title="Detalle de Postulación" {onClose}>
  <div class="detail-container">
    <div class="header-info">
      <h4 class="detail-container__title">{enrollment.fullName}</h4>
      <p class="subtitle">
        {enrollment.courseName ? `${enrollment.courseName} · ` : ''}
        @{enrollment.discordUsername || 'Usuario'}
      </p>
      <span class="status-badge status--{enrollment.status}" role="status">
        {statusLabel(enrollment.status)}
      </span>
    </div>

    <dl class="detail-grid">
      <div class="field-group">
        <dt class="detail-grid__label">Email</dt>
        <dd class="detail-grid__value">{enrollment.email}</dd>
      </div>

      <div class="field-group">
        <dt class="detail-grid__label">Edad / Género</dt>
        <dd class="detail-grid__value">{enrollment.age} años · {genderLabel(enrollment.gender)}</dd>
      </div>

      <div class="field-group">
        <dt class="detail-grid__label">Escuela / Año</dt>
        <dd class="detail-grid__value">{enrollment.schoolName || 'N/A'} ({enrollment.schoolYear})</dd>
      </div>

      <div class="field-group">
        <dt class="detail-grid__label">Ubicación</dt>
        <dd class="detail-grid__value">
          {enrollment.commune || ''}{enrollment.commune && enrollment.region
            ? ', '
            : ''}{enrollment.region || 'No especificada'}
        </dd>
      </div>

      <div class="field-group full-width">
        <dt class="detail-grid__label">Experiencia</dt>
        <dd class="detail-grid__value text-block">
          {enrollment.previousExperience || 'Sin experiencia especificada'}
        </dd>
      </div>

      <div class="field-group full-width">
        <dt class="detail-grid__label">Motivación</dt>
        <dd class="detail-grid__value text-block">
          {enrollment.motivation || 'Sin motivación especificada'}
        </dd>
      </div>

      {#if enrollment.selectedSchedules && enrollment.selectedSchedules.length > 0}
        <div class="field-group full-width">
          <dt class="detail-grid__label">Horarios Seleccionados</dt>
          <dd class="detail-grid__value schedules-badges">
            {#each enrollment.selectedSchedules as scheduleId}
              {@const schedule = availableSchedules.find(
                (schedule) => schedule.id === scheduleId,
              )}
              {#if schedule}
                <span class="schedule-badge">
                  {schedule.day} · {schedule.timeRange}
                </span>
              {/if}
            {/each}
          </dd>
        </div>
      {/if}
    </dl>

    <div class="form-section">
      <div class="field-group full-width">
        <label class="form-section__label" for="feedback">Nota al estudiante (Feedback)</label>
        <p class="form-section__hint" id="feedback-hint">
          Opcional. Se enviará por correo junto con el resultado
          (Aprobada/Rechazada).
        </p>
        <textarea
          id="feedback"
          class="notes-area"
          bind:value={feedback}
          placeholder="Escribe una razón o feedback para el estudiante..."
          rows="3"
          aria-describedby="feedback-hint"
        ></textarea>
      </div>

      <div class="field-group full-width">
        <label class="form-section__label" for="admin-notes">Notas de administración (Interno)</label>
        <textarea
          id="admin-notes"
          class="notes-area"
          bind:value={notes}
          placeholder="Escribe una nota interna..."
          rows="3"
        ></textarea>
      </div>
    </div>
  </div>

  <div class="actions">
    <button
      class="button button--pending"
      disabled={isLoading}
      onclick={() => handleAction('pending')}
    >
      Dejar Pendiente
    </button>

    <div class="right-actions">
      <button
        class="button button--reject"
        disabled={isLoading}
        onclick={() => handleAction('rejected')}
      >
        Rechazar
      </button>
      <button
        class="button button--approve"
        disabled={isLoading}
        onclick={() => handleAction('approved')}
      >
        Aprobar
      </button>
    </div>
  </div>
</Modal>

<style>
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    margin-bottom: 2rem;
    padding: 0;
  }

  .header-info {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
  }

  .full-width {
    grid-column: 1 / -1;
  }

  .detail-container__title {
    margin: 0 0 0.25rem;
    font-size: 1.5rem;
    color: var(--text-color-primary);
  }

  .subtitle {
    margin: 0 0 0.75rem;
    color: var(--text-color-secondary);
    font-size: 0.9375rem;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-section__label,
  .detail-grid__label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-color-secondary);
    margin-bottom: 0.125rem;
    letter-spacing: 0.025em;
  }

  .detail-grid__value,
  .subtitle,
  .form-section__hint {
    margin: 0;
    font-size: 1rem;
    color: var(--text-color-primary);
  }

  .text-block {
    background: var(--border-color-light);
    padding: 1rem;
    border-radius: 0.75rem;
    white-space: pre-wrap;
    line-height: 1.5;
    font-size: 0.9375rem;
  }

  .form-section__hint {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    line-height: 1.4;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .status--approved {
    background: var(--color-success-bg);
    color: var(--color-success-text);
  }
  .status--rejected {
    background: var(--color-danger-bg);
    color: var(--color-danger-text);
  }
  .status--pending {
    background: var(--color-warning-bg);
    color: var(--color-warning-text);
  }

  .schedules-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .schedule-badge {
    background: var(--brand-primary);
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .notes-area {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    font-family: inherit;
    font-size: 0.9375rem;
    resize: vertical;
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .notes-area:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px rgba(17, 107, 177, 0.1);
  }

  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border-color);
    padding-top: 1.25rem;
    margin-top: 1rem;
  }

  .right-actions {
    display: flex;
    gap: 0.75rem;
  }

  .button {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition:
      opacity 0.2s,
      transform 0.1s;
    font-family: inherit;
  }

  .button:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }

  .button:active:not(:disabled) {
    transform: translateY(0);
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button--approve {
    background-color: var(--color-success);
    color: white;
  }
  .button--reject {
    background-color: var(--color-danger);
    color: white;
  }
  .button--pending {
    background-color: var(--border-color-light);
    color: var(--text-color-secondary);
    border: 1px solid var(--border-color);
  }
  .button--pending:hover:not(:disabled) {
    background-color: var(--border-color);
  }
</style>
