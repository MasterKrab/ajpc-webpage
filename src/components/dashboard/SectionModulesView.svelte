<script lang="ts">
  import { toast } from 'svelte-sonner'
  import ModuleCard from '@components/ui/ModuleCard.svelte'
  import Modal from '@components/ui/Modal.svelte'
  import ConfirmModal from '@components/ui/ConfirmModal.svelte'
  import Button from '@components/ui/Button.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import type { Module } from '@app-types/modules'

  interface Props {
    courseId: string
    isAdmin: boolean
    initialModules?: Module[]
  }

  let { courseId, isAdmin, initialModules = [] }: Props = $props()

  let modulesList = $state<Module[]>(initialModules)
  let modulesLoading = $state(initialModules.length === 0)

  let selectedModule = $state<Module | null>(null)
  let isMaterialModalOpen = $state(false)
  let newMaterial = $state({
    title: '',
    url: '',
    type: 'link' as 'link' | 'document',
  })

  let isModuleModalOpen = $state(false)
  let editingModuleId = $state<string | null>(null)
  let newModule = $state({ title: '', description: '' })

  let confirmModal = $state({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'primary' as 'primary' | 'danger',
  })

  async function fetchModules() {
    modulesLoading = true
    try {
      const response = await fetch(`/api/docente/modules?courseId=${courseId}`)
      modulesList = await response.json()
    } catch (error) {
      console.error(error)
    } finally {
      modulesLoading = false
    }
  }

  async function saveModule() {
    if (!newModule.title.trim() || !editingModuleId) return
    const response = await fetch(`/api/docente/modules?id=${editingModuleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ courseId, ...newModule }),
    })
    if (!response.ok) return
    toast.success('Módulo actualizado')
    isModuleModalOpen = false
    editingModuleId = null
    fetchModules()
  }

  function openEditModule(mod: Module) {
    editingModuleId = mod.id
    newModule = { title: mod.title, description: mod.description || '' }
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

  // Only fetch if no SSR data
  if (initialModules.length === 0) fetchModules()
</script>

<div class="modules-manager">
  {#if modulesLoading}
    <Loader label="Cargando módulos..." />
  {:else if modulesList.length === 0}
    <div class="empty-state">
      <p>No hay módulos creados aún.</p>
    </div>
  {:else}
    <div class="modules-grid">
      {#each modulesList as mod}
        <ModuleCard
          module={mod}
          {isAdmin}
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
</div>

<Modal
  isOpen={isModuleModalOpen}
  title="Editar Módulo"
  onClose={() => (isModuleModalOpen = false)}
>
  <div class="form-modal">
    <div class="form-group">
      <label for="module-title">Título del Módulo</label>
      <input
        id="module-title"
        class="form-input"
        bind:value={newModule.title}
        placeholder="Ej: Clase 1: Introducción"
      />
    </div>
    <div class="form-group">
      <label for="module-description">Descripción (opcional)</label>
      <textarea
        id="module-description"
        class="form-input"
        bind:value={newModule.description}
        placeholder="Breve descripción del contenido..."
        rows="3"
      ></textarea>
    </div>
    <div class="modal-actions">
      <Button variant="secondary" onclick={() => (isModuleModalOpen = false)}
        >Cancelar</Button
      >
      <Button onclick={saveModule}>Guardar</Button>
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
      <label for="material-title">Título</label>
      <input
        id="material-title"
        class="form-input"
        bind:value={newMaterial.title}
        placeholder="Ej: Diapositivas"
      />
    </div>
    <div class="form-group">
      <label for="material-url">URL (Link)</label>
      <input
        id="material-url"
        class="form-input"
        type="url"
        bind:value={newMaterial.url}
        placeholder="https://..."
      />
    </div>
    <div class="form-group">
      <label for="module-type">Tipo de Material</label>
      <select id="module-type" class="form-input" bind:value={newMaterial.type}>
        <option value="link">🔗 Enlace página web</option>
        <option value="document">📄 Documento / Recurso</option>
      </select>
    </div>
    <div class="modal-actions">
      <Button variant="secondary" onclick={() => (isMaterialModalOpen = false)}
        >Cancelar</Button
      >
      <Button onclick={addMaterial}>Agregar</Button>
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
  .empty-state {
    padding: 4rem;
    text-align: center;
    background-color: var(--background-color);
    color: var(--text-color-secondary);
    border-radius: 1.25rem;
    border: 2px dashed var(--border-color);
  }

  .modules-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form-input {
    padding: 0.625rem;
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.375rem;
    background: var(--foreground-color);
    color: var(--text-color-primary);
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
</style>
