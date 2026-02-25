<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Modal from '@components/ui/Modal.svelte'
  import Button from '@components/ui/Button.svelte'

  let isOpen = $state(false)
  let loading = $state(false)

  let form = $state({
    name: '',
    description: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    year: new Date().getFullYear(),
    maxStudents: undefined as number | undefined,
    enrollmentStartDate: '',
    enrollmentEndDate: '',
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
        <label class="form-label" for="courseName">Nombre *</label>
        <input
          class="form-input"
          id="courseName"
          bind:value={form.name}
          required
          placeholder="Ej: Programación Competitiva 2025"
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="courseYear">Año *</label>
        <input
          class="form-input"
          type="number"
          id="courseYear"
          bind:value={form.year}
          required
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="courseLevel">Nivel *</label>
        <select class="form-input" id="courseLevel" bind:value={form.level}>
          <option value="beginner">Básico</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="courseMax">Máx. estudiantes</label>
        <input
          class="form-input"
          type="number"
          id="courseMax"
          bind:value={form.maxStudents}
          min="1"
          placeholder="Opcional"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="startDate">Inicio inscripciones</label>
        <input
          class="form-input"
          type="datetime-local"
          id="startDate"
          bind:value={form.enrollmentStartDate}
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="endDate">Fin inscripciones</label>
        <input
          class="form-input"
          type="datetime-local"
          id="endDate"
          bind:value={form.enrollmentEndDate}
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="courseDesc">Descripción</label>
      <textarea
        class="form-input"
        id="courseDesc"
        bind:value={form.description}
        rows="3"
        placeholder="Breve descripción del curso..."
      ></textarea>
    </div>

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
</style>
