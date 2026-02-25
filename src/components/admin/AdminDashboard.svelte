<script lang="ts">
  import Modal from '@components/ui/Modal.svelte'
  import Tabs from '@components/ui/Tabs.svelte'
  import PanelHeader from '@components/ui/PanelHeader.svelte'
  import RoleBadge from '@components/ui/RoleBadge.svelte'
  import Select from '@components/ui/Select.svelte'
  import TemplateEditor from './TemplateEditor.svelte'
  import EmailSender from './EmailSender.svelte'
  import InviteManager from './InviteManager.svelte'
  import SettingsManager from './SettingsManager.svelte'
  import { toast } from 'svelte-sonner'
  import SearchBox from '@components/ui/SearchBox.svelte'

  import UserTable from '@components/ui/UserTable.svelte'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'

  type Course = {
    id: string
    name: string
    description: string | null
    level: string
    year: number
    maxStudents: number | null
    status: string
  }

  type User = {
    id: string
    discordId: string
    discordUsername: string
    discordAvatar: string | null
    name: string | null
    email: string | null
    role: string
  }

  interface Props {
    isSudo: boolean
    userRole: string
  }

  let { isSudo, userRole }: Props = $props()

  const tabs = $derived([
    { id: 'courses', label: 'Cursos', icon: '📚' },
    ...(isSudo ? [{ id: 'users', label: 'Usuarios', icon: '👥' }] : []),
    { id: 'templates', label: 'Plantillas', icon: '📧' },
    { id: 'email', label: 'Enviar Correos', icon: '✉️' },
    { id: 'invites', label: 'Invitaciones', icon: '🎟️' },
    { id: 'settings', label: 'Configuración', icon: '⚙️' },
  ])

  let activeTab = $state<string>('courses')

  let coursesList = $state<Course[]>([])
  let coursesLoading = $state(true)
  let showCourseForm = $state(false)
  let newCourse = $state({
    name: '',
    description: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    year: new Date().getFullYear(),
    maxStudents: undefined as number | undefined,
    enrollmentStartDate: '',
    enrollmentEndDate: '',
  })
  let courseFormLoading = $state(false)

  let usersList = $state<User[]>([])
  let usersTotal = $state(0)
  let usersLoading = $state(false)
  let roleChangeLoading = $state<string | null>(null)

  let userSearchQuery = $state('')
  let usersPage = $state(1)
  const USERS_PER_PAGE = 20

  const hasMoreUsers = $derived(usersList.length < usersTotal)

  const fetchCourses = async () => {
    coursesLoading = true
    try {
      const response = await fetch('/api/admin/courses')
      const data = await response.json()
      coursesList = data.courses || []
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Error al cargar cursos')
    } finally {
      coursesLoading = false
    }
  }

  const fetchUsers = async (page = 1, append = false) => {
    if (!append) usersLoading = true
    try {
      const searchParam = userSearchQuery
        ? `&search=${encodeURIComponent(userSearchQuery)}`
        : ''
      const response = await fetch(
        `/api/admin/users?page=${page}&limit=${USERS_PER_PAGE}${searchParam}`,
      )
      const data = await response.json()

      if (append) usersList = [...usersList, ...(data.users || [])]
      else usersList = data.users || []

      usersTotal = data.total || 0
      usersPage = page
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      usersLoading = false
    }
  }

  $effect(() => {
    fetchCourses()
  })

  let hasRequestedUsers = false
  $effect(() => {
    if (
      isSudo &&
      activeTab === 'users' &&
      !hasRequestedUsers &&
      !usersLoading
    ) {
      hasRequestedUsers = true
      fetchUsers(1, false)
    }
  })

  let lastSearch = ''
  $effect(() => {
    if (!isSudo || activeTab !== 'users') return
    if (userSearchQuery === lastSearch) return

    const timer = setTimeout(() => {
      lastSearch = userSearchQuery
      fetchUsers(1, false)
    }, 400)

    return () => clearTimeout(timer)
  })

  const createCourse = async () => {
    courseFormLoading = true
    const response = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newCourse,
        enrollmentStartDate: newCourse.enrollmentStartDate || null,
        enrollmentEndDate: newCourse.enrollmentEndDate || null,
      }),
    })

    if (response.ok) toast.success('Curso creado correctamente')
    else toast.error('Error al crear el curso')

    courseFormLoading = false
    showCourseForm = false
    newCourse = {
      name: '',
      description: '',
      level: 'beginner',
      year: new Date().getFullYear(),
      maxStudents: undefined,
      enrollmentStartDate: '',
      enrollmentEndDate: '',
    }
    await fetchCourses()
  }

  const changeRole = async (userId: string, role: string) => {
    roleChangeLoading = userId

    const response = await fetch(`/api/admin/users?id=${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    if (response.ok) toast.success('Rol actualizado correctamente')
    else toast.error('Error al actualizar el rol')

    roleChangeLoading = null
    fetchUsers(1, false)
  }

  const levelLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return '🟢 Básico'
      case 'intermediate':
        return '🟡 Intermedio'
      case 'advanced':
        return '🔴 Avanzado'
      default:
        return level
    }
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

<div class="admin">
  <PanelHeader title="Panel de Administración 🛡️">
    {#snippet subtitle()}
      Rol: <RoleBadge role={userRole} />
    {/snippet}
    <Tabs {tabs} bind:activeTab />
  </PanelHeader>

  {#if activeTab === 'courses'}
    <section class="admin__panel" role="tabpanel">
      <SubHeader title="Cursos">
        {#snippet actions()}
          <button
            class="button button--primary"
            onclick={() => (showCourseForm = true)}
          >
            + Nuevo curso
          </button>
        {/snippet}
      </SubHeader>

      <Modal
        isOpen={showCourseForm}
        title="Crear Nuevo Curso"
        onClose={() => (showCourseForm = false)}
      >
        <form
          class="course-form"
          onsubmit={(e) => {
            e.preventDefault()
            createCourse()
          }}
        >
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="courseName">Nombre *</label>
              <input
                class="form-input"
                id="courseName"
                bind:value={newCourse.name}
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
                bind:value={newCourse.year}
                required
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="courseLevel">Nivel *</label>
              <select
                class="form-input"
                id="courseLevel"
                bind:value={newCourse.level}
              >
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
                bind:value={newCourse.maxStudents}
                min="1"
                placeholder="Opcional"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="startDate"
                >Inicio inscripciones</label
              >
              <input
                class="form-input"
                type="datetime-local"
                id="startDate"
                bind:value={newCourse.enrollmentStartDate}
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="endDate">Fin inscripciones</label>
              <input
                class="form-input"
                type="datetime-local"
                id="endDate"
                bind:value={newCourse.enrollmentEndDate}
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="courseDesc">Descripción</label>
            <textarea
              class="form-input"
              id="courseDesc"
              bind:value={newCourse.description}
              rows="3"
              placeholder="Breve descripción del curso..."
            ></textarea>
          </div>
          <div class="modal-actions">
            <button
              class="button button--secondary"
              type="button"
              onclick={() => (showCourseForm = false)}
            >
              Cancelar
            </button>
            <button
              class="button button--primary"
              type="submit"
              disabled={courseFormLoading}
            >
              {courseFormLoading ? 'Creando...' : 'Crear curso'}
            </button>
          </div>
        </form>
      </Modal>

      {#if coursesLoading}
        <DashboardContent>
          <p class="admin__loading">Cargando cursos...</p>
        </DashboardContent>
      {:else if coursesList.length === 0}
        <DashboardContent>
          <p class="admin__empty">No hay cursos creados.</p>
        </DashboardContent>
      {:else}
        <div class="courses-grid">
          {#each coursesList as course}
            <article class="course-admin-card">
              <div class="course-admin-card__header">
                <h3 class="course-admin-card__name">{course.name}</h3>
                <span
                  class="course-admin-card__status course-admin-card__status--{course.status}"
                >
                  {course.status === 'open' ? '🟢 Abierto' : '🔴 Cerrado'}
                </span>
              </div>
              <p class="course-admin-card__info">
                {levelLabel(course.level)} · {course.year}
                {#if course.maxStudents}
                  · Máx: {course.maxStudents}
                {/if}
              </p>
              {#if course.description}
                <p class="course-admin-card__desc">{course.description}</p>
              {/if}
              <a
                href={`/admin/cursos/${course.id}`}
                class="button button--primary button--full-width button--to-bottom"
              >
                Gestionar curso
              </a>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  {#if activeTab === 'users' && isSudo}
    <section class="admin__panel" role="tabpanel">
      <SubHeader title="Gestión de usuarios">
        {#snippet actions()}
          <SearchBox
            bind:value={userSearchQuery}
            placeholder="Buscar usuarios..."
          />
        {/snippet}
      </SubHeader>

      <DashboardContent padding={false}>
        <UserTable
          users={usersList}
          loading={usersLoading}
          hasMore={hasMoreUsers}
          onLoadMore={() => fetchUsers(usersPage + 1, true)}
          showEmail
          showRole
        >
          {#snippet actions(user)}
            <Select
              options={[
                { value: 'student', label: 'student' },
                { value: 'docente', label: 'docente' },
                { value: 'admin', label: 'admin' },
                { value: 'sudo', label: 'sudo' },
              ]}
              value={user.role}
              disabled={roleChangeLoading === user.id || user.role === 'sudo'}
              onChange={(val) => changeRole(user.id, val)}
              placeholder=""
            />
          {/snippet}
        </UserTable>
      </DashboardContent>
    </section>
  {/if}

  {#if activeTab === 'templates'}
    <section class="admin__panel" role="tabpanel">
      <TemplateEditor />
    </section>
  {/if}

  {#if activeTab === 'email'}
    <section class="admin__panel" role="tabpanel">
      <EmailSender />
    </section>
  {/if}

  {#if activeTab === 'invites'}
    <section class="admin__panel" role="tabpanel">
      <InviteManager {isSudo} />
    </section>
  {/if}

  {#if activeTab === 'settings'}
    <section class="admin__panel" role="tabpanel">
      <SettingsManager />
    </section>
  {/if}
</div>

<style>
  .admin {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .admin__panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .admin__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .admin__panel-title {
    font-size: 1.5rem;
    margin: 0;
  }

  .admin__filter {
    padding: 0.5rem 0.75rem;
    border: 2px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.5rem;
    font-family: inherit;
    font-size: 0.875rem;
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
  }

  .admin__loading,
  .admin__empty {
    padding: 2rem;
    text-align: center;
    color: var(--text-color-secondary);
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .actions-cell {
    min-width: 12rem;
  }

  .actions-cell {
    min-width: 12rem;
  }

  .admin__notes-input {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 0.8125rem;
    margin-bottom: 0.375rem;
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
  }

  .action-buttons {
    display: flex;
    gap: 0.375rem;
  }

  .status-badge {
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.25rem 0.625rem;
    border-radius: 2rem;
    white-space: nowrap;
  }

  .status-badge--pending {
    background-color: #fff3cd;
    color: #856404;
  }

  .status-badge--approved {
    background-color: #d4edda;
    color: #155724;
  }

  .status-badge--rejected {
    background-color: #f8d7da;
    color: #721c24;
  }

  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      opacity 0.2s,
      transform 0.1s;
    white-space: nowrap;
  }

  .button:hover:not(:disabled) {
    opacity: 0.85;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button--primary {
    background-color: var(--brand-primary);
    color: #fff;
  }

  .button--approve {
    background-color: #28a745;
    color: #fff;
  }

  .button--reject {
    background-color: #dc3545;
    color: #fff;
  }

  .button--small {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    background-color: var(--foreground-color);
    border: 1px solid rgba(128, 128, 128, 0.2);
    color: var(--text-color-primary);
  }

  .button--full-width {
    width: 100%;
    margin-top: auto;
    text-align: center;
    text-decoration: none;
    display: block;
  }

  .button--to-bottom {
    align-self: flex-end;
  }

  .text-muted {
    color: var(--text-color-secondary);
    font-size: 0.8125rem;
  }

  .course-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    padding: 1.5rem;
    background-color: var(--foreground-color);
    border-radius: 0.75rem;
    border: 1px solid rgba(128, 128, 128, 0.15);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
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
  }

  .form-input:focus {
    border-color: var(--brand-primary);
    outline: none;
  }

  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 1.5rem;
  }

  .course-admin-card {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    background-color: var(--foreground-color);
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
    border-left: 5px solid var(--brand-secondary);
    box-shadow: var(--shadow);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .course-admin-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .course-admin-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    gap: 1rem;
  }

  .course-admin-card__name {
    margin: 0;
    font-size: 1.25rem;
    color: var(--brand-primary);
  }

  .course-admin-card__status {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.625rem;
    border-radius: 2rem;
    white-space: nowrap;
    border: 1px solid transparent;
  }

  .course-admin-card__status--open {
    background-color: var(--color-success-bg);
    color: var(--color-success-text);
    border-color: var(--color-success);
  }

  .course-admin-card__status--closed {
    background-color: var(--color-danger-bg);
    color: var(--color-danger-text);
    border-color: var(--color-danger);
  }

  .course-admin-card__info {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    font-weight: 600;
  }

  .course-admin-card__desc {
    font-size: 0.9375rem;
    color: var(--text-color-secondary);
    margin: 0 0 1.5rem;
    line-height: 1.5;
    flex-grow: 1;
  }

  .course-admin-card__info {
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    margin: 0 0 0.5rem;
  }

  .course-admin-card__desc {
    font-size: 0.875rem;
    margin: 0 0 1rem;
  }

  .button--full-width {
    width: 100%;
    display: block;
    text-align: center;
    text-decoration: none;
    box-sizing: border-box;
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .user-cell__avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
  }

  .admin__role-select {
    padding: 0.375rem 0.5rem;
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 0.8125rem;
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
  }
</style>
