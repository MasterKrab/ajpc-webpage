<script lang="ts">
  import Modal from '@components/ui/Modal.svelte'
  import type { Enrollment } from '@db/schema'

  interface Props {
    enrollment: Enrollment & {
      courseName: string
      courseLevel: string
      feedback?: string | null
    }
  }

  let { enrollment }: Props = $props()
  let isOpen = $state(false)

  const experienceLabel = (exp: string | null) => {
    if (!exp) return 'No especificada'
    const map: Record<string, string> = {
      none: 'Ninguna',
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
    }
    return map[exp] || exp
  }

  const genderLabel = (gender: string) => {
    const map: Record<string, string> = {
      male: 'Masculino',
      female: 'Femenino',
      'non-binary': 'No binario',
      other: 'Otro',
      'prefer-not-to-say': 'Prefiero no decir',
    }
    return map[gender] || gender
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

<button class="button-trigger" onclick={() => (isOpen = true)}>
  <span>Ver detalles</span>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="icon"
    ><path
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
    /><polyline points="15 3 21 3 21 9" /><line
      x1="10"
      y1="14"
      x2="21"
      y2="3"
    /></svg
  >
</button>

<Modal {isOpen} title="Mi Postulación" onClose={() => (isOpen = false)}>
  <div class="detail-grid">
    <div class="field-group full-width header-info">
      <h4>{enrollment.courseName}</h4>
      <span class="status-badge status--{enrollment.status}">
        {statusLabel(enrollment.status)}
      </span>
    </div>

    {#if enrollment.feedback}
      <div
        class="field-group full-width feedback-box status--{enrollment.status}"
      >
        <span class="label-text">
          {enrollment.status === 'approved'
            ? 'Comentarios'
            : 'Motivo de rechazo'}
        </span>
        <p>{enrollment.feedback}</p>
      </div>
    {/if}

    <div class="field-group">
      <span class="label-text">Nombre</span>
      <p>{enrollment.fullName}</p>
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
        {experienceLabel(enrollment.previousExperience)}
      </p>
    </div>

    <div class="field-group full-width">
      <span class="label-text">Motivación</span>
      <p class="text-block">
        {enrollment.motivation || 'Sin motivación especificada'}
      </p>
    </div>
  </div>
</Modal>

<style>
  .button-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: transparent;
    border: 1px solid var(--brand-primary);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    color: var(--brand-primary);
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .button-trigger:hover {
    background-color: var(--brand-primary);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(17, 107, 177, 0.25);
  }

  .button-trigger .icon {
    width: 1.125em;
    height: 1.125em;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .full-width {
    grid-column: 1 / -1;
  }

  .header-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
    margin-bottom: 0.5rem;
  }

  h4 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--brand-primary);
  }

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

  .feedback-box {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid transparent;
  }
  .feedback-box.status--approved {
    background-color: var(--color-success-bg);
    border-color: var(--color-success);
    color: var(--color-success-text);
  }
  .feedback-box.status--approved .label-text {
    color: var(--color-success-text);
    opacity: 0.8;
  }
  .feedback-box.status--rejected {
    background-color: var(--color-danger-bg);
    border-color: var(--color-danger);
    color: var(--color-danger-text);
  }
  .feedback-box.status--rejected .label-text {
    color: var(--color-danger-text);
    opacity: 0.8;
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
</style>
