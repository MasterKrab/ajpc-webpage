<script lang="ts">
  import { onMount } from 'svelte'
  import { wrapTemplate } from '@lib/email-shared'
  import { toast } from 'svelte-sonner'
  import ConfirmModal from '@components/ui/ConfirmModal.svelte'
  import EmailPreview from './EmailPreview.svelte'
  import RichTextEditor from './RichTextEditor.svelte'
  import { storage } from '@lib/storage'

  interface Course {
    id: string
    name: string
    year: number
  }

  let courses = $state<Course[]>([])

  let recipientType = $state<'all' | 'course'>('all')
  let selectedCourseIds = $state<string[]>([])
  let subject = $state('')
  let body = $state('')

  const NAME_VARIALE = {
    name: 'Nombre',
    value: '{{name}}',
  }

  const COURSE_NAME_VARIABLE = {
    name: 'Curso',
    value: '{{courseName}}',
  }

  let activeVariables = $state<
    {
      name: string
      value: string
    }[]
  >([])

  $effect(() => {
    if (recipientType === 'all') {
      activeVariables = [NAME_VARIALE]
    } else {
      activeVariables = [NAME_VARIALE, COURSE_NAME_VARIABLE]
    }
  })

  let signature = $state('Enzo Vivallo - Coordinador')
  let sending = $state(false)
  let isConfirmModalOpen = $state(false)

  const STORAGE_KEY_SUBJECT = 'email_sender_subject'
  const STORAGE_KEY_BODY = 'email_sender_body'

  const saveToStorage = () => {
    storage.save(STORAGE_KEY_SUBJECT, subject)
    storage.save(STORAGE_KEY_BODY, body)
  }

  const loadFromStorage = () => {
    const storedSubject = storage.load<string>(STORAGE_KEY_SUBJECT)
    const storedBody = storage.load<string>(STORAGE_KEY_BODY)
    if (storedSubject) subject = storedSubject
    if (storedBody) body = storedBody
  }

  const clearStorage = () => {
    storage.remove(STORAGE_KEY_SUBJECT)
    storage.remove(STORAGE_KEY_BODY)
  }

  const fetchCourses = async () => {
    const response = await fetch('/api/admin/courses')
    courses = await response.json()
  }

  const sendEmails = async () => {
    if (!subject || !body) {
      toast.error('Por favor completa el asunto y el cuerpo del correo')
      return
    }

    if (recipientType === 'course' && selectedCourseIds.length === 0) {
      toast.error('Por favor selecciona al menos un curso')
      return
    }

    isConfirmModalOpen = true
  }

  const handleConfirmSend = async () => {
    isConfirmModalOpen = false
    sending = true
    const res = await fetch('/api/admin/send-mass-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientType,
        courseIds: selectedCourseIds,
        subject,
        body,
        signature,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      toast.success(`Correos enviados correctamente: ${data.count}`)
      subject = ''
      body = ''
      clearStorage()
    } else {
      toast.error(`Error al enviar correos: ${data.error}`)
    }
    sending = false
  }

  const getPreviewHtml = (bodyHtml: string, signatureHtml: string) => {
    return wrapTemplate(
      bodyHtml
        .replace(/{{name}}/g, 'Juan Pérez')
        .replace(/{{courseName}}/g, 'Nombre del Curso'),
      signatureHtml,
    )
  }

  onMount(() => {
    fetchCourses()
    loadFromStorage()
  })
</script>

<div class="email-sender">
  <header class="email-sender__header">
    <h2 class="email-sender__title">Enviar Correos Masivos</h2>
    <p class="email-sender__subtitle">
      Envía un mensaje a todos los estudiantes registrados o a un curso
      específico.
    </p>
  </header>

  <section class="sender-card">
    <div class="sender-card__config">
      <div class="form-group">
        <label for="recipient-type">Destinatarios</label>
        <select
          id="recipient-type"
          class="form-input"
          bind:value={recipientType}
        >
          <option value="all">Todos los estudiantes AJPC</option>
          <option value="course">Por curso específico</option>
        </select>
      </div>

      {#if recipientType === 'course'}
        <div class="form-group">
          <span class="selection-label">Seleccionar Cursos</span>
          <div class="courses-checkbox-grid">
            {#each courses as c}
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  value={c.id}
                  checked={selectedCourseIds.includes(c.id)}
                  onchange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked
                    if (checked) {
                      selectedCourseIds = [...selectedCourseIds, c.id]
                    } else {
                      selectedCourseIds = selectedCourseIds.filter(
                        (id) => id !== c.id,
                      )
                    }
                  }}
                />
                <span class="checkbox-label">{c.name} ({c.year})</span>
              </label>
            {/each}
          </div>
          {#if selectedCourseIds.length > 0}
            <p class="selection-hint">
              {selectedCourseIds.length} curso(s) seleccionado(s)
            </p>
          {/if}
        </div>
      {/if}
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="mass-subject">Asunto</label>
        <input
          id="mass-subject"
          class="form-input"
          placeholder="Ej: Recordatorio de clase"
          bind:value={subject}
          oninput={saveToStorage}
        />
      </div>
      <div class="form-group">
        <label for="mass-signature">Firma del Autor</label>
        <input
          id="mass-signature"
          class="form-input"
          placeholder="Tu nombre"
          bind:value={signature}
        />
      </div>
    </div>

    <div class="sender-card__editor-container">
      <div class="form-group form-group--editor">
        <div class="editor-header">
          <label for="mass-body">Cuerpo del Mensaje</label>
        </div>

        <RichTextEditor
          value={body}
          onchange={(val) => {
            body = val
            saveToStorage()
          }}
          placeholder="Escribe tu mensaje aquí..."
          variables={activeVariables}
        />
      </div>

      <div class="preview-area">
        <span class="preview-label">Vista Previa</span>
        <div class="preview-frame">
          <EmailPreview
            html={getPreviewHtml(
              body ||
                '<p style="color: #999;">El contenido aparecerá aquí...</p>',
              signature,
            )}
          />
        </div>
      </div>
    </div>

    <div class="sender-card__footer">
      <button
        class="button button--primary"
        disabled={sending || !subject || !body}
        onclick={sendEmails}
      >
        {sending ? 'Enviando...' : '🚀 Enviar Correos'}
      </button>
    </div>
  </section>
</div>

<ConfirmModal
  isOpen={isConfirmModalOpen}
  title="Confirmar envío"
  message={`¿Estás seguro que deseas enviar este correo a ${
    recipientType === 'all'
      ? 'todos los estudiantes AJPC'
      : 'los alumnos de los cursos seleccionados'
  }?`}
  confirmText="Sí, enviar correos"
  onConfirm={handleConfirmSend}
  onCancel={() => (isConfirmModalOpen = false)}
/>

<style>
  .email-sender {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .email-sender__title {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
  }

  .email-sender__subtitle {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
    margin: 0;
  }

  .sender-card {
    background: var(--foreground-color);
    padding: 2rem;
    border-radius: 1rem;
    border: 1px solid rgba(128, 128, 128, 0.15);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    box-shadow: var(--shadow-sm);
  }

  .sender-card__config {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media screen and (min-width: 768px) {
    .sender-card__config {
      grid-template-columns: 1fr 1fr;
    }
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media screen and (min-width: 768px) {
    .form-row {
      grid-template-columns: 2fr 1fr;
    }
  }

  .courses-checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
    max-height: 200px;
    overflow-y: auto;
    padding: 1rem;
    background: rgba(128, 128, 128, 0.05);
    border-radius: 0.5rem;
    border: 1px solid rgba(128, 128, 128, 0.1);
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .checkbox-item:hover {
    background-color: rgba(128, 128, 128, 0.1);
  }

  .checkbox-label {
    user-select: none;
  }

  .selection-hint {
    font-size: 0.75rem;
    color: var(--brand-primary);
    font-weight: 600;
    margin-top: 0.25rem;
  }

  .sender-card__editor-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    align-items: start;
  }

  @media screen and (min-width: 1024px) {
    .sender-card__editor-container {
      grid-template-columns: 1fr 1fr;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label,
  .selection-label {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .form-input {
    padding: 0.75rem;
    border: 2px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.5rem;
    font-family: inherit;
    font-size: 0.875rem;
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
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

  .sender-card__footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(128, 128, 128, 0.1);
  }

  .button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    background-color: var(--brand-primary);
    color: white;
    font-size: 1rem;
    transition:
      transform 0.1s,
      opacity 0.2s;
  }

  .button:hover:not(:disabled) {
    opacity: 0.9;
  }

  .button:active:not(:disabled) {
    transform: scale(0.98);
  }

  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
