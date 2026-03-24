<script lang="ts">
  import { z } from 'zod'
  import { nanoid } from 'nanoid'
  import Button from '@components/ui/Button.svelte'
  import Select from '@components/ui/Select.svelte'
  import MultiSelect from '@components/ui/MultiSelect.svelte'
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
  let acceptTerms = $state(false)
  let acceptConduct = $state(false)

  let loading = $state(false)
  let success = $state(false)
  let errorMessage = $state('')
  let fieldErrors = $state<Record<string, string[]>>({})

  const TEXTAREAS_MAX_LENGTH = 1000

  const schema = z
    .object({
      courseId: z.string().min(1),
      age: z
        .number({ error: 'Ingresa tu edad' })
        .int()
        .min(8, 'Edad mínima: 8')
        .max(25, 'Edad máxima: 25'),
      gender: z.string().min(1, 'Selecciona tu género'),
      schoolYear: z.string().min(1, 'Selecciona tu año de estudio'),
      schoolType: z.string().min(1, 'Selecciona el tipo de establecimiento'),
      schoolName: z.string().optional(),
      region: z.string().optional(),
      commune: z.string().optional(),
      previousExperience: z.string().max(TEXTAREAS_MAX_LENGTH).optional(),
      motivation: z.string().max(TEXTAREAS_MAX_LENGTH).optional(),
      selectedSchedules: z.array(z.string()),
      acceptTerms: z.boolean().refine((val) => val === true, {
        message: 'Debes aceptar los términos y condiciones',
      }),
      acceptConduct: z.boolean().refine((val) => val === true, {
        message: 'Debes aceptar el reglamento de convivencia',
      }),
    })
    .refine(
      (data) => {
        if (courseSchedules && courseSchedules.length > 0)
          return data.selectedSchedules.length > 0
        return true
      },
      {
        message: 'Debes seleccionar al menos un horario',
        path: ['selectedSchedules'],
      },
    )

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
      acceptTerms,
      acceptConduct,
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

    <fieldset class="form-section">
      <legend class="form-section__title">Información del Estudiante</legend>

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
            aria-required="true"
            aria-invalid={!!getError('age')}
            aria-describedby={getError('age')
              ? `${formId}-age-error`
              : undefined}
          />
          {#if getError('age')}
            <span class="form-hint" id="{formId}-age-error" role="alert"
              >{getError('age')}</span
            >
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
            aria-required="true"
            aria-invalid={!!getError('gender')}
            aria-describedby={getError('gender')
              ? `${formId}-gender-error`
              : undefined}
          >
            <option value="" disabled>Seleccionar...</option>
            <option value="female">Femenino</option>
            <option value="male">Masculino</option>
            <option value="non-binary">No binario</option>
            <option value="other">Otro</option>
            <option value="prefer-not-to-say">Prefiero no decir</option>
          </select>
          {#if getError('gender')}
            <span class="form-hint" id="{formId}-gender-error" role="alert"
              >{getError('gender')}</span
            >
          {/if}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="{formId}-schoolYear"
          >Año de estudio *</label
        >
        <select
          class="form-input"
          class:form-input--error={getError('schoolYear')}
          id="{formId}-schoolYear"
          bind:value={schoolYear}
          required
          aria-required="true"
          aria-invalid={!!getError('schoolYear')}
          aria-describedby={getError('schoolYear')
            ? `${formId}-schoolYear-error`
            : undefined}
        >
          <option value="" disabled>Seleccionar...</option>
          {#each schoolYears as year}
            <option value={year}>{year}</option>
          {/each}
        </select>
        {#if getError('schoolYear')}
          <span class="form-hint" id="{formId}-schoolYear-error" role="alert"
            >{getError('schoolYear')}</span
          >
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
          aria-required="true"
          aria-invalid={!!getError('schoolType')}
          aria-describedby={getError('schoolType')
            ? `${formId}-schoolType-error`
            : undefined}
        >
          <option value="" disabled>Seleccionar...</option>
          {#each SCHOOL_TYPES as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
        {#if getError('schoolType')}
          <span class="form-hint" id="{formId}-schoolType-error" role="alert"
            >{getError('schoolType')}</span
          >
        {/if}
      </div>

      <div class="form-group">
        <label class="form-label" for="{formId}-schoolName"
          >Nombre del colegio</label
        >
        <input
          class="form-input"
          type="text"
          id="{formId}-schoolName"
          bind:value={schoolName}
          autocomplete="organization"
        />
      </div>
    </fieldset>

    <fieldset class="form-section">
      <legend class="form-section__title">Ubicación</legend>

      <div class="form-group">
        <Select
          label="Región"
          name="{formId}-region"
          options={REGIONS.map((region) => ({ value: region, label: region }))}
          bind:value={region}
          searchable={true}
          searchPlaceholder="Buscar región..."
          placeholder="Seleccionar región"
          extraClass={getError('region') ? 'form-input--error' : ''}
          aria-describedby={getError('region')
            ? `${formId}-region-error`
            : undefined}
          onChange={() => (commune = '')}
        />
        {#if getError('region')}
          <span class="form-hint" id="{formId}-region-error" role="alert"
            >{getError('region')}</span
          >
        {/if}
      </div>

      <div class="form-group">
        <Select
          label="Comuna"
          name="{formId}-commune"
          options={region && COMMUNES_BY_REGION[region]
            ? COMMUNES_BY_REGION[region].map((commune) => ({
                value: commune,
                label: commune,
              }))
            : []}
          bind:value={commune}
          searchable={true}
          searchPlaceholder="Buscar comuna..."
          placeholder={region
            ? 'Seleccionar comuna'
            : 'Selecciona una región primero'}
          disabled={!region}
          extraClass={getError('commune') ? 'form-input--error' : ''}
          aria-describedby={getError('commune')
            ? `${formId}-commune-error`
            : undefined}
        />
        {#if getError('commune')}
          <span class="form-hint" id="{formId}-commune-error" role="alert"
            >{getError('commune')}</span
          >
        {/if}
      </div>
    </fieldset>

    <fieldset class="form-section">
      <legend class="form-section__title">Experiencia y Motivación</legend>

      <div class="form-group">
        <label class="form-label" for="{formId}-previousExperience"
          >Experiencia previa en programación</label
        >
        <div class="form-hint-info" id="{formId}-prevExp-hint">
          Opcional. Cuéntanos con qué lenguajes has trabajado y qué tipo de
          proyectos o problemas has resuelto.
        </div>
        <textarea
          class="form-input form-textarea"
          id="{formId}-previousExperience"
          bind:value={previousExperience}
          maxlength={TEXTAREAS_MAX_LENGTH}
          rows="3"
          placeholder="Cuéntanos si has programado antes..."
          aria-describedby="{formId}-prevExp-hint"
        ></textarea>
        <p class="form-counter" aria-hidden="true">
          {previousExperience.length}/{TEXTAREAS_MAX_LENGTH}
        </p>
      </div>

      <div class="form-group">
        <label class="form-label" for="{formId}-motivation"
          >¿Por qué quieres participar?</label
        >
        <div class="form-hint-info" id="{formId}-motivation-hint">
          Explayate sobre cuáles son tus intereses, qué esperas aprender con
          nosotros y cualquier otro detalle que quieras destacar.
        </div>
        <textarea
          class="form-input form-textarea"
          id="{formId}-motivation"
          bind:value={motivation}
          maxlength={TEXTAREAS_MAX_LENGTH}
          rows="4"
          aria-describedby="{formId}-motivation-hint"
        ></textarea>
        <p class="form-counter" aria-hidden="true">
          {motivation.length}/{TEXTAREAS_MAX_LENGTH}
        </p>
      </div>
    </fieldset>

    {#if courseSchedules && courseSchedules.length > 0}
      <fieldset class="form-section">
        <legend class="form-section__title">Horarios disponibles *</legend>

        <div class="form-hint-info" id="{formId}-schedules-hint">
          Selecciona todos los horarios en los que tendrías disponibilidad para
          asistir a clases.
        </div>
        <div>
          <MultiSelect
            id="{formId}-schedules"
            options={courseSchedules.map((schedule) => ({
              value: schedule.id,
              label: schedule.day,
              sublabel: schedule.timeRange,
            }))}
            bind:value={selectedSchedules}
            placeholder="Selecciona tus horarios disponibles"
            error={!!getError('selectedSchedules')}
            aria-describedby={getError('selectedSchedules')
              ? `${formId}-schedules-error ${formId}-schedules-hint`
              : `${formId}-schedules-hint`}
          />
        </div>
        {#if getError('selectedSchedules')}
          <span class="form-hint" id="{formId}-schedules-error" role="alert"
            >{getError('selectedSchedules')}</span
          >
        {/if}
      </fieldset>
    {/if}

    <fieldset class="form-section">
      <legend class="form-section__title">Acuerdos Legales</legend>

      <div class="form-group">
        <label
          class="checkbox-label"
          class:text-error={getError('acceptTerms')}
          for="{formId}-acceptTerms"
        >
          <input
            id="{formId}-acceptTerms"
            type="checkbox"
            bind:checked={acceptTerms}
            required
            aria-required="true"
            aria-invalid={!!getError('acceptTerms')}
            aria-describedby={getError('acceptTerms')
              ? `${formId}-acceptTerms-error`
              : undefined}
          />
          <span>
            He leído y acepto los <a
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer">Términos y Condiciones</a
            > *
          </span>
        </label>
        {#if getError('acceptTerms')}
          <span class="form-hint" id="{formId}-acceptTerms-error" role="alert"
            >{getError('acceptTerms')}</span
          >
        {/if}
      </div>

      <div class="form-group">
        <label
          class="checkbox-label"
          class:text-error={getError('acceptConduct')}
          for="{formId}-acceptConduct"
        >
          <input
            id="{formId}-acceptConduct"
            type="checkbox"
            bind:checked={acceptConduct}
            required
            aria-required="true"
            aria-invalid={!!getError('acceptConduct')}
            aria-describedby={getError('acceptConduct')
              ? `${formId}-acceptConduct-error`
              : undefined}
          />
          <span>
            He leído y acepto el <a
              href="/reglamento"
              target="_blank"
              rel="noopener noreferrer">Reglamento de Convivencia</a
            > *
          </span>
        </label>
        {#if getError('acceptConduct')}
          <span class="form-hint" id="{formId}-acceptConduct-error" role="alert"
            >{getError('acceptConduct')}</span
          >
        {/if}
      </div>
    </fieldset>

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
    gap: 2rem;
  }

  .enrollment-form__title {
    font-size: 1.75rem;
    margin: 0;
    color: var(--text-color-primary);
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    border: none;
    padding: 0;
    margin: 0;
  }

  .form-section__title {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--brand-primary);
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color-light);
    width: 100%;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
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
    margin-top: 0;
    margin-bottom: 0;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
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
