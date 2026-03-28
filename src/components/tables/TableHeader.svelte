<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    children: Snippet
    class?: string
    sortable?: boolean
    sortDirection?: 'ascending' | 'descending' | 'none'
    onSort?: () => void
    ariaLabel?: string
    colspan?: number
    rowspan?: number
  }

  let {
    children,
    class: className = '',
    sortable = false,
    sortDirection = 'none',
    onSort,
    ariaLabel,
    colspan,
    rowspan,
  }: Props = $props()
</script>

<th
  class="table-header {className}"
  class:table-header--sortable={sortable}
  aria-sort={sortable ? sortDirection : undefined}
  aria-label={ariaLabel}
  {colspan}
  {rowspan}
>
  {#if sortable}
    <button class="table__header-button" onclick={onSort}>
      <span class="table__header-content">
        {@render children()}
      </span>
      <span class="table__header-icon" aria-hidden="true">
        {#if sortDirection === 'ascending'}
          ↑
        {:else if sortDirection === 'descending'}
          ↓
        {:else}
          ↕
        {/if}
      </span>
    </button>
  {:else}
    {@render children()}
  {/if}
</th>

<style>
  .table-header {
    padding: 1rem 1.25rem;
    font-weight: 700;
    color: var(--text-color-secondary);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--border-color-light, rgba(128, 128, 128, 0.1));
  }

  .table-header--sortable {
    cursor: pointer;
    padding: 0;
  }

  .table-header-button {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    background: none;
    border: none;
    font: inherit;
    color: inherit;
    text-align: inherit;
    text-transform: inherit;
    letter-spacing: inherit;
    cursor: pointer;
  }

  .table-header-icon {
    opacity: 0.5;
    font-size: 1rem;
  }

  .table-header--sortable:hover .table-header-button {
    background-color: rgba(var(--brand-primary-rgb), 0.05);
  }
</style>
