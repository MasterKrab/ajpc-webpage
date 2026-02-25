<script lang="ts">
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import TeacherSectionView from './TeacherSectionView.svelte'

  type Student = {
    id: string
    name: string | null
    discordUsername: string
    enrollmentId: string
  }

  type Section = {
    id: string
    name: string
    courseId: string
    courseName: string
    studentCount: number
  }

  let {
    userRole,
    user,
  }: {
    userRole: 'student' | 'docente' | 'admin' | 'sudo'
    user: {
      discordUsername: string
      discordAvatar: string | null
      discordId: string
    }
  } = $props()
  let sections = $state<Section[]>([])
  let loading = $state(true)
  let activeSectionId = $state<string | null>(null)

  const isAdmin = $derived(userRole === 'admin' || userRole === 'sudo')

  const activeSection = $derived(
    sections.find((s) => s.id === activeSectionId) || null,
  )

  async function fetchSections() {
    loading = true
    try {
      const response = await fetch('/api/docente/sections')
      sections = await response.json()
    } catch (err) {
      console.error(err)
    } finally {
      loading = false
    }
  }

  onMount(fetchSections)
</script>

<div class="teacher-dashboard">
  {#if loading}
    <div class="loading-state">
      <div class="loader"></div>
      <p>Cargando tus paralelos...</p>
    </div>
  {:else if sections.length === 0}
    <div class="empty-state" in:fade>
      <div class="empty-state__icon">📚</div>
      <h2>No tienes paralelos asignados</h2>
      <p>
        Aún no has sido asignado a ningún paralelo (sección) de un curso. Por
        favor, contacta a un administrador.
      </p>
    </div>
  {:else}
    <div class="teacher-dashboard__content">
      {#if !activeSectionId}
        <div class="lobby" in:fade={{ duration: 200 }}>
          <header class="lobby__header">
            <div class="lobby__user">
              {#if user.discordAvatar}
                <img
                  class="lobby__avatar"
                  src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=64`}
                  alt={user.discordUsername}
                  width="48"
                  height="48"
                />
              {/if}
              <div>
                <h1 class="lobby__title">
                  ¡Hola, {user.discordUsername}! 👋
                </h1>
                <p class="lobby__subtitle">Mis Paralelos (Docente)</p>
              </div>
            </div>
          </header>

          <div class="sections-grid">
            {#each sections as section}
              <button
                class="section-card"
                onclick={() => (activeSectionId = section.id)}
              >
                <div class="section-card__content">
                  <h3 class="section-card__name">{section.name}</h3>
                  <span class="section-card__course">{section.courseName}</span>
                </div>
                <div class="section-card__footer">
                  <span class="student-count">
                    {section.studentCount} Estudiantes
                  </span>
                  <span class="card-arrow">→</span>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {:else if activeSection}
        <div in:fade={{ duration: 200 }}>
          <TeacherSectionView
            section={activeSection}
            {isAdmin}
            onBack={() => (activeSectionId = null)}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .teacher-dashboard {
    min-height: 500px;
  }

  .loading-state,
  .empty-state {
    padding: 6rem 2rem;
    text-align: center;
    background: var(--foreground-color);
    border-radius: 1.5rem;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
  }

  .loader {
    width: 40px;
    height: 40px;
    border: 4px solid var(--foreground-color);
    border-top: 4px solid var(--brand-primary);
    border-radius: 50%;
    margin: 0 auto 1.5rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-state h2 {
    margin: 0 0 1rem;
    font-size: 1.75rem;
    font-weight: 800;
  }

  .empty-state p {
    color: var(--text-color-secondary);
    max-width: 450px;
    margin: 0 auto;
    line-height: 1.6;
    font-size: 1.1rem;
  }

  .lobby__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .lobby__user {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .lobby__avatar {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: var(--shadow-sm);
    border: 2px solid var(--border-color);
  }

  .lobby__title {
    font-size: 1.75rem;
    margin: 0;
    font-weight: 800;
  }

  .lobby__subtitle {
    margin: 0;
    color: var(--text-color-secondary);
    font-size: 0.9rem;
  }

  .sections-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section-card {
    background: var(--foreground-color);
    border: 1px solid var(--border-color);
    border-radius: 1.25rem;
    text-align: left;
    padding: 1.5rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    font-size: 1rem;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
    border-left: 6px solid var(--brand-primary);

    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @media (min-width: 48rem) {
    .section-card {
      flex-direction: row;
      gap: 2rem;
      font-size: 1.5rem;
      padding: 1.5rem 2rem;
    }
  }

  .section-card:hover {
    transform: translateX(8px);
    border-color: var(--brand-primary);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  }

  .section-card__content {
    flex: 1;
  }

  .section-card__name {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-color-primary);
  }

  .section-card__course {
    color: var(--text-color-secondary);
    font-size: 1.05rem;
    font-weight: 500;
    margin-top: 0.25rem;
    display: block;
  }

  .section-card__footer {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding-left: 2rem;
    border-left: 1px solid var(--border-color);
  }

  .student-count {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--brand-primary);
    background: rgba(var(--brand-primary-rgb), 0.1);
    padding: 0.4rem 0.8rem;
    border-radius: 0.75rem;
  }

  .card-arrow {
    font-size: 1.5rem;
    color: var(--brand-primary);
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.3s;
  }

  .section-card:hover .card-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  @media (max-width: 640px) {
    .lobby__title {
      font-size: 2rem;
    }
    .sections-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
