<script lang="ts">
  import { z } from 'zod'
  import { nanoid } from 'nanoid'
  import Button from '@components/ui/Button.svelte'
  import { REGIONS, COMMUNES_BY_REGION, SCHOOL_TYPES } from '@lib/chileData'

  interface Props {
    courseId: string
    courseName: string
    courseSchedules?: { id: string; day: string; timeRange: string }[] | null
  }

  let { courseId, courseName, courseSchedules }: Props = $props()
  const formId = nanoid(5)

  const schoolYears = [
    '7° básico',
    '8° básico',
    '1° medio',
    '2° medio',
    '3° medio',
    '4° medio',
  ]

  let age = $state<number | undefined>(undefined)
  let gender = $state('')
  let schoolYear = $state('')
  let schoolType = $state('')
  let schoolName = $state('')
  let region = $state('')
  let commune = $state('')
  let previousExperience = $state('')
  let motivation = $state('')
  let selectedSchedules = $state<string[]>([])
  let acceptCommitments = $state(false)
  let isSchedulesOpen = $state(false)

  let loading = $state(false)
  let success = $state(false)
  let errorMessage = $state('')
  let fieldErrors = $state<Record<string, string[]>>({})

  const schema = z.object({
    courseId: z.string().min(1),
    age: z
      .number({ invalid_type_error: 'Ingresa tu edad' })
      .int()
      .min(8, 'Edad mínima: 8')
      .max(25, 'Edad máxima: 25'),
    gender: z.string().min(1, 'Selecciona tu género'),
    schoolYear: z.string().min(1, 'Selecciona tu año de estudio'),
    schoolType: z.string().min(1, 'Selecciona el tipo de establecimiento'),
    schoolName: z.string().optional(),
    region: z.string().optional(),
    commune: z.string().optional(),
    previousExperience: z.string().max(1000).optional(),
    motivation: z.string().max(1000).optional(),
    selectedSchedules: z
      .array(z.string())
      .min(1, 'Debes seleccionar al menos un horario'),
    acceptCommitments: z.literal(true, {
      errorMap: () => ({ message: 'Debes aceptar los compromisos' }),
    }),
  })

  const handleSubmit = async () => {
    errorMessage = ''
    fieldErrors = {}

    const data = {
      courseId,
      age,
      gender,
      schoolYear,
      schoolType,
      schoolName: schoolName || undefined,
      region: region || undefined,
      commune: commune || undefined,
      previousExperience: previousExperience || undefined,
      motivation: motivation || undefined,
      selectedSchedules,
      acceptCommitments,
    }

    const parsed = schema.safeParse(data)

    if (!parsed.success) {
      fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >
      return
    }

    loading = true

    try {
      const response = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      const result = await response.json()
      if (!response.ok) {
        errorMessage = result.error || 'Error al enviar inscripción'
        return
      }
      success = true
    } catch {
      errorMessage = 'Error de conexión. Intenta de nuevo.'
    } finally {
      loading = false
    }
  }

  const getError = (field: string) => fieldErrors[field]?.[0] ?? ''
</script>

{#if success}
  <div class="form-success" role="alert">
    <h2>🎉 ¡Inscripción enviada!</h2>
    <p>
      Tu inscripción al curso <strong>{courseName}</strong> ha sido recibida.
    </p>
    <p>Te notificaremos por correo cuando sea revisada.</p>
    <a href="/dashboard" class="form-success__link">Volver a inscripciones</a>
  </div>
{:else}
  <form
    class="enrollment-form"
    onsubmit={(event) => {
      event.preventDefault()
      handleSubmit()
    }}
    novalidate
  >
    <h2 class="enrollment-form__title">
      Inscripción a <span class="highlight">{courseName}</span>
    </h2>

    {#if errorMessage}
      <div class="form-error" role="alert">{errorMessage}</div>
    {/if}

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="{formId}-age">Edad *</label>
        <input
          class="form-input"
          class:form-input--error={getError('age')}
          type="number"
          id="{formId}-age"
          bind:value={age}
          min="8"
          max="25"
          required
        />
        {#if getError('age')}
          <span class="form-hint" role="alert">{getError('age')}</span>
        {/if}
      </div>

      <div class="form-group">
        <label class="form-label" for="{formId}-gender">Género *</label>
        <select
          class="form-input"
          class:form-input--error={getError('gender')}
          id="{formId}-gender"
          bind:value={gender}
          required
        >
          <option value="" disabled>Seleccionar...</option>
          <option value="female">Femenino</option>
          <option value="male">Masculino</option>
          <option value="non-binary">No binario</option>
          <option value="other">Otro</option>
          <option value="prefer-not-to-say">Prefiero no decir</option>
        </select>
        {#if getError('gender')}
          <span class="form-hint" role="alert">{getError('gender')}</span>
        {/if}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="{formId}-schoolYear">Año de estudio *</label>
      <select
        class="form-input"
        class:form-input--error={getError('schoolYear')}
        id="{formId}-schoolYear"
        bind:value={schoolYear}
        required
      >
        <option value="" disabled>Seleccionar...</option>
        {#each schoolYears as year}
          <option value={year}>{year}</option>
        {/each}
      </select>
      {#if getError('schoolYear')}
        <span class="form-hint" role="alert">{getError('schoolYear')}</span>
      {/if}
    </div>

    <div class="form-group">
      <label class="form-label" for="{formId}-schoolType"
        >Tipo de establecimiento *</label
      >
      <select
        class="form-input"
        class:form-input--error={getError('schoolType')}
        id="{formId}-schoolType"
        bind:value={schoolType}
        required
      >
        <option value="" disabled>Seleccionar...</option>
        {#each SCHOOL_TYPES as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
      {#if getError('schoolType')}
        <span class="form-hint" role="alert">{getError('schoolType')}</span>
      {/if}
    </div>

    <div class="form-group">
      <label class="form-label" for="{formId}-schoolName">Nombre del colegio</label>
      <input
        class="form-input"
        type="text"
        id="{formId}-schoolName"
        bind:value={schoolName}
        autocomplete="organization"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="{formId}-region">Región</label>
        <select
          class="form-input"
          id="{formId}-region"
          bind:value={region}
          onchange={() => (commune = '')}
        >
          <option value="">Seleccionar...</option>
          {#each REGIONS as r}
            <option value={r}>{r}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="{formId}-commune">Comuna</label>
        <select class="form-input" id="{formId}-commune" bind:value={commune}>
          {#if !region}
            <option value="">Selecciona una región primero</option>
          {:else}
            <option value="">Seleccionar...</option>
            {#if COMMUNES_BY_REGION[region]}
              {#each COMMUNES_BY_REGION[region] as commune}
                <option value={commune}>{commune}</option>
              {/each}
            {/if}
          {/if}
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="{formId}-previousExperience"
        >Experiencia previa en programación</label
      >
      <div class="form-hint-info">
        Opcional. Cuéntanos con qué lenguajes has trabajado y qué tipo de
        proyectos o problemas has resuelto.
      </div>
      <textarea
        class="form-input form-textarea"
        id="{formId}-previousExperience"
        bind:value={previousExperience}
        rows="3"
        placeholder="Cuéntanos si has programado antes..."
      ></textarea>
      <span class="form-counter">{previousExperience.length}/1000</span>
    </div>

    <div class="form-group">
      <label class="form-label" for="{formId}-motivation"
        >¿Por qué quieres participar?</label
      >
      <div class="form-hint-info">
        Explayate sobre cuáles son tus intereses, qué esperas aprender con
        nosotros y cualquier otro detalle que quieras destacar.
      </div>
      <textarea
        class="form-input form-textarea"
        id="{formId}-motivation"
        bind:value={motivation}
        rows="4"
        maxlength="1000"
      ></textarea>
      <span class="form-counter">{motivation.length}/1000</span>
    </div>

    {#if courseSchedules && courseSchedules.length > 0}
      <fieldset class="form-group" style="border: none; padding: 0; margin: 0;">
        <legend class="form-label">Horarios disponibles *</legend>

        <div class="form-hint-info">
          Selecciona todos los horarios en los que tendrías disponibilidad para
          asistir a clases.
        </div>
        <div
          class="schedules-dropdown"
          class:schedules-dropdown--open={isSchedulesOpen}
        >
          <button
            type="button"
            class="schedules-toggle"
            class:form-input--error={getError('selectedSchedules')}
            onclick={() => (isSchedulesOpen = !isSchedulesOpen)}
          >
            {selectedSchedules.length === 0
              ? 'Selecciona tus horarios disponibles'
              : `${selectedSchedules.length} horario(s) seleccionado(s)`}
            <span class="chevron">▼</span>
          </button>
          {#if isSchedulesOpen}
            <div class="schedules-menu">
              {#each courseSchedules as schedule}
                <label class="schedule-checkbox" for="schedule-{formId}-{schedule.id}">
                  <input
                    id="schedule-{formId}-{schedule.id}"
                    type="checkbox"
                    value={schedule.id}
                    bind:group={selectedSchedules}
                  />
                  <span class="schedule-text">
                    <strong>{schedule.day}</strong>
                    {schedule.timeRange}
                  </span>
                </label>
              {/each}
            </div>
          {/if}
        </div>
        {#if getError('selectedSchedules')}
          <span class="form-hint" role="alert"
            >{getError('selectedSchedules')}</span
          >
        {/if}
      </fieldset>
    {/if}

    <div class="form-group checkbox-group">
      <label
        class="checkbox-label"
        class:text-error={getError('acceptCommitments')}
        for="{formId}-acceptCommitments"
      >
        <input id="{formId}-acceptCommitments" type="checkbox" bind:checked={acceptCommitments} required />
        <span>
          Acepto los <a
            href="/compromisos"
            target="_blank"
            rel="noopener noreferrer">Compromisos de Participación en la AJPC</a
          > *
        </span>
      </label>
      {#if getError('acceptCommitments')}
        <span class="form-hint" role="alert"
          >{getError('acceptCommitments')}</span
        >
      {/if}
    </div>

    <Button type="submit" size="lg" {loading} loadingText="Enviando...">
      Enviar inscripción
    </Button>
  </form>
{/if}

<style>
  .enrollment-form {
    max-width: 40rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .enrollment-form__title {
    font-size: 1.5rem;
    margin: 0;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media screen and (max-width: 480px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }

  .form-label {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .form-input {
    padding: 0.75rem;
    border: 2px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.5rem;
    font-family: inherit;
    font-size: 1rem;
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
    transition: border-color 0.2s;
  }

  .form-input:focus {
    border-color: var(--brand-primary);
    outline: none;
  }

  .form-input:disabled {
    background-color: rgba(128, 128, 128, 0.05);
    cursor: not-allowed;
    opacity: 0.7;
  }

  .form-input--error {
    border-color: var(--color-danger);
  }

  .form-textarea {
    resize: vertical;
    min-height: 6rem;
  }

  .form-hint {
    font-size: 0.8125rem;
    color: var(--color-danger);
  }

  .form-counter {
    font-size: 0.75rem;
    color: var(--text-color-tertiary);
    text-align: right;
  }

  .form-error {
    padding: 0.75rem 1rem;
    background-color: var(--color-danger-bg);
    color: var(--color-danger-text);
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .form-success {
    text-align: center;
    padding: 3rem 2rem;
    background-color: var(--foreground-color);
    border-radius: 0.75rem;
    max-width: 32rem;
    margin-left: auto;
    margin-right: auto;
  }

  .form-success__link {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background-color: var(--button-primary-bg);
    color: var(--button-primary-color);
    border-radius: var(--button-radius);
    font-weight: 600;
  }

  .highlight {
    color: var(--brand-primary);
  }

  .form-hint-info {
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
    line-height: 1.4;
  }

  .schedules-dropdown {
    position: relative;
    width: 100%;
  }

  .schedules-toggle {
    width: 100%;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 2px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.5rem;
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
    font-size: 1rem;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  .schedules-dropdown--open .schedules-toggle {
    border-color: var(--brand-primary);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .schedules-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--foreground-color);
    border: 2px solid var(--brand-primary);
    border-top: none;
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    z-index: 10;
    max-height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .schedule-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    cursor: pointer;
    transition: background-color 0.1s;
    margin: 0;
  }

  .schedule-checkbox:hover {
    background-color: rgba(128, 128, 128, 0.05);
  }

  .schedule-checkbox input {
    margin: 0;
  }

  .checkbox-group {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.875rem;
    cursor: pointer;
    line-height: 1.4;
  }

  .checkbox-label input[type='checkbox'] {
    margin-top: 0.2rem;
  }

  .checkbox-label a {
    color: var(--brand-primary);
    text-decoration: underline;
  }

  .text-error {
    color: var(--color-danger);
  }
</style>
