<script lang="ts">
  import Select from '@components/ui/Select.svelte'

  interface Props {
    currentPage: number
    totalPages: number
    totalItems?: number | null
    pageSize?: number
    pageSizes?: number[]
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
  }

  let {
    currentPage,
    totalPages,
    totalItems = null,
    pageSize = 20,
    pageSizes = [5, 10, 20, 50],
    onPageChange,
    onPageSizeChange,
  }: Props = $props()

  const pageButtons = $derived.by(() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1)

    const pages: (number | 'ellipsis')[] = [1]

    const windowStart = Math.max(2, currentPage - 1)
    const windowEnd = Math.min(totalPages - 1, currentPage + 1)

    if (windowStart > 2) pages.push('ellipsis')

    for (let p = windowStart; p <= windowEnd; p++) {
      pages.push(p)
    }

    if (windowEnd < totalPages - 1) pages.push('ellipsis')

    pages.push(totalPages)
    return pages
  })

  const startItem = $derived(
    totalItems != null && totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0,
  )
  const endItem = $derived(
    totalItems != null && totalItems > 0
      ? Math.min(totalItems, currentPage * pageSize)
      : 0,
  )

  const canGoPrev = $derived(currentPage > 1)
  const canGoNext = $derived(currentPage < totalPages)

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange(page)
  }

  const handlePageSizeChange = (val: any) => {
    const size = Number(val)
    if (Number.isFinite(size) && size > 0 && onPageSizeChange)
      onPageSizeChange(size)
  }
</script>

<nav class="pagination" aria-label="Paginación">
  <p class="pagination__summary">
    {#if totalItems != null}
      <span class="pagination__count">
        {startItem}–{endItem}
      </span>
      <span class="pagination__count-label">de {totalItems}</span>
    {:else}
      <span class="pagination__count-label"
        >Página {currentPage} de {totalPages}</span
      >
    {/if}
  </p>

  <div class="pagination__controls">
    <button
      class="pagination__navigation-button"
      onclick={() => goTo(currentPage - 1)}
      disabled={!canGoPrev}
      aria-label="Página anterior"
    >
      <svg
        width="1rem"
        height="1rem"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 12L6 8l4-4"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div class="pagination__pages" role="list">
      {#each pageButtons as button}
        {#if button === 'ellipsis'}
          <span class="pagination__ellipsis" aria-hidden="true">…</span>
        {:else}
          <span role="listitem">
            <button
              class="pagination__page-button"
              class:pagination__page-button--active={button === currentPage}
              onclick={() => goTo(button as number)}
              aria-label="Ir a página {button}"
              aria-current={button === currentPage ? 'page' : undefined}
            >
              {button}
            </button>
          </span>
        {/if}
      {/each}
    </div>

    <button
      class="pagination__navigation-button"
      onclick={() => goTo(currentPage + 1)}
      disabled={!canGoNext}
      aria-label="Página siguiente"
    >
      <svg
        width="1rem"
        height="1rem"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 4l4 4-4 4"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>

  {#if onPageSizeChange}
    <div class="pagination__size">
      <label for="pagination-page-size" class="pagination__size-label"
        >Filas</label
      >
      <div class="pagination__size-wrapper">
        <Select
          name="pagination-page-size"
          options={pageSizes.map((size) => ({
            value: size,
            label: String(size),
          }))}
          value={pageSize}
          onChange={handlePageSizeChange}
          aria-label="Filas por página"
          placeholder=""
        />
      </div>
    </div>
  {/if}
</nav>

<style>
  .pagination {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--border-color);
    background: var(--foreground-color);
    flex-wrap: wrap;
  }

  .pagination__summary {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    flex: 1;
    white-space: nowrap;
  }

  .pagination__count {
    font-weight: 600;
    color: var(--text-color-primary);
  }

  .pagination__count-label {
    color: var(--text-color-secondary);
  }

  .pagination__controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .pagination__navigation-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-color-primary);
    cursor: pointer;
    transition:
      background 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .pagination__navigation-button:hover:not(:disabled) {
    background: rgba(17, 107, 177, 0.08);
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .pagination__navigation-button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .pagination__pages {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .pagination__page-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.4rem;
    border-radius: 0.5rem;
    border: 1px solid transparent;
    background: transparent;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color-primary);
    cursor: pointer;
    transition:
      background 0.15s,
      border-color 0.15s,
      color 0.15s;
  }

  .pagination__page-button:hover:not(.pagination__page-button--active) {
    background: rgba(17, 107, 177, 0.08);
    border-color: var(--border-color);
  }

  .pagination__page-button--active {
    background: var(--brand-primary);
    color: #fff;
    border-color: var(--brand-primary);
    font-weight: 700;
    cursor: default;
  }

  .pagination__ellipsis {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    width: 1.75rem;
    height: 2rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    letter-spacing: 0.05em;
    user-select: none;
    padding-bottom: 0.1rem;
  }

  .pagination__size {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: auto;
  }

  .pagination__size-label {
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    white-space: nowrap;
  }

  .pagination__size-wrapper {
    width: 5rem;
    --select-padding: 0.35rem 0.5rem;
    --select-height: 2rem;
    --select-font-size: 0.8125rem;
    --select-border-radius: 0.5rem;
    --select-arrow-size: 0.875rem;
  }

  @media (max-width: 35rem) {
    .pagination__summary {
      width: 100%;
      flex: unset;
    }

    .pagination__size {
      margin-left: 0;
    }
  }
</style>
