<script lang="ts">
  import { onDestroy } from 'svelte'
  import { nanoid } from 'nanoid'

  let {
    value = $bindable(''),
    placeholder = 'Buscar...',
    debounceMs = 300,
    fullWidth = false,
    id = `search-${nanoid()}`,
    onSearch,
  }: {
    value?: string
    placeholder?: string
    debounceMs?: number
    fullWidth?: boolean
    id?: string
    onSearch?: (val: string) => void
  } = $props()

  let timeoutId: any

  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    value = target.value

    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      if (onSearch) onSearch(value)
    }, debounceMs)
  }

  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
</script>

<div class="search-container" class:full-width={fullWidth} role="search">
  <div class="search-wrapper">
    <label for={id} class="sr-only">{placeholder}</label>
    <div class="search-icon">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    </div>
    <input
      type="search"
      {id}
      class="search-input"
      {placeholder}
      {value}
      oninput={handleInput}
    />
    {#if value}
      <button
        class="clear-button"
        onclick={() => {
          value = ''
          if (onSearch) onSearch('')
        }}
        aria-label="Limpiar búsqueda"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  .search-container {
    display: inline-flex;
    max-width: 25rem;
    width: 100%;
  }

  .full-width {
    max-width: none;
    width: 100%;
  }

  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    pointer-events: none;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--text-color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .search-input {
    min-width: min(100%, 20rem);
    padding: 0.75rem 2.5rem 0.75rem 3rem;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-color-primary);
    background-color: var(--foreground-color, #fff);
    border: 2px solid var(--border-color-light, rgba(0, 0, 0, 0.05));
    border-radius: 1rem;
    outline: none;
    transition:
      border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
      background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm);
  }

  .search-input:hover {
    border-color: rgba(var(--brand-primary-rgb), 0.2);
    background-color: white;
  }

  .search-input:focus {
    border-color: var(--brand-primary);
    background-color: white;
    box-shadow: 0 0 0 4px rgba(var(--brand-primary-rgb), 0.1);
  }

  .clear-button {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: var(--text-color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .clear-button:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-color-primary);
  }

  .clear-button svg {
    width: 1rem;
    height: 1rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
