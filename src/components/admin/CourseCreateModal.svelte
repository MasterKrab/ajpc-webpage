<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { nanoid } from 'nanoid'
  import Modal from '@components/ui/Modal.svelte'
  import Button from '@components/ui/Button.svelte'
  import RichTextEditor from '@components/admin/RichTextEditor.svelte'
  import { trpcClient } from '@app-trpc/client'

  interface Schedule {
    id: string
    day: string
    timeRange: string
  }

  interface CourseForm {
    name: string
    description: string
    level: 'beginner' | 'intermediate' | 'advanced'
    year: number
    maxStudents: number | undefined
    status: 'closed' | 'open'
    availableSchedules: Schedule[]
    discordGuildId: string
    discordRoleId: string
  }

  let isOpen = $state(false)
  const formId = nanoid(5)
  let loading = $state(false)

  let form = $state<CourseForm>({
    name: '',
    description: '',
    level: 'beginner',
    year: new Date().getFullYear(),
    maxStudents: undefined,
    status: 'closed',
    availableSchedules: [],
    discordGuildId: '',
    discordRoleId: '',
  })

  const reset = () => {
    form = {
      name: '',
      description: '',
      level: 'beginner',
      year: new Date().getFullYear(),
      maxStudents: undefined,
      status: 'closed',
      availableSchedules: [],
      discordGuildId: '',
      discordRoleId: '',
    }
  }

  const create = async () => {
    loading = true
    try {
      await trpcClient.admin.courses.create.mutate({
        name: form.name,
        description: form.description || undefined,
        level: form.level,
        year: Number(form.year),
        maxStudents: form.maxStudents ? Number(form.maxStudents) : null,
        status: form.status,
        availableSchedules: form.availableSchedules,
        discordGuildId: form.discordGuildId || null,
        discordRoleId: form.discordRoleId || null,
      })
      toast.success('Curso creado correctamente')
      isOpen = false
      reset()
      window.location.reload()
    } catch (error: unknown) {
      const trpcError = error as { message?: string }
      toast.error(trpcError?.message || 'Error al crear el curso')
    } finally {
      loading = false
    }
  }
</script>

<Button onclick={() => (isOpen = true)}>+ Nuevo curso</Button>

<Modal {isOpen} title="Crear Nuevo Curso" onClose={() => (isOpen = false)}>
  <form
    class="course-form"
    onsubmit={(event) => {
      event.preventDefault()
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
          aria-required="true"
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
          aria-required="true"
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

    <div class="form-group">
      <label class="form-label" for="{formId}-courseDesc">Descripción</label>
      <RichTextEditor bind:value={form.description} placeholder="Breve descripción del curso..." variables={[]} />
    </div>


    <fieldset class="form-group" style="padding: 0; margin: 0; border: none;">
      <legend class="form-label">Horarios Disponibles</legend>
      <div class="schedules-list">
        {#each form.availableSchedules as schedule, index}
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
              aria-label="Eliminar horario {schedule.day} {schedule.timeRange}"
              onclick={() => {
                form.availableSchedules = form.availableSchedules.filter(
                  (_, scheduleIndex) => scheduleIndex !== index,
                )
              }}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        {/each}
        <button
          type="button"
          class="add-schedule-button"
          onclick={(event) => {
            event.preventDefault()

            form.availableSchedules = [
              ...form.availableSchedules,
              {
                id: nanoid(6),
                day: 'Lunes',
                timeRange: '',
              },
            ]
          }}
        >
          + Agregar horario
        </button>
      </div>
    </fieldset>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="{formId}-discordGuildId"
          >ID Servidor Discord</label
        >
        <input
          class="form-input"
          id="{formId}-discordGuildId"
          bind:value={form.discordGuildId}
          placeholder="Opcional"
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="{formId}-discordRoleId"
          >ID Rol Discord</label
        >
        <input
          class="form-input"
          id="{formId}-discordRoleId"
          bind:value={form.discordRoleId}
          placeholder="Opcional"
          aria-label="ID del Rol de Discord (Opcional)"
        />
      </div>
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
    color: var(--text-color-primary);
  }
</style>
