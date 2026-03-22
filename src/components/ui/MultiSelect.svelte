<script lang="ts">
  import { nanoid } from 'nanoid'
  import { fuzzySearch } from '@lib/search'
  import SearchBox from '@components/ui/SearchBox.svelte'

  interface Option {
    value: string
    label: string
    sublabel?: string
  }

  interface Props {
    id?: string
    options: Option[]
    value: string[]
    placeholder?: string
    error?: boolean
    disabled?: boolean
    searchable?: boolean
    searchPlaceholder?: string
    'aria-describedby'?: string
    'aria-labelledby'?: string
  }

  let {
    id = nanoid(),
    options,
    value = $bindable([]),
    placeholder = 'Seleccionar...',
    error = false,
    disabled = false,
    searchable = false,
    searchPlaceholder = 'Buscar...',
    'aria-describedby': ariaDescribedby,
    'aria-labelledby': ariaLabelledby,
  }: Props = $props()

  let isOpen = $state(false)
  let searchQuery = $state('')
  let container: HTMLDivElement

  // Filtered options based on search query
  const filteredOptions = $derived(
    searchable && searchQuery
      ? fuzzySearch(searchQuery, options, (option) => [
          option.label,
          option.sublabel || '',
        ])
      : options,
  )

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (!container) return
    if (container.contains(event.target as Node)) return
    isOpen = false
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    } else {
      document.removeEventListener('click', handleClickOutside)
      searchQuery = ''
    }
    return () => document.removeEventListener('click', handleClickOutside)
  })

  function toggleOption(option: string) {
    value = value.includes(option)
      ? value.filter((existingValue) => existingValue !== option)
      : [...value, option]
  }
</script>

<div class="multiselect" class:multiselect--open={isOpen} bind:this={container}>
  <button
    type="button"
    class="multiselect-toggle"
    class:multiselect-toggle--error={error}
    {disabled}
    onclick={() => (isOpen = !isOpen)}
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    aria-describedby={ariaDescribedby}
    aria-labelledby={ariaLabelledby}
  >
    <span class="multiselect-toggle__text">
      {#if value.length === 0}
        {placeholder}
      {:else}
        {value.length} seleccionado(s)
      {/if}
    </span>
    <span class="chevron" aria-hidden="true">▼</span>
  </button>

  {#if isOpen}
    <div class="multiselect-menu" role="listbox">
      {#if searchable}
        <div class="multiselect-search">
          <SearchBox
            bind:value={searchQuery}
            placeholder={searchPlaceholder}
            fullWidth
            debounceMs={0}
          />
        </div>
      {/if}

      <div class="multiselect-options">
        {#each filteredOptions as option}
          <label class="multiselect-option" for="ms-option-{id}-{option.value}">
            <input
              id="ms-option-{id}-{option.value}"
              type="checkbox"
              checked={value.includes(option.value)}
              onchange={() => toggleOption(option.value)}
            />
            <div class="multiselect-option__content">
              <span class="multiselect-option__label">{option.label}</span>
              {#if option.sublabel}
                <small class="multiselect-option__sublabel"
                  >{option.sublabel}</small
                >
              {/if}
            </div>
          </label>
        {:else}
          <div class="multiselect-empty">
            {searchQuery
              ? 'No se encontraron resultados'
              : 'Sin opciones disponibles'}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .multiselect {
    position: relative;
    width: 100%;
  }

  .multiselect-toggle {
    width: 100%;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 2px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.5rem;
    background-color: var(--foreground-color);
    color: var(--text-color-primary);
    font-size: 1rem;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
  }

  .multiselect-toggle:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px rgba(var(--brand-primary-rgb), 0.1);
  }

  .multiselect--open .multiselect-toggle {
    border-color: var(--brand-primary);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .multiselect-toggle--error {
    border-color: var(--color-danger);
  }

  .multiselect-toggle:disabled {
    background-color: rgba(128, 128, 128, 0.05);
    cursor: not-allowed;
    opacity: 0.7;
  }

  .multiselect-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--foreground-color);
    border: 2px solid var(--brand-primary);
    border-top: none;
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    z-index: 100;
    max-height: 300px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .multiselect-search {
    padding: 0.5rem;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  }

  /* Override SearchBox styles to make it fit better */
  .multiselect-search :global(.search-container) {
    max-width: none;
  }

  .multiselect-search :global(.search-input) {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-radius: 0.5rem;
    box-shadow: none;
    font-size: 0.875rem;
  }

  .multiselect-options {
    overflow-y: auto;
    flex: 1;
  }

  .multiselect-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    cursor: pointer;
    transition: background-color 0.1s;
    margin: 0;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  }

  .multiselect-option:last-child {
    border-bottom: none;
  }

  .multiselect-option:hover {
    background-color: rgba(128, 128, 128, 0.05);
  }

  .multiselect-option__content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .multiselect-option__label {
    font-size: 0.9375rem;
    font-weight: 500;
  }

  .multiselect-option__sublabel {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }

  .multiselect-empty {
    padding: 1.5rem;
    text-align: center;
    color: var(--text-color-secondary);
    font-size: 0.875rem;
  }

  .chevron {
    font-size: 0.75rem;
    transition: transform 0.2s;
  }

  .multiselect--open .chevron {
    transform: rotate(180deg);
  }
</style>
