<script lang="ts">
  import type { Module, Material } from '../../types/modules'

  interface Props {
    module: Module
    isAdmin: boolean
    onAddMaterial?: () => void
    onDeleteMaterial?: (id: string) => void
    onDeleteModule?: () => void
    onEditModule?: () => void
  }

  let {
    module,
    isAdmin,
    onAddMaterial,
    onDeleteMaterial,
    onDeleteModule,
    onEditModule,
  }: Props = $props()
</script>

<div class="module-card">
  <div class="module-card__sidebar"></div>
  <div class="module-card__content">
    <header class="module-card__header">
      <div class="module-card__info">
        <h3 class="module-card__title">{module.title}</h3>
        {#if module.description}
          <p class="module-card__description">{module.description}</p>
        {/if}
      </div>
      {#if isAdmin}
        <div class="module-card__actions">
          <button
            class="action-button action-button--edit"
            onclick={onEditModule}
            aria-label="Editar módulo"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
              />
            </svg>
          </button>
          <button
            class="action-button action-button--danger"
            onclick={onDeleteModule}
            aria-label="Eliminar módulo"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      {/if}
    </header>

    <div class="materials-section">
      <h4 class="materials-section__title">Materiales y Recursos</h4>
      {#if module.materials && module.materials.length > 0}
        <ul class="materials-list">
          {#each module.materials as mat}
            <li class="material-item">
              <a
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                class="material-link"
              >
                <span class="material-icon">
                  {#if mat.type === 'document'}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  {:else}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                      />
                      <path
                        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                      />
                    </svg>
                  {/if}
                </span>
                <span class="material-title">{mat.title}</span>
              </a>
              {#if isAdmin}
                <button
                  class="delete-material-button"
                  onclick={() => onDeleteMaterial?.(mat.id)}
                  aria-label="Eliminar material"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty-materials">
          No hay materiales cargados en este módulo.
        </p>
      {/if}

      {#if isAdmin}
        <button class="add-material-button" onclick={onAddMaterial}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar Material
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .module-card {
    border: 0.125rem solid var(--border-color);
    border-radius: 1.25rem;
    display: flex;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .module-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.05);
    border-color: var(--brand-primary);
  }

  .module-card__sidebar {
    width: 6px;
    background: var(--brand-primary);
  }

  .module-card__content {
    flex: 1;
    padding: 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .module-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .module-card__info {
    flex: 1;
  }

  .module-card__title {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text-color-primary);
    letter-spacing: -0.01em;
  }

  .module-card__description {
    margin: 0.5rem 0 0;
    font-size: 0.95rem;
    color: var(--text-color-secondary);
    line-height: 1.5;
  }

  .module-card__actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-button {
    width: 2.25rem;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.75rem;
    cursor: pointer;
  }

  .action-button svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  .action-button:hover {
    transform: scale(1.05);
  }

  .action-button--edit {
    border: 0.125rem solid var(--brand-primary);
    color: var(--brand-primary);
  }

  .action-button--danger {
    color: var(--color-danger);
    background: var(--color-danger-bg);
  }

  .action-button--danger:hover {
    background: var(--color-danger);
    color: var(--text-color-primary);
  }

  .materials-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .materials-section__title {
    margin: 0;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    color: var(--text-color-secondary);
    opacity: 0.8;
  }

  .materials-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
  }

  .material-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color-light);
    border-radius: 1rem;
    transition:
      border-color 0.2s,
      color 0.2s;
  }

  .material-item:hover {
    border-color: var(--brand-primary);
    color: var(--brand-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }

  .material-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: inherit;
    flex: 1;
    min-width: 0;
  }

  .material-icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    border-radius: 0.5rem;
    flex-shrink: 0;
  }

  .material-icon svg {
    width: 1rem;
    height: 1rem;
  }

  .material-title {
    font-size: 0.95rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .delete-material-button {
    background: none;
    border: none;
    color: var(--color-danger);
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
    transition: all 0.2s;
    opacity: 0.4;
  }

  .delete-material-button:hover {
    opacity: 1;
  }

  .delete-material-button svg {
    width: 0.9rem;
    height: 0.9rem;
  }

  .empty-materials {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-color-secondary);
    padding: 1rem;
    background-color: var(--background-color);
    border: 2px dashed var(--border-color);
    border-radius: 1rem;
    text-align: center;
  }

  .add-material-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: 2px dashed var(--brand-primary);
    color: var(--brand-primary);
    border-radius: 1rem;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    width: fit-content;
  }

  .add-material-button:hover {
    transform: translateY(-2px);
  }

  .add-material-button svg {
    width: 1.1rem;
    height: 1.1rem;
  }
</style>
