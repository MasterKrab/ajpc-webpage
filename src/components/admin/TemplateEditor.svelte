<script lang="ts">
  import { onMount } from 'svelte'
  import { wrapTemplate } from '@lib/email-shared'
  import { toast } from 'svelte-sonner'
  import EmailPreview from '@components/admin/EmailPreview.svelte'
  import RichTextEditor from '@components/admin/RichTextEditor.svelte'
  import { storage } from '@lib/storage'

  interface Template {
    id: string
    subject: string
    body: string
    signature: string
    updatedAt: string | null
  }

  let templates = $state<Template[]>([])
  let loading = $state(true)
  let saving = $state<string | null>(null)

  const TEMPLATE_VARIABLES = [
    { name: 'Nombre', value: '{{name}}' },
    { name: 'Curso', value: '{{courseName}}' },
    { name: 'Feedback', value: '{{feedback}}' },
  ]

  const saveToStorage = (id: string, content: string) => {
    storage.save(`editor_content_template_${id}`, content)
  }

  const loadFromStorage = (id: string) => {
    return storage.load<string>(`editor_content_template_${id}`)
  }

  const fetchTemplates = async () => {
    loading = true
    const res = await fetch('/api/admin/templates')
    templates = await res.json()

    // Restore from storage if available and newer/modified
    templates = templates.map((template) => {
      const stored = loadFromStorage(template.id)
      if (stored && stored !== template.body)
        return { ...template, body: stored }

      return template
    })

    loading = false
  }

  const saveTemplate = async (
    id: string,
    subject: string,
    body: string,
    signature: string,
  ) => {
    saving = id
    const res = await fetch(`/api/admin/templates?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, signature }),
    })

    if (res.ok) {
      toast.success('Plantilla guardada correctamente')
      storage.remove(`editor_content_template_${id}`)
    } else {
      toast.error('Error al guardar la plantilla')
    }
    saving = null
    await fetchTemplates()
  }

  const getPreviewHtml = (bodyHtml: string, signatureText: string) => {
    return wrapTemplate(
      bodyHtml
        .replace(/{{name}}/g, 'Juan Pérez')
        .replace(/{{courseName}}/g, 'Introducción a Algoritmos')
        .replace(
          /{{feedback}}/g,
          '<p><strong>Comentarios:</strong> ¡Felicitaciones! Has sido aceptado en el curso.</p>',
        ),
      signatureText,
    )
  }

  onMount(fetchTemplates)
</script>

<div class="template-editor">
  <header class="template-editor__header">
    <h2 class="template-editor__title">Editor de Plantillas de Correo</h2>
    <p class="template-editor__subtitle">
      Personaliza los correos que reciben los alumnos. Usa <code
        >{`{{name}}`}</code
      >, <code>{`{{courseName}}`}</code> y <code>{`{{feedback}}`}</code> como variables.
    </p>
  </header>

  {#if loading}
    <p class="loading">Cargando plantillas...</p>
  {:else}
    <div class="templates-grid">
      {#each templates as template}
        <section class="template-card">
          <h3 class="template-card__name">
            {template.id === 'approved'
              ? '✅ Inscripción Aprobada'
              : template.id === 'received'
                ? '📩 Inscripción Recibida'
                : '❌ Inscripción Rechazada'}
          </h3>

          <div class="form-group">
            <label for={`subject-${template.id}`}>Asunto</label>
            <input
              id={`subject-${template.id}`}
              class="form-input"
              bind:value={template.subject}
            />
          </div>

          <div class="form-group">
            <label for={`signature-${template.id}`}>Firma (Autor)</label>
            <input
              id={`signature-${template.id}`}
              class="form-input"
              bind:value={template.signature}
              placeholder="Ej: Sistema de Notificaciones AJPC"
            />
          </div>

          <div class="template-card__content">
            <div class="form-group form-group--editor">
              <div class="editor-header">
                <label for={`body-${template.id}`}>Cuerpo</label>
              </div>

              <RichTextEditor
                value={template.body}
                onchange={(value) => {
                  template.body = value
                  saveToStorage(template.id, value)
                }}
                variables={TEMPLATE_VARIABLES}
              />
            </div>

            <div class="preview-area">
              <span class="preview-label">Vista Previa (en vivo)</span>
              <div class="preview-frame">
                <EmailPreview
                  html={getPreviewHtml(template.body, template.signature)}
                />
              </div>
            </div>
          </div>

          <div class="template-card__footer">
            <span class="updated-at">
              Última edición: {template.updatedAt
                ? new Date(template.updatedAt).toLocaleString()
                : 'Nunca'}
            </span>
            <button
              class="button button--primary"
              disabled={saving === template.id}
              onclick={() =>
                saveTemplate(
                  template.id,
                  template.subject,
                  template.body,
                  template.signature,
                )}
            >
              {saving === template.id ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .template-editor {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .template-editor__title {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
  }

  .template-editor__subtitle {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
    margin: 0;
  }

  .template-editor__subtitle code {
    background: rgba(128, 128, 128, 0.1);
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
    color: var(--brand-primary);
  }

  .templates-grid {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  /* Keep it vertical to allow wide preview */
  @media screen and (min-width: 1024px) {
    .templates-grid {
      grid-template-columns: 1fr;
    }
  }

  .template-card {
    background: var(--foreground-color);
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(128, 128, 128, 0.15);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    box-shadow: var(--shadow-sm);
  }

  .template-card__content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media screen and (min-width: 1024px) {
    .template-card__content {
      grid-template-columns: 1fr 1fr;
    }
  }

  .preview-area {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .preview-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
  }

  .preview-frame {
    border: 2px solid rgba(128, 128, 128, 0.1);
    border-radius: 0.5rem;
    background: #ffffff;
    height: 500px;
    overflow: hidden;
  }

  .template-card__name {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    color: var(--brand-primary);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
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

  .template-card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
  }

  .updated-at {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }

  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-weight: 600;
    cursor: pointer;
    background-color: var(--brand-primary);
    color: white;
    font-size: 0.875rem;
  }

  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading {
    text-align: center;
    color: var(--text-color-secondary);
    padding: 2rem;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
</style>
