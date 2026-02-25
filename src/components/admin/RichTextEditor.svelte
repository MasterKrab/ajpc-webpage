<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import Loader from '@components/ui/Loader.svelte'
  import type Quill from 'quill'
  import DOMPurify from 'dompurify'
  import Modal from '@components/ui/Modal.svelte'
  import { nanoid } from 'nanoid'

  interface Props {
    value: string
    onchange?: (value: string) => void
    placeholder?: string
    variables: {
      name: string
      value: string
    }[]
  }

  let {
    value = '',
    onchange,
    placeholder = 'Escribe aquí...',
    variables = [],
  }: Props = $props()

  let editorContainer: HTMLElement
  let quill: Quill | null = null
  let isUpdating = false

  let showLinkModal = $state(false)
  let linkUrl = $state('')
  let linkText = $state('')
  let linkError = $state('')
  let linkRange = $state<{ index: number; length: number } | null>(null)

  let showHtmlModal = $state(false)
  let htmlContent = $state('')
  let htmlError = $state('')

  let isLoading = $state(true)

  $effect(() => {
    if (quill && !isUpdating && value !== quill.root.innerHTML)
      if (quill.root.innerHTML !== value) quill.root.innerHTML = value
  })

  const insertVariable = (variable: string) => {
    if (!quill) return
    const selection = quill.getSelection(true)
    if (selection) {
      quill.insertText(selection.index, variable)
      quill.setSelection(selection.index + variable.length)
    }
  }

  const componentId = nanoid()
  const toolbarId = `toolbar-container-${componentId}`

  onMount(async () => {
    if (!editorContainer) return

    const { default: Quill } = await import('quill')
    await import('quill/dist/quill.snow.css')

    quill = new Quill(editorContainer, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: {
          container: `#${toolbarId}`,
          handlers: {
            link: function (this: { quill: Quill; container: HTMLElement }) {
              const selection = this.quill.getSelection()
              if (selection) {
                // Check if we are inside a link and expand selection
                let range = selection
                if (range.length === 0) {
                  const [leaf] = this.quill.getLeaf(range.index)
                  if (
                    leaf &&
                    leaf.parent &&
                    leaf.parent.domNode &&
                    leaf.parent.domNode.tagName === 'A'
                  ) {
                    const linkNode = leaf.parent.domNode
                    const linkIndex = this.quill.getIndex(leaf.parent)
                    const linkLength = linkNode.textContent?.length || 0
                    range = { index: linkIndex, length: linkLength }
                    this.quill.setSelection(range)
                  }
                }

                linkRange = range
                const formats = this.quill.getFormat(range)
                const existingLink = formats.link
                linkUrl = typeof existingLink === 'string' ? existingLink : ''
                linkText = this.quill.getText(range.index, range.length)
                linkError = ''
                showLinkModal = true
              }
            },
          },
        },
      },
    })

    if (value) quill.root.innerHTML = value

    quill.on('text-change', () => {
      if (!quill) return

      isUpdating = true

      const html =
        quill.root.innerHTML === '<p><br></p>' ? '' : quill.root.innerHTML

      if (onchange) onchange(html)

      isUpdating = false
    })

    isLoading = false
  })

  onDestroy(() => {
    quill = null
  })

  const saveLink = () => {
    if (!linkUrl) {
      linkError = 'La URL no puede estar vacía'
      return
    }

    if (!linkText) {
      linkError = 'El texto del enlace no puede estar vacío'
      return
    }

    // Basic URL validation
    try {
      new URL(linkUrl)
    } catch {
      linkError = 'Ingresa una URL válida (ej: https://google.com)'
      return
    }

    if (!quill) return

    // Restore selection or ensure we have an index
    if (linkRange) {
      quill.setSelection(linkRange.index, linkRange.length)
    }

    quill.focus()

    const index = linkRange?.index ?? quill.getSelection()?.index ?? 0
    const length = linkRange?.length ?? 0

    // Delete old text if it exists and we have a range
    if (length > 0) quill.deleteText(index, length)

    // Insert new text with link
    quill.insertText(index, linkText, 'link', linkUrl)
    quill.setSelection(index + linkText.length)

    showLinkModal = false
    linkUrl = ''
    linkText = ''
    linkRange = null
  }

  const cancelLink = () => {
    showLinkModal = false
    linkUrl = ''
    linkError = ''

    // Return focus to editor
    if (quill) quill.focus()
  }

  const insertHtml = () => {
    if (!htmlContent.trim()) {
      htmlError = 'El contenido HTML no puede estar vacío'
      return
    }

    if (!quill) return

    const cleanHtml = DOMPurify.sanitize(htmlContent, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'b',
        'i',
        'u',
        'strike',
        'ol',
        'ul',
        'li',
        'a',
        'img',
        'h1',
        'h2',
        'h3',
        'u',
        'span',
        'div',
        'style',
      ],
      ALLOWED_ATTR: [
        'href',
        'name',
        'target',
        'src',
        'srcset',
        'alt',
        'title',
        'width',
        'height',
        'loading',
        'style',
        'class',
        'id',
      ],
    })

    const selection = quill.getSelection(true)
    // Use unsafe paste to insert raw HTML at cursor
    quill.clipboard.dangerouslyPasteHTML(selection.index, cleanHtml)

    showHtmlModal = false
    htmlContent = ''
    htmlError = ''
  }

  const cancelHtml = () => {
    showHtmlModal = false
    htmlContent = ''
    htmlError = ''
    if (quill) quill.focus()
  }
</script>

<div class="rich-text-editor">
  {#if isLoading}
    <div class="editor-loader">
      <Loader label="Cargando editor..." />
    </div>
  {/if}

  <div id={toolbarId} style:visibility={isLoading ? 'hidden' : 'visible'}>
    <span class="ql-formats">
      <select class="ql-header" aria-label="Encabezado">
        <option value="1" aria-label="Encabezado 1"></option>
        <option value="2" aria-label="Encabezado 2"></option>
        <option value="3" aria-label="Encabezado 3"></option>
        <option selected aria-label="Normal"></option>
      </select>
    </span>
    <span class="ql-formats">
      <button class="ql-bold" aria-label="Negrita"></button>
      <button class="ql-italic" aria-label="Cursiva"></button>
      <button class="ql-underline" aria-label="Subrayado"></button>
      <button class="ql-strike" aria-label="Tachado"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-list" value="ordered" aria-label="Lista ordenada"
      ></button>
      <button class="ql-list" value="bullet" aria-label="Lista desordenada"
      ></button>
    </span>
    <span class="ql-formats">
      <button class="ql-link" aria-label="Insertar enlace"></button>
      <button class="ql-image" aria-label="Insertar imagen"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-clean" aria-label="Limpiar formato"></button>
    </span>
    <span class="ql-formats">
      <button
        class="ql-html"
        onclick={() => (showHtmlModal = true)}
        aria-label="Insertar HTML"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="width: 14px; height: 14px;"
          aria-hidden="true"
        >
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      </button>
    </span>
  </div>

  <div
    class="variable-toolbar"
    style:visibility={isLoading ? 'hidden' : 'visible'}
  >
    <span class="label">Variables:</span>
    <select
      onchange={(event) => {
        const select = event.target as HTMLSelectElement

        if (select.value) {
          insertVariable(select.value)
          select.value = ''
        }
      }}
      class="variable-select"
      aria-label="Insertar variable"
    >
      <option value="" disabled selected>Insertar variable...</option>

      {#each variables as { name, value }}
        <option {value}>{name}</option>
      {/each}
    </select>
  </div>

  <div
    bind:this={editorContainer}
    style:visibility={isLoading ? 'hidden' : 'visible'}
  ></div>

  {#if showLinkModal}
    <Modal isOpen={showLinkModal} title="Insertar Enlace" onClose={cancelLink}>
      <div class="modal-content-inner">
        <div class="form-group">
          <label for={`link-text-${componentId}`}>Texto del enlace</label>
          <input
            id={`link-text-${componentId}`}
            type="text"
            bind:value={linkText}
            placeholder="Texto a mostrar"
          />
        </div>
        <div class="form-group">
          <label for={`link-url-${componentId}`}>URL del enlace</label>
          <input
            id={`link-url-${componentId}`}
            type="text"
            bind:value={linkUrl}
            placeholder="https://ejemplo.com"
            onkeydown={(event) => event.key === 'Enter' && saveLink()}
          />
          {#if linkError}
            <span class="error">{linkError}</span>
          {/if}
        </div>
        <div class="modal-actions">
          <button class="button button--secondary" onclick={cancelLink}
            >Cancelar</button
          >
          <button class="button button--primary" onclick={saveLink}
            >Guardar</button
          >
        </div>
      </div>
    </Modal>
  {/if}

  {#if showHtmlModal}
    <Modal
      isOpen={showHtmlModal}
      title="Insertar HTML Personalizado"
      onClose={cancelHtml}
    >
      <div class="modal-content-inner">
        <p class="modal-desc">Pega aquí tu código HTML.</p>
        <div class="form-group">
          <textarea
            class="html-input"
            bind:value={htmlContent}
            placeholder="<div><h1>Hola Mundo</h1>...</div>"
            rows="10"
          ></textarea>
          {#if htmlError}
            <span class="error">{htmlError}</span>
          {/if}
        </div>
        <div class="modal-actions">
          <button class="button button--secondary" onclick={cancelHtml}
            >Cancelar</button
          >
          <button class="button button--primary" onclick={insertHtml}
            >Insertar HTML</button
          >
        </div>
      </div>
    </Modal>
  {/if}
</div>

<style>
  .rich-text-editor {
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: var(--foreground-color);
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid rgba(128, 128, 128, 0.2);
  }

  :global(.ql-toolbar) {
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: 1px solid rgba(128, 128, 128, 0.15) !important;
    background-color: rgba(128, 128, 128, 0.05);
    font-family: inherit !important;
  }

  :global(.ql-container) {
    border: none !important;
    font-family: inherit !important;
    font-size: 1rem !important;
    min-height: 200px;
  }

  :global(.ql-editor) {
    min-height: 200px;
    max-height: 500px;
    overflow-y: auto;
  }

  :global(:root.dark .ql-toolbar .ql-stroke) {
    stroke: var(--text-color-primary) !important;
  }
  :global(:root.dark .ql-toolbar .ql-fill) {
    fill: var(--text-color-primary) !important;
  }
  :global(:root.dark .ql-toolbar .ql-picker) {
    color: var(--text-color-primary) !important;
  }

  .variable-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(128, 128, 128, 0.05);
    border-bottom: 1px solid rgba(128, 128, 128, 0.15);
    font-size: 0.875rem;
  }

  .variable-toolbar .label {
    font-weight: 600;
    color: var(--text-color-secondary);
  }

  .variable-select {
    background: transparent;
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-primary);
    cursor: pointer;
    outline: none;
  }

  .variable-select:hover {
    border-color: var(--brand-primary);
  }

  .html-input {
    width: 100%;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.375rem;
    font-family: 'Fira Code', monospace;
    font-size: 0.875rem;
    color: var(--text-color-primary);
    resize: vertical;
  }

  :global(:root.dark) .html-input {
    background: rgba(255, 255, 255, 0.05);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .form-group input {
    padding: 0.5rem;
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.25rem;
    background: var(--foreground-color);
    color: var(--text-color-primary);
  }

  .error {
    color: #ef4444;
    font-size: 0.75rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    cursor: pointer;
    border: none;
    font-weight: 500;
    transition:
      background-color 0.2s,
      opacity 0.2s;
  }

  .button--secondary {
    background: transparent;
    color: var(--text-color-secondary);
    border: 1px solid var(--border-color);
  }

  .button--secondary:hover {
    background: rgba(128, 128, 128, 0.1);
  }

  .button--primary {
    background: var(--brand-primary);
    color: white;
  }

  .button--primary:hover {
    opacity: 0.9;
  }

  .editor-loader {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3rem;
    min-height: 25rem;
    background: rgba(128, 128, 128, 0.05);
  }
</style>
