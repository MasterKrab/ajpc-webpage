<script lang="ts">
  import { nanoid } from 'nanoid'
  import { fuzzySearch } from '@lib/search'
  import SearchBox from '@components/ui/SearchBox.svelte'

  interface Option {
    value: any
    label: string
  }

  interface Props {
    options: Option[]
    value: any
    label?: string
    name?: string
    disabled?: boolean
    fullWidth?: boolean
    placeholder?: string
    onChange?: (newValue: any) => void
    extraClass?: string
    'aria-label'?: string
    searchable?: boolean
    searchPlaceholder?: string
    'aria-describedby'?: string
    'aria-labelledby'?: string
  }

  let {
    options,
    value = $bindable(),
    label,
    name = nanoid(5),
    disabled = false,
    fullWidth = false,
    placeholder = 'Selecciona una opción',
    onChange,
    extraClass = '',
    'aria-label': ariaLabel,
    searchable = false,
    searchPlaceholder = 'Buscar...',
    'aria-describedby': ariaDescribedby,
    'aria-labelledby': ariaLabelledby,
  }: Props = $props()

  let isOpen = $state(false)
  let searchQuery = $state('')
  let container: HTMLDivElement

  const filteredOptions = $derived(
    searchable && searchQuery
      ? fuzzySearch(searchQuery, options, (option) => [option.label])
      : options,
  )

  const selectedOption = $derived(
    options.find((option) => option.value === value) || null,
  )

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

  function handleSelect(optionValue: any) {
    value = optionValue
    isOpen = false
    if (onChange) onChange(value)
  }
</script>

<div
  class="select-container {extraClass}"
  class:full-width={fullWidth}
  bind:this={container}
>
  {#if label}
    <label class="select-label" for={name}>{label}</label>
  {/if}

  <div class="select-dropdown" class:select-dropdown--open={isOpen}>
    <button
      type="button"
      id={name}
      class="select-toggle"
      class:select-toggle--disabled={disabled}
      {disabled}
      onclick={() => (isOpen = !isOpen)}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-labelledby={ariaLabelledby}
    >
      <span class="select-toggle__text">
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <div class="select-arrow">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </button>

    {#if isOpen}
      <div class="select-menu" role="listbox">
        {#if searchable}
          <div class="select-search">
            <SearchBox
              bind:value={searchQuery}
              placeholder={searchPlaceholder}
              fullWidth
              debounceMs={0}
            />
          </div>
        {/if}

        <div class="select-options">
          {#each filteredOptions as option}
            <button
              type="button"
              class="select-option"
              class:select-option--selected={value === option.value}
              onclick={() => handleSelect(option.value)}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </button>
          {:else}
            <div class="select-empty">
              {searchQuery
                ? 'No se encontraron resultados'
                : 'Sin opciones disponibles'}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .select-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
  }

  .full-width {
    width: 100%;
  }

  .select-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    margin-left: 0.25rem;
  }

  .select-dropdown {
    position: relative;
    width: 100%;
  }

  .select-toggle {
    width: 100%;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-color-primary);
    background-color: var(--foreground-color);
    border: 1px solid var(--border-color, rgba(128, 128, 128, 0.4));
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: var(--shadow-sm);
  }

  .select-toggle:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 4px rgba(var(--brand-primary-rgb), 0.1);
  }

  .select-dropdown--open .select-toggle {
    border-color: var(--brand-primary);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .select-toggle--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .select-arrow {
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color-secondary);
    transition: transform 0.2s ease;
  }

  .select-dropdown--open .select-arrow {
    transform: rotate(180deg);
    color: var(--brand-primary);
  }

  .select-arrow svg {
    width: 1rem;
    height: 1rem;
  }

  .select-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--foreground-color);
    border: 1px solid var(--brand-primary);
    border-top: none;
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    z-index: 100;
    max-height: 250px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .select-search {
    padding: 0.5rem;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  }

  .select-search :global(.search-container) {
    max-width: none;
  }

  .select-search :global(.search-input) {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-radius: 0.5rem;
    box-shadow: none;
    font-size: 0.875rem;
  }

  .select-options {
    overflow-y: auto;
    flex: 1;
  }

  .select-option {
    width: 100%;
    text-align: left;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9375rem;
    color: var(--text-color-primary);
    transition: background-color 0.1s;
  }

  .select-option:last-child {
    border-bottom: none;
  }

  .select-option:hover {
    background-color: rgba(var(--brand-primary-rgb), 0.05);
  }

  .select-option--selected {
    background-color: rgba(var(--brand-primary-rgb), 0.1);
    color: var(--brand-primary);
    font-weight: 600;
  }

  .select-empty {
    padding: 1.5rem;
    text-align: center;
    color: var(--text-color-secondary);
    font-size: 0.875rem;
  }
</style>
