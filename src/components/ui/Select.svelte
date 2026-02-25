<script lang="ts">
  let {
    options,
    value = $bindable(),
    label,
    name,
    disabled = false,
    fullWidth = false,
    placeholder = 'Selecciona una opción',
    onChange,
    extraClass = '',
  }: {
    options: { value: any; label: string }[]
    value: any
    label?: string
    name?: string
    disabled?: boolean
    fullWidth?: boolean
    placeholder?: string
    onChange?: (val: any) => void
    extraClass?: string
  } = $props()

  const hasPlaceholderInOptions = $derived(
    options.some((o) => o.value === '' || o.value === undefined),
  )

  const handleSelect = (event: Event) => {
    const target = event.target as HTMLSelectElement
    value = target.value
    if (onChange) onChange(value)
  }
</script>

<div class="select-container" class:full-width={fullWidth}>
  {#if label}
    <label class="select-label" for={name}>{label}</label>
  {/if}
  <div class="select-wrapper">
    <select
      class="select-input {extraClass}"
      {name}
      id={name || undefined}
      {value}
      {disabled}
      onchange={handleSelect}
    >
      {#if placeholder && placeholder.length > 0 && !hasPlaceholderInOptions}
        <option value="" disabled selected={!value}>{placeholder}</option>
      {/if}
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
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
  </div>
</div>

<style>
  .select-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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

  .select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .select-input {
    appearance: none;
    width: 100%;
    min-width: 8rem;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-color-primary);
    background-color: var(--select-bg, var(--foreground-color, #fff));
    border: 1px solid var(--select-border, var(--text-color-primary));
    border-radius: 0.25rem;
    cursor: pointer;
    transition:
      border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
      background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    outline: none;
    box-shadow: var(--shadow-sm);
  }

  .select-input:hover:not(:disabled) {
    border-color: var(--brand-primary);
  }

  .select-input:focus {
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 4px rgba(var(--brand-primary-rgb), 0.1);
  }

  .select-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .select-arrow {
    position: absolute;
    right: 1rem;
    pointer-events: none;
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color-secondary);
    transition: transform 0.2s ease;
  }

  .select-input:focus + .select-arrow {
    transform: rotate(180deg);
    color: var(--brand-primary);
  }

  .select-arrow svg {
    width: 1rem;
    height: 1rem;
  }
</style>
