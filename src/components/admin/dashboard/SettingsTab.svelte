<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Select from '@components/ui/Select.svelte'
  import DeleteConfirmation from '../DeleteConfirmation.svelte'

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
  }

  interface Props {
    course: Course
  }

  let { course = $bindable() }: Props = $props()

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
    <h2>Editar Curso</h2>
    <form
      class="edit-form"
      onsubmit={(e) => {
        e.preventDefault()
        updateCourse()
      }}
    >
      <div class="form-grid">
        <div class="form-group">
          <label for="name">Nombre</label>
          <input
            id="name"
            class="form-input"
            bind:value={editForm.name}
            required
          />
        </div>
        <div class="form-group">
          <label for="year">Año</label>
          <input
            id="year"
            type="number"
            class="form-input"
            bind:value={editForm.year}
            required
          />
        </div>
        <div class="form-group">
          <label for="level">Nivel</label>
          <Select
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
          <label for="maxStudents">Máx. Estudiantes</label>
          <input
            id="maxStudents"
            type="number"
            class="form-input"
            bind:value={editForm.maxStudents}
          />
        </div>
        <div class="form-group">
          <label for="status">Estado</label>
          <Select
            options={[
              { value: 'open', label: 'Abierto' },
              { value: 'closed', label: 'Cerrado' },
            ]}
            bind:value={editForm.status}
            placeholder=""
          />
        </div>
        <div class="form-group">
          <label for="startDate">Inicio inscripciones (opcional)</label>
          <input
            id="startDate"
            type="datetime-local"
            class="form-input"
            bind:value={editForm.enrollmentStartDate}
          />
        </div>
        <div class="form-group">
          <label for="endDate">Fin inscripciones (opcional)</label>
          <input
            id="endDate"
            type="datetime-local"
            class="form-input"
            bind:value={editForm.enrollmentEndDate}
          />
        </div>
      </div>
      <div class="form-group">
        <label for="description">Descripción</label>
        <textarea
          id="description"
          class="form-input"
          rows="3"
          bind:value={editForm.description}
        ></textarea>
      </div>
      <button
        type="submit"
        class="button button--primary"
        disabled={updateLoading}
      >
        {updateLoading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  </section>

  <section class="settings-section danger-zone">
    <h2>Zona de Peligro</h2>
    <p>
      Eliminar este curso borrará permanentemente todas las inscripciones
      asociadas.
    </p>
    <button
      class="button button--danger"
      onclick={() => (isDeleteModalOpen = true)}
    >
      Eliminar curso
    </button>
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
  .settings-section h2 {
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
  .button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .button--primary {
    background: var(--brand-primary);
    color: white;
  }
  .button--danger {
    background: #dc3545;
    color: white;
  }
  .danger-zone {
    padding: 2rem;
    border: 2px solid rgba(220, 53, 69, 0.2);
    border-radius: 1rem;
    background: rgba(220, 53, 69, 0.05);
  }
  .danger-zone h2 {
    color: #dc3545;
  }
</style>
