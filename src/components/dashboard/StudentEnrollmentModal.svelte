<script lang="ts">
  import Modal from '@components/ui/Modal.svelte'
  import Button from '@components/ui/Button.svelte'
  import externalLinkIcon from '@assets/icons/external-link.svg?raw'

  import type { Enrollment } from '@db/schema'

  interface Props {
    enrollment: Partial<Enrollment> & {
      courseName: string
      courseLevel: string
      feedback?: string | null
      status: string
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

<Button variant="ghost" onclick={() => (isOpen = true)}>
  {#snippet icon()}
    {@html externalLinkIcon}
  {/snippet}
  Ver detalles
</Button>

<Modal {isOpen} title="Mi Postulación" onClose={() => (isOpen = false)}>
  <div class="enrollment-modal">
    <div class="enrollment-modal__header">
      <h4 class="enrollment-modal__course">{enrollment.courseName}</h4>
      <span
        class="enrollment-modal__badge enrollment-modal__badge--{enrollment.status}"
      >
        {statusLabel(enrollment.status)}
      </span>
    </div>

    {#if enrollment.feedback}
      <div
        class="enrollment-modal__feedback enrollment-modal__feedback--{enrollment.status}"
      >
        <span class="enrollment-modal__label">
          {enrollment.status === 'approved'
            ? 'Comentarios'
            : 'Motivo de rechazo'}
        </span>
        <p class="enrollment-modal__feedback-text">{enrollment.feedback}</p>
      </div>
    {/if}

    <div class="enrollment-modal__fields">
      <div class="enrollment-modal__field">
        <span class="enrollment-modal__label">Nombre</span>
        <p class="enrollment-modal__value">{enrollment.fullName}</p>
      </div>

      <div class="enrollment-modal__field">
        <span class="enrollment-modal__label">Email</span>
        <p class="enrollment-modal__value">{enrollment.email}</p>
      </div>

      <div class="enrollment-modal__field">
        <span class="enrollment-modal__label">Edad / Género</span>
        <p class="enrollment-modal__value">
          {enrollment.age} años · {genderLabel(enrollment.gender)}
        </p>
      </div>

      <div class="enrollment-modal__field">
        <span class="enrollment-modal__label">Escuela / Año</span>
        <p class="enrollment-modal__value">
          {enrollment.schoolName || 'N/A'} ({enrollment.schoolYear})
        </p>
      </div>

      <div class="enrollment-modal__field">
        <span class="enrollment-modal__label">Ubicación</span>
        <p class="enrollment-modal__value">
          {enrollment.commune || ''}{enrollment.commune && enrollment.region
            ? ', '
            : ''}{enrollment.region || 'No especificada'}
        </p>
      </div>

      <div class="enrollment-modal__field enrollment-modal__field--full">
        <span class="enrollment-modal__label">Experiencia</span>
        <p class="enrollment-modal__value enrollment-modal__value--block">
          {experienceLabel(enrollment.previousExperience)}
        </p>
      </div>

      <div class="enrollment-modal__field enrollment-modal__field--full">
        <span class="enrollment-modal__label">Motivación</span>
        <p class="enrollment-modal__value enrollment-modal__value--block">
          {enrollment.motivation || 'Sin motivación especificada'}
        </p>
      </div>
    </div>
  </div>
</Modal>

<style>
  .enrollment-modal {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .enrollment-modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
  }

  .enrollment-modal__course {
    margin: 0;
    font-size: 1.25rem;
    color: var(--brand-primary);
  }

  .enrollment-modal__badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .enrollment-modal__badge--approved {
    background: var(--color-success-bg);
    color: var(--color-success-text);
  }

  .enrollment-modal__badge--rejected {
    background: var(--color-danger-bg);
    color: var(--color-danger-text);
  }

  .enrollment-modal__badge--pending {
    background: var(--color-warning-bg);
    color: var(--color-warning-text);
  }

  .enrollment-modal__feedback {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid transparent;
  }

  .enrollment-modal__feedback--approved {
    background-color: var(--color-success-bg);
    border-color: var(--color-success);
    color: var(--color-success-text);
  }

  .enrollment-modal__feedback--rejected {
    background-color: var(--color-danger-bg);
    border-color: var(--color-danger);
    color: var(--color-danger-text);
  }

  .enrollment-modal__feedback-text {
    margin: 0.25rem 0 0;
    font-size: 0.9375rem;
  }

  .enrollment-modal__fields {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 1.25rem;
  }

  .enrollment-modal__field--full {
    grid-column: 1 / -1;
  }

  .enrollment-modal__label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
  }

  .enrollment-modal__value {
    margin: 0;
    font-size: 0.9375rem;
  }

  .enrollment-modal__value--block {
    background: var(--border-color-light);
    padding: 0.75rem;
    border-radius: 0.5rem;
    white-space: pre-wrap;
  }
</style>
