<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Modal from '@components/ui/Modal.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import ModuleCard from '@components/ui/ModuleCard.svelte'
  import ConfirmModal from '@components/ui/ConfirmModal.svelte'

  import type { Module, Material } from '../../../types/modules'

  interface Props {
    courseId: string
    initialModules: Module[]
  }

  let { courseId, initialModules }: Props = $props()

  let modulesList = $state<Module[]>(initialModules)
  let modulesLoading = $state(false)
  let isModuleModalOpen = $state(false)
  let editingModuleId = $state<string | null>(null)
  let newModule = $state({
    title: '',
    description: '',
  })
  let isMaterialModalOpen = $state(false)
  let selectedModule = $state<Module | null>(null)

  // Confirmation modal state
  let confirmModal = $state({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'primary' as 'primary' | 'danger',
  })
  let newMaterial = $state({
    title: '',
    url: '',
    type: 'link' as 'link' | 'document',
  })

  async function fetchModules() {
    modulesLoading = true
    const response = await fetch(`/api/docente/modules?courseId=${courseId}`)
    modulesList = await response.json()
    modulesLoading = false
  }

  async function saveModule() {
    if (!newModule.title.trim()) return
    const isEditing = !!editingModuleId
    const url = isEditing
      ? `/api/docente/modules?id=${editingModuleId}`
      : '/api/docente/modules'
    const method = isEditing ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      body: JSON.stringify({
        courseId,
        ...newModule,
      }),
    })
    if (!response.ok) return

    toast.success(isEditing ? 'Módulo actualizado' : 'Módulo creado')
    isModuleModalOpen = false
    newModule = { title: '', description: '' }
    editingModuleId = null
    fetchModules()
  }

  function openEditModule(mod: Module) {
    editingModuleId = mod.id
    newModule = {
      title: mod.title,
      description: mod.description || '',
    }
    isModuleModalOpen = true
  }

  async function addMaterial() {
    if (!newMaterial.title.trim() || !newMaterial.url.trim() || !selectedModule)
      return
    const response = await fetch('/api/docente/modules?action=material', {
      method: 'POST',
      body: JSON.stringify({ moduleId: selectedModule.id, ...newMaterial }),
    })

    if (!response.ok) return

    toast.success('Material agregado')
    isMaterialModalOpen = false
    newMaterial = { title: '', url: '', type: 'link' }
    fetchModules()
  }

  async function deleteModuleItem(id: string, type: 'module' | 'material') {
    confirmModal = {
      open: true,
      title: type === 'module' ? 'Eliminar Módulo' : 'Eliminar Material',
      message:
        type === 'module'
          ? '¿Estás seguro de que deseas eliminar este módulo y todo su contenido? Esta acción no se puede deshacer.'
          : '¿Estás seguro de que deseas eliminar este material?',
      type: 'danger',
      onConfirm: async () => {
        const response = await fetch(
          `/api/docente/modules?id=${id}&type=${type}`,
          {
            method: 'DELETE',
          },
        )
        if (!response.ok) return

        toast.success('Eliminado')
        confirmModal.open = false
        fetchModules()
      },
    }
  }
</script>

<div class="panel-header">
  <h2>Módulos y Materiales</h2>
  <button
    class="button button--primary"
    onclick={() => {
      editingModuleId = null
      newModule = { title: '', description: '' }
      isModuleModalOpen = true
    }}
  >
    + Nuevo Módulo
  </button>
</div>

{#if modulesLoading}
  <Loader label="Cargando módulos..." />
{:else if modulesList.length === 0}
  <div class="empty-state">
    <p>No hay módulos creados para este curso.</p>
  </div>
{:else}
  <div class="modules-grid">
    {#each modulesList as mod}
      <ModuleCard
        module={mod}
        isAdmin={true}
        onAddMaterial={() => {
          selectedModule = mod
          isMaterialModalOpen = true
        }}
        onDeleteMaterial={(id) => deleteModuleItem(id, 'material')}
        onDeleteModule={() => deleteModuleItem(mod.id, 'module')}
        onEditModule={() => openEditModule(mod)}
      />
    {/each}
  </div>
{/if}

<!-- Modals -->
<Modal
  isOpen={isModuleModalOpen}
  title={editingModuleId ? 'Editar Módulo' : 'Crear Nuevo Módulo'}
  onClose={() => (isModuleModalOpen = false)}
>
  <div class="form-modal">
    <div class="form-group">
      <label for="modTitle">Título del Módulo</label>
      <input
        id="modTitle"
        class="form-input"
        bind:value={newModule.title}
        placeholder="Ej: Clase 1: Introducción"
      />
    </div>
    <div class="form-group">
      <label for="modDesc">Descripción (opcional)</label>
      <textarea
        id="modDesc"
        class="form-input"
        bind:value={newModule.description}
        placeholder="Breve descripción del contenido..."
        rows="3"
      ></textarea>
    </div>
    <div class="modal-actions">
      <button
        class="button button--secondary"
        onclick={() => (isModuleModalOpen = false)}>Cancelar</button
      >
      <button class="button button--primary" onclick={saveModule}
        >{editingModuleId ? 'Guardar' : 'Crear'}</button
      >
    </div>
  </div>
</Modal>

<Modal
  isOpen={isMaterialModalOpen}
  title="Agregar Material a: {selectedModule?.title}"
  onClose={() => (isMaterialModalOpen = false)}
>
  <div class="form-modal">
    <div class="form-group">
      <label for="matTitle">Título</label>
      <input
        id="matTitle"
        class="form-input"
        bind:value={newMaterial.title}
        placeholder="Ej: Diapositivas"
      />
    </div>
    <div class="form-group">
      <label for="matUrl">URL (Link)</label>
      <input
        id="matUrl"
        class="form-input"
        type="url"
        bind:value={newMaterial.url}
        placeholder="https://..."
      />
    </div>
    <div class="form-group">
      <label for="matType">Tipo de Material</label>
      <select id="matType" class="form-input" bind:value={newMaterial.type}>
        <option value="link">🔗 Enlace página web</option>
        <option value="document">📄 Documento / Recurso</option>
      </select>
    </div>
    <div class="modal-actions">
      <button
        class="button button--secondary"
        onclick={() => (isMaterialModalOpen = false)}>Cancelar</button
      >
      <button class="button button--primary" onclick={addMaterial}
        >Agregar</button
      >
    </div>
  </div>
</Modal>

<ConfirmModal
  isOpen={confirmModal.open}
  title={confirmModal.title}
  message={confirmModal.message}
  type={confirmModal.type}
  onConfirm={confirmModal.onConfirm}
  onCancel={() => (confirmModal.open = false)}
/>

<style>
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .button {
    padding: 0.625rem 1.25rem;
    border-radius: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .button--primary {
    background: var(--brand-primary);
    color: white;
  }

  .button--primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--brand-primary-rgb), 0.3);
  }

  .button--secondary {
    background: var(--foreground-color);
    border: 1px solid var(--border-color);
    color: var(--text-color-primary);
  }

  .button--secondary:hover {
    background: var(--border-color-light);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form-input {
    padding: 0.5rem;
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.375rem;
    background: var(--foreground-color);
    color: var(--text-color-primary);
    width: 100%;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-color-secondary);
  }
</style>
