<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { nanoid } from 'nanoid'
  import Modal from '@components/ui/Modal.svelte'
  import Button from '@components/ui/Button.svelte'

  let isOpen = $state(false)
  const formId = nanoid(5)
  let loading = $state(false)

  let form = $state({
    name: '',
    description: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    year: new Date().getFullYear(),
    maxStudents: undefined as number | undefined,
    enrollmentStartDate: '',
    enrollmentEndDate: '',
    availableSchedules: [] as { id: string; day: string; timeRange: string }[],
  })

  const reset = () => {
    form = {
      name: '',
      description: '',
      level: 'beginner',
      year: new Date().getFullYear(),
      maxStudents: undefined,
      enrollmentStartDate: '',
      enrollmentEndDate: '',
      availableSchedules: [],
    }
  }

  const create = async () => {
    loading = true
    const response = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        enrollmentStartDate: form.enrollmentStartDate || null,
        enrollmentEndDate: form.enrollmentEndDate || null,
      }),
    })

    if (response.ok) {
      toast.success('Curso creado correctamente')
      isOpen = false
      reset()
      // Reload page to show new course
      window.location.reload()
    } else {
      const data = await response.json()
      toast.error(data.error || 'Error al crear el curso')
    }
    loading = false
  }
</script>

<Button onclick={() => (isOpen = true)}>+ Nuevo curso</Button>

<Modal {isOpen} title="Crear Nuevo Curso" onClose={() => (isOpen = false)}>
  <form
    class="course-form"
    onsubmit={(e) => {
      e.preventDefault()
      create()
    }}
  >
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="{formId}-courseName">Nombre *</label>
        <input
          class="form-input"
          id="{formId}-courseName"
          bind:value={form.name}
          required
          placeholder="Ej: Programación Competitiva 2025"
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="{formId}-courseYear">Año *</label>
        <input
          class="form-input"
          type="number"
          id="{formId}-courseYear"
          bind:value={form.year}
          required
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="{formId}-courseLevel">Nivel *</label>
        <select
          class="form-input"
          id="{formId}-courseLevel"
          bind:value={form.level}
        >
          <option value="beginner">Básico</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="{formId}-courseMax"
          >Máx. estudiantes</label
        >
        <input
          class="form-input"
          type="number"
          id="{formId}-courseMax"
          bind:value={form.maxStudents}
          min="1"
          placeholder="Opcional"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="{formId}-startDate"
          >Inicio inscripciones</label
        >
        <input
          class="form-input"
          type="datetime-local"
          id="{formId}-startDate"
          bind:value={form.enrollmentStartDate}
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="{formId}-endDate"
          >Fin inscripciones</label
        >
        <input
          class="form-input"
          type="datetime-local"
          id="{formId}-endDate"
          bind:value={form.enrollmentEndDate}
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="{formId}-courseDesc">Descripción</label>
      <textarea
        class="form-input"
        id="{formId}-courseDesc"
        bind:value={form.description}
        rows="3"
        placeholder="Breve descripción del curso..."
      ></textarea>
    </div>

    <fieldset class="form-group" style="padding: 0; margin: 0; border: none;">
      <legend class="form-label">Horarios Disponibles</legend>
      <div class="schedules-list">
        {#each form.availableSchedules as schedule, i}
          <div class="schedule-item">
            <select
              aria-label="Día de horario"
              class="form-input"
              bind:value={schedule.day}
            >
              <option value="Lunes">Lunes</option>
              <option value="Martes">Martes</option>
              <option value="Miércoles">Miércoles</option>
              <option value="Jueves">Jueves</option>
              <option value="Viernes">Viernes</option>
              <option value="Sábado">Sábado</option>
              <option value="Domingo">Domingo</option>
            </select>
            <input
              aria-label="Rango de horario"
              class="form-input"
              placeholder="Ej: 18:30 - 20:00"
              bind:value={schedule.timeRange}
            />
            <button
              class="remove-button"
              type="button"
              onclick={() => form.availableSchedules.splice(i, 1)}
            >
              &times;
            </button>
          </div>
        {/each}
        <button
          type="button"
          class="add-schedule-button"
          onclick={() =>
            form.availableSchedules.push({
              id: Math.random().toString(36).substr(2, 9),
              day: 'Lunes',
              timeRange: '',
            })}
        >
          + Agregar horario
        </button>
      </div>
    </fieldset>

    <div class="modal-actions">
      <Button
        variant="secondary"
        type="button"
        onclick={() => (isOpen = false)}
      >
        Cancelar
      </Button>
      <Button type="submit" {loading} loadingText="Creando...">
        Crear curso
      </Button>
    </div>
  </form>
</Modal>

<style>
  .course-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-label {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .form-input {
    padding: 0.625rem;
    border: 2px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 0.875rem;
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
    transition: border-color 0.2s;
  }

  .form-input:focus {
    border-color: var(--brand-primary);
    outline: none;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .schedules-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(128, 128, 128, 0.05);
    border-radius: 0.5rem;
    border: 1px dashed rgba(128, 128, 128, 0.2);
  }

  .schedule-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .remove-button {
    background: transparent;
    border: none;
    color: var(--color-danger);
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    padding: 0 0.25rem;
  }

  .remove-button:hover {
    color: var(--color-danger-text);
  }

  .add-schedule-button {
    align-self: flex-start;
    background: transparent;
    border: 1px solid var(--brand-primary);
    color: var(--brand-primary);
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    cursor: pointer;
    font-weight: 600;
  }

  .add-schedule-button:hover {
    background: var(--brand-primary);
    color: white;
  }
</style>
