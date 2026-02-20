<script lang="ts">
  import { z } from 'zod'

  interface Props {
    courseId: string
    courseName: string
  }

  let { courseId, courseName }: Props = $props()

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
  let schoolName = $state('')
  let region = $state('')
  let commune = $state('')
  let previousExperience = $state('')
  let motivation = $state('')

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
    schoolName: z.string().optional(),
    region: z.string().optional(),
    commune: z.string().optional(),
    previousExperience: z.string().max(1000).optional(),
    motivation: z.string().max(1000).optional(),
  })

  const handleSubmit = async () => {
    errorMessage = ''
    fieldErrors = {}

    const data = {
      courseId,
      age,
      gender,
      schoolYear,
      schoolName: schoolName || undefined,
      region: region || undefined,
      commune: commune || undefined,
      previousExperience: previousExperience || undefined,
      motivation: motivation || undefined,
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
    onsubmit={(e) => {
      e.preventDefault()
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
        <label class="form-label" for="age">Edad *</label>
        <input
          class="form-input"
          class:form-input--error={getError('age')}
          type="number"
          id="age"
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
        <label class="form-label" for="gender">Género *</label>
        <select
          class="form-input"
          class:form-input--error={getError('gender')}
          id="gender"
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
      <label class="form-label" for="schoolYear">Año de estudio *</label>
      <select
        class="form-input"
        class:form-input--error={getError('schoolYear')}
        id="schoolYear"
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
      <label class="form-label" for="schoolName">Nombre del colegio</label>
      <input
        class="form-input"
        type="text"
        id="schoolName"
        bind:value={schoolName}
        autocomplete="organization"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="region">Región</label>
        <input class="form-input" type="text" id="region" bind:value={region} />
      </div>

      <div class="form-group">
        <label class="form-label" for="commune">Comuna</label>
        <input
          class="form-input"
          type="text"
          id="commune"
          bind:value={commune}
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="previousExperience"
        >Experiencia previa en programación</label
      >
      <textarea
        class="form-input form-textarea"
        id="previousExperience"
        bind:value={previousExperience}
        rows="3"
        placeholder="Cuéntanos si has programado antes..."
      ></textarea>
      <span class="form-counter">{previousExperience.length}/1000</span>
    </div>

    <div class="form-group">
      <label class="form-label" for="motivation"
        >¿Por qué quieres participar?</label
      >
      <textarea
        class="form-input form-textarea"
        id="motivation"
        bind:value={motivation}
        rows="4"
        maxlength="1000"
      ></textarea>
      <span class="form-counter">{motivation.length}/1000</span>
    </div>

    <button class="form-submit" type="submit" disabled={loading}>
      {loading ? 'Enviando...' : 'Enviar inscripción'}
    </button>
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

  .form-input--error {
    border-color: #dc3545;
  }

  .form-textarea {
    resize: vertical;
    min-height: 6rem;
  }

  .form-hint {
    font-size: 0.8125rem;
    color: #dc3545;
  }

  .form-counter {
    font-size: 0.75rem;
    color: var(--text-color-tertiary);
    text-align: right;
  }

  .form-error {
    padding: 0.75rem 1rem;
    background-color: #f8d7da;
    color: #721c24;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }

  .form-submit {
    padding: 0.875rem 2rem;
    background-color: var(--brand-primary);
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition:
      opacity 0.2s,
      transform 0.15s;
  }

  .form-submit:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .form-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
    background-color: var(--brand-primary);
    color: #fff;
    border-radius: 0.5rem;
    font-weight: 600;
  }

  .highlight {
    color: var(--brand-primary);
  }
</style>
