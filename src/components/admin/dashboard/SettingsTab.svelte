<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { nanoid } from 'nanoid'
  import Select from '@components/ui/Select.svelte'
  import DeleteConfirmation from '../DeleteConfirmation.svelte'
  import Button from '@components/ui/Button.svelte'
  import { trpcClient } from '@app-trpc/client'

  interface Schedule {
    id: string
    day: string
    timeRange: string
  }

  interface Course {
    id: string
    name: string
    description: string | null
    level: string
    year: number
    maxStudents: number | null
    status: string
    availableSchedules?: Schedule[]
    discordGuildId: string | null
    discordRoleId: string | null
  }

  interface Props {
    course: Course
  }

  let { course = $bindable() }: Props = $props()
  const formId = nanoid(5)

  let updateLoading = $state(false)
  let isDeleteModalOpen = $state(false)

  let editForm = $state({
    name: course?.name || '',
    description: course?.description || '',
    level: course?.level || 'beginner',
    year: course?.year || new Date().getFullYear(),
    maxStudents: course?.maxStudents,
    status: course?.status || 'closed',
    availableSchedules: course?.availableSchedules
      ? [...course.availableSchedules]
      : ([] as Schedule[]),
    discordGuildId: course?.discordGuildId || '',
    discordRoleId: course?.discordRoleId || '',
  })

  const updateCourse = async () => {
    updateLoading = true
    try {
      await trpcClient.admin.courses.update.mutate({
        id: course.id,
        name: editForm.name,
        description: editForm.description || undefined,
        level: editForm.level as 'beginner' | 'intermediate' | 'advanced',
        year: Number(editForm.year),
        maxStudents: editForm.maxStudents ?? null,
        status: editForm.status as 'open' | 'closed',
        availableSchedules: editForm.availableSchedules,
        discordGuildId: editForm.discordGuildId || null,
        discordRoleId: editForm.discordRoleId || null,
      })
      course = {
        ...course,
        ...editForm,
      }
      toast.success('Curso actualizado correctamente')
    } catch (error: unknown) {
      const trpcError = error as { message?: string }
      toast.error(trpcError?.message || 'Error al actualizar el curso')
    } finally {
      updateLoading = false
    }
  }

  const deleteCourse = async () => {
    try {
      await trpcClient.admin.courses.delete.mutate({ id: course.id })
      window.location.href = '/admin'
    } catch (error: unknown) {
      const trpcError = error as { message?: string }
      toast.error(trpcError?.message || 'Error al eliminar el curso')
    }
  }
</script>

<div class="settings-panel">
  <section class="settings-section">
    <h2 class="settings-section__title">Editar Curso</h2>
    <form
      class="edit-form"
      onsubmit={(event) => {
        event.preventDefault()
        updateCourse()
      }}
    >
      <div class="form-grid">
        <div class="form-group">
          <label class="form-group__label" for="{formId}-name">Nombre</label>
          <input
            id="{formId}-name"
            class="form-input"
            bind:value={editForm.name}
            required
          />
        </div>
        <div class="form-group">
          <label class="form-group__label" for="{formId}-year">Año</label>
          <input
            id="{formId}-year"
            type="number"
            class="form-input"
            bind:value={editForm.year}
            required
          />
        </div>
        <div class="form-group">
          <label class="form-group__label" for="{formId}-level">Nivel</label>
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
          <label class="form-group__label" for="{formId}-maxStudents"
            >Máx. Estudiantes</label
          >
          <input
            id="{formId}-maxStudents"
            type="number"
            class="form-input"
            bind:value={editForm.maxStudents}
          />
        </div>
        <div class="form-group">
          <label class="form-group__label" for="{formId}-status">Estado</label>
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
      </div>
      <div class="form-group">
        <label class="form-group__label" for="{formId}-description"
          >Descripción</label
        >
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
          {#each editForm.availableSchedules as schedule, index}
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
                class="remove-button"
                type="button"
                aria-label="Eliminar horario {schedule.day} {schedule.timeRange}"
                onclick={() => {
                  editForm.availableSchedules =
                    editForm.availableSchedules.filter(
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

              editForm.availableSchedules = [
                ...editForm.availableSchedules,
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

      <fieldset class="form-group" style="padding: 0; margin: 0; border: none;">
        <legend class="form-label" style="font-weight: 500;">Configuración de Discord</legend>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-group__label" for="{formId}-discordGuildId">ID del Servidor (Guild ID)</label>
            <input
              id="{formId}-discordGuildId"
              class="form-input"
              placeholder="Ej: 110..."
              bind:value={editForm.discordGuildId}
            />
          </div>
          <div class="form-group">
            <label class="form-group__label" for="{formId}-discordRoleId">ID del Rol (Opcional)</label>
            <input
              id="{formId}-discordRoleId"
              class="form-input"
              placeholder="Ej: 110..."
              bind:value={editForm.discordRoleId}
              aria-describedby="{formId}-discord-help"
            />
          </div>
        </div>
        <p id="{formId}-discord-help" class="form-help-text" style="font-size: 0.8rem; color: var(--text-color-secondary); margin-top: 0.5rem;">
          Los alumnos serán agregados automáticamente a este servidor con este rol cuando su inscripción sea aprobada.
        </p>
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
    <p class="settings-section__description">
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
