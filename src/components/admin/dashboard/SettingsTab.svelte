<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { nanoid } from 'nanoid'
  import Select from '@components/ui/Select.svelte'
  import DeleteConfirmation from '../DeleteConfirmation.svelte'
  import Button from '@components/ui/Button.svelte'

  type Course = {
    id: string
    name: string
    description: string | null
    level: string
    year: number
    maxStudents: number | null
    status: string
    enrollmentStartDate: Date | null
    enrollmentEndDate: Date | null
    availableSchedules?: { id: string; day: string; timeRange: string }[]
  }

  interface Props {
    course: Course
  }

  let { course = $bindable() }: Props = $props()
  const formId = nanoid(5)

  let updateLoading = $state(false)
  let isDeleteModalOpen = $state(false)

  const formatDateForInput = (date: any) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 16)
  }

  let editForm = $state({
    name: course.name,
    description: course.description || '',
    level: course.level,
    year: course.year,
    maxStudents: course.maxStudents,
    status: course.status,
    enrollmentStartDate: formatDateForInput(course.enrollmentStartDate),
    enrollmentEndDate: formatDateForInput(course.enrollmentEndDate),
    availableSchedules: course.availableSchedules
      ? [...course.availableSchedules]
      : [],
  })

  async function updateCourse() {
    updateLoading = true
    let payload = {
      ...editForm,
      enrollmentStartDate: editForm.enrollmentStartDate || null,
      enrollmentEndDate: editForm.enrollmentEndDate || null,
    }

    const res = await fetch(`/api/admin/courses?id=${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      course = {
        ...course,
        ...editForm,
        enrollmentStartDate: payload.enrollmentStartDate
          ? new Date(payload.enrollmentStartDate)
          : null,
        enrollmentEndDate: payload.enrollmentEndDate
          ? new Date(payload.enrollmentEndDate)
          : null,
      }
      toast.success('Curso actualizado correctamente')
    } else {
      toast.error('Error al actualizar el curso')
    }
    updateLoading = false
  }

  async function deleteCourse() {
    const res = await fetch(`/api/admin/courses?id=${course.id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      window.location.href = '/admin'
    } else {
      toast.error('Error al eliminar el curso')
    }
  }
</script>

<div class="settings-panel">
  <section class="settings-section">
    <h2 class="settings-section__title">Editar Curso</h2>
    <form
      class="edit-form"
      onsubmit={(e) => {
        e.preventDefault()
        updateCourse()
      }}
    >
      <div class="form-grid">
        <div class="form-group">
          <label for="{formId}-name">Nombre</label>
          <input
            id="{formId}-name"
            class="form-input"
            bind:value={editForm.name}
            required
          />
        </div>
        <div class="form-group">
          <label for="{formId}-year">Año</label>
          <input
            id="{formId}-year"
            type="number"
            class="form-input"
            bind:value={editForm.year}
            required
          />
        </div>
        <div class="form-group">
          <label for="{formId}-level">Nivel</label>
          <Select
            name="{formId}-level"
            options={[
              { value: 'beginner', label: 'Básico' },
              { value: 'intermediate', label: 'Intermedio' },
              { value: 'advanced', label: 'Avanzado' },
            ]}
            bind:value={editForm.level}
            placeholder=""
          />
        </div>
        <div class="form-group">
          <label for="{formId}-maxStudents">Máx. Estudiantes</label>
          <input
            id="{formId}-maxStudents"
            type="number"
            class="form-input"
            bind:value={editForm.maxStudents}
          />
        </div>
        <div class="form-group">
          <label for="{formId}-status">Estado</label>
          <Select
            name="{formId}-status"
            options={[
              { value: 'open', label: 'Abierto' },
              { value: 'closed', label: 'Cerrado' },
            ]}
            bind:value={editForm.status}
            placeholder=""
          />
        </div>
        <div class="form-group">
          <label for="{formId}-startDate">Inicio inscripciones (opcional)</label
          >
          <input
            id="{formId}-startDate"
            type="datetime-local"
            class="form-input"
            bind:value={editForm.enrollmentStartDate}
          />
        </div>
        <div class="form-group">
          <label for="{formId}-endDate">Fin inscripciones (opcional)</label>
          <input
            id="{formId}-endDate"
            type="datetime-local"
            class="form-input"
            bind:value={editForm.enrollmentEndDate}
          />
        </div>
      </div>
      <div class="form-group">
        <label for="{formId}-description">Descripción</label>
        <textarea
          id="{formId}-description"
          class="form-input"
          rows="3"
          bind:value={editForm.description}
        ></textarea>
      </div>

      <fieldset class="form-group" style="padding: 0; margin: 0; border: none;">
        <legend class="form-label" style="font-weight: 500;"
          >Horarios Disponibles</legend
        >
        <div class="schedules-list">
          {#each editForm.availableSchedules as schedule, i}
            <div class="schedule-item">
              <Select
                aria-label="Día de horario"
                options={[
                  { value: 'Lunes', label: 'Lunes' },
                  { value: 'Martes', label: 'Martes' },
                  { value: 'Miércoles', label: 'Miércoles' },
                  { value: 'Jueves', label: 'Jueves' },
                  { value: 'Viernes', label: 'Viernes' },
                  { value: 'Sábado', label: 'Sábado' },
                  { value: 'Domingo', label: 'Domingo' },
                ]}
                bind:value={schedule.day}
                placeholder="Día"
              />
              <input
                aria-label="Rango de horario"
                class="form-input"
                placeholder="Ej: 18:30 - 20:00"
                bind:value={schedule.timeRange}
              />
              <button
                class="remove-btn"
                type="button"
                onclick={() => editForm.availableSchedules.splice(i, 1)}
              >
                &times;
              </button>
            </div>
          {/each}
          <button
            type="button"
            class="add-schedule-btn"
            onclick={() =>
              editForm.availableSchedules.push({
                id: Math.random().toString(36).substr(2, 9),
                day: 'Lunes',
                timeRange: '',
              })}
          >
            + Agregar horario
          </button>
        </div>
      </fieldset>

      <Button
        type="submit"
        size="lg"
        loading={updateLoading}
        loadingText="Guardando..."
      >
        Guardar cambios
      </Button>
    </form>
  </section>

  <section class="settings-section settings-section--danger-zone">
    <h2 class="settings-section__title settings-section--danger-zone">
      Zona de Peligro
    </h2>
    <p>
      Eliminar este curso borrará permanentemente todas las inscripciones
      asociadas.
    </p>
    <Button variant="danger" onclick={() => (isDeleteModalOpen = true)}>
      Eliminar curso
    </Button>
  </section>
</div>

<DeleteConfirmation
  isOpen={isDeleteModalOpen}
  title="¿Eliminar curso?"
  message="Esta acción no se puede deshacer. Esto eliminará permanentemente el curso y todas sus inscripciones."
  itemName={course.name}
  confirmText="Eliminar curso"
  onConfirm={deleteCourse}
  onCancel={() => (isDeleteModalOpen = false)}
/>

<style>
  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .settings-section__title {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 800px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-input {
    padding: 0.75rem;
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.5rem;
    background: var(--foreground-color);
    color: var(--text-color-primary);
    font-size: 1rem;
  }

  .settings-section--danger-zone {
    padding: 2rem;
    border: 2px solid rgba(220, 53, 69, 0.2);
    border-radius: 1rem;
    background: rgba(220, 53, 69, 0.05);
  }

  .settings-section__title--danger-zone {
    color: var(--button-danger-bg);
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

  .remove-btn {
    background: transparent;
    border: none;
    color: var(--color-danger);
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    padding: 0 0.25rem;
  }

  .remove-btn:hover {
    color: var(--color-danger-text);
  }

  .add-schedule-btn {
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

  .add-schedule-btn:hover {
    background: var(--brand-primary);
    color: white;
  }
</style>
