<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Modal from '@components/ui/Modal.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import ModuleCard from '@components/ui/ModuleCard.svelte'
  import ConfirmModal from '@components/ui/ConfirmModal.svelte'
  import Button from '@components/ui/Button.svelte'

  import type { Module, Material } from '../../../types/modules'
  import { trpcClient } from '@app-trpc/client'

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
    const result = await trpcClient.docente.modules.listByCourse.query({ courseId })
    modulesList = result as unknown as Module[]
    modulesLoading = false
  }

  async function saveModule() {
    if (!newModule.title.trim()) return
    const isEditing = !!editingModuleId

    if (isEditing) {
      const result = await trpcClient.docente.modules.update.mutate({
        id: editingModuleId!,
        courseId,
        ...newModule,
      })
      if (!result) return
    } else {
      const result = await trpcClient.docente.modules.create.mutate({
        courseId,
        ...newModule,
      })
      if (!result) return
    }

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

    await trpcClient.docente.modules.createMaterial.mutate({
      moduleId: selectedModule.id,
      ...newMaterial,
    })

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
        if (type === 'module') {
          await trpcClient.docente.modules.delete.mutate({ id })
        } else {
          await trpcClient.docente.modules.deleteMaterial.mutate({ id })
        }

        toast.success('Eliminado')
        confirmModal.open = false
        fetchModules()
      },
    }
  }
</script>

<div class="panel-header">
  <h2>Módulos y Materiales</h2>
  <Button
    onclick={() => {
      editingModuleId = null
      newModule = { title: '', description: '' }
      isModuleModalOpen = true
    }}
  >
    + Nuevo Módulo
  </Button>
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
      <Button variant="secondary" onclick={() => (isModuleModalOpen = false)}
        >Cancelar</Button
      >
      <Button onclick={saveModule}
        >{editingModuleId ? 'Guardar' : 'Crear'}</Button
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
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
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
