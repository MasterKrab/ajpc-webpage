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
    courseName?: string
    discordUsername?: string
  }

  interface Props {
    enrollment: EnrollmentType
    isOpen: boolean
    onClose: () => void
    onStatusChange: (
      id: string,
      status: 'approved' | 'rejected' | 'pending',
      notes?: string,
      feedback?: string,
    ) => Promise<void>
  }

  let { enrollment, isOpen, onClose, onStatusChange }: Props = $props()

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
  <div class="detail-grid">
    <div class="field-group full-width header-info">
      <h4>{enrollment.fullName}</h4>
      <p class="subtitle">
        {enrollment.courseName ? `${enrollment.courseName} · ` : ''}
        @{enrollment.discordUsername || 'Usuario'}
      </p>
      <span class="status-badge status--{enrollment.status}">
        {statusLabel(enrollment.status)}
      </span>
    </div>

    <div class="field-group">
      <span class="label-text">Email</span>
      <p>{enrollment.email}</p>
    </div>

    <div class="field-group">
      <span class="label-text">Edad / Género</span>
      <p>{enrollment.age} años · {genderLabel(enrollment.gender)}</p>
    </div>

    <div class="field-group">
      <span class="label-text">Escuela / Año</span>
      <p>{enrollment.schoolName || 'N/A'} ({enrollment.schoolYear})</p>
    </div>

    <div class="field-group">
      <span class="label-text">Ubicación</span>
      <p>
        {enrollment.commune || ''}{enrollment.commune && enrollment.region
          ? ', '
          : ''}{enrollment.region || 'No especificada'}
      </p>
    </div>

    <div class="field-group full-width">
      <span class="label-text">Experiencia</span>
      <p class="text-block">
        {enrollment.previousExperience || 'Sin experiencia especificada'}
      </p>
    </div>

    <div class="field-group full-width">
      <span class="label-text">Motivación</span>
      <p class="text-block">
        {enrollment.motivation || 'Sin motivación especificada'}
      </p>
    </div>

    <div class="field-group full-width">
      <label for="feedback">Nota al estudiante (Feedback)</label>
      <p class="hint">
        Opcional. Se enviará por correo junto con el resultado
        (Aprobada/Rechazada).
      </p>
      <textarea
        id="feedback"
        class="notes-area"
        bind:value={feedback}
        placeholder="Escribe una razón o feedback para el estudiante..."
        rows="3"
      ></textarea>
    </div>

    <div class="field-group full-width">
      <label for="admin-notes">Notas de administración (Interno)</label>
      <textarea
        id="admin-notes"
        class="notes-area"
        bind:value={notes}
        placeholder="Escribe una nota interna..."
        rows="3"
      ></textarea>
    </div>
  </div>

  <div class="actions">
    <button
      class="button button--pending"
      disabled={isLoading || enrollment.status === 'pending'}
      onclick={() => handleAction('pending')}
    >
      Dejar Pendiente
    </button>

    <div class="right-actions">
      <button
        class="button button--reject"
        disabled={isLoading || enrollment.status === 'rejected'}
        onclick={() => handleAction('rejected')}
      >
        Rechazar
      </button>
      <button
        class="button button--approve"
        disabled={isLoading || enrollment.status === 'approved'}
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
    margin-bottom: 1.5rem;
  }

  .full-width {
    grid-column: 1 / -1;
  }

  .header-info {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
    margin-bottom: 0.5rem;
  }

  h4 {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
  }

  .subtitle {
    margin: 0 0 0.5rem;
    color: var(--text-color-secondary);
    font-size: 0.875rem;
  }

  label,
  .label-text {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
  }

  p {
    margin: 0;
    font-size: 0.9375rem;
  }

  .text-block {
    background: var(--border-color-light);
    padding: 0.75rem;
    border-radius: 0.5rem;
    white-space: pre-wrap;
  }

  .hint {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
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

  .notes-area {
    width: 100%;
    padding: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    font-family: inherit;
    resize: vertical;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border-color);
    padding-top: 1.25rem;
    padding-top: 1.25rem;
  }

  .right-actions {
    display: flex;
    gap: 0.75rem;
  }

  .button {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 0.375rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
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
    background-color: var(--color-warning);
    color: #212529;
  }
</style>
