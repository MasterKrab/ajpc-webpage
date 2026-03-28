<script lang="ts">
  interface Props {
    currentPage: number
    onPageChange: (page: number) => void
    totalPages?: number | null
    totalItems?: number | null
    pageSize?: number
    pageSizes?: number[]
    onPageSizeChange?: (pageSize: number) => void
    showPageInput?: boolean
    showPageSizeSelector?: boolean
    hasNextPage?: boolean | null
    hasPreviousPage?: boolean | null
  }

  let {
    currentPage,
    onPageChange,
    totalPages = null,
    totalItems = null,
    pageSize = 10,
    pageSizes = [5, 10, 25, 50],
    onPageSizeChange,
    showPageInput = true,
    showPageSizeSelector = true,
    hasNextPage = null,
    hasPreviousPage = null,
  }: Props = $props()

  let pageInput = $state(currentPage)
  let internalPageSize = $state(pageSize)

  const effectivePageSize = () => internalPageSize || 10

  const effectiveTotalPages = () => {
    const pageSizeValue = effectivePageSize()
    if (totalPages !== null && totalPages !== undefined) return totalPages
    const total = totalItems ?? 0
    return Math.max(1, Math.ceil(total / pageSizeValue))
  }

  const effectiveHasPrevious = () =>
    hasPreviousPage !== null && hasPreviousPage !== undefined
      ? hasPreviousPage
      : currentPage > 1

  const effectiveHasNext = () =>
    hasNextPage !== null && hasNextPage !== undefined
      ? hasNextPage
      : currentPage < effectiveTotalPages()

  const effectiveTotalItems = () => totalItems ?? 0

  const startItem = () =>
    effectiveTotalItems() > 0 ? (currentPage - 1) * effectivePageSize() + 1 : 0

  const endItem = () =>
    effectiveTotalItems() > 0
      ? Math.min(effectiveTotalItems(), currentPage * effectivePageSize())
      : 0

  $effect(() => {
    pageInput = currentPage
  })

  const normalizePage = (page: number) => {
    const floorPage = Math.max(1, Math.floor(page))
    const last = effectiveTotalPages()
    return Math.min(last, floorPage)
  }

  const goToPage = (page: number) => {
    const targetPage = normalizePage(page)

    if (targetPage === currentPage) {
      pageInput = currentPage
      return
    }

    onPageChange(targetPage)
  }

  const goToFirst = () => {
    if (!effectiveHasPrevious()) return
    goToPage(1)
  }

  const goToPrevious = () => {
    if (!effectiveHasPrevious()) return
    goToPage(currentPage - 1)
  }

  const goToNext = () => {
    if (!effectiveHasNext()) return
    goToPage(currentPage + 1)
  }

  const goToLast = () => {
    if (!effectiveHasNext()) return
    goToPage(effectiveTotalPages())
  }

  const handlePageInput = () => {
    const desired = Number(pageInput)
    if (!Number.isFinite(desired)) {
      pageInput = currentPage
      return
    }

    goToPage(desired)
  }

  const handlePageSizeChange = (event: Event) => {
    const element = event.target as HTMLSelectElement
    const size = Number(element.value)

    if (!Number.isFinite(size) || size <= 0) return

    internalPageSize = size

    if (onPageSizeChange) onPageSizeChange(size)

    onPageChange(1)
  }
</script>

<div class="table-pagination">
  <div class="table-pagination__info">
    {#if totalItems != null}
      Mostrando
      <span class="table-pagination__current">{startItem()}</span>
      -
      <span class="table-pagination__current">{endItem()}</span>
      de
      <span class="table-pagination__total">{totalItems}</span>
    {:else}
      Página
      <span class="table-pagination__current">{currentPage}</span>
      de
      <span class="table-pagination__total">{effectiveTotalPages()}</span>
    {/if}
  </div>

  <div class="table-pagination__controls">
    <button
      class="table-pagination__button"
      disabled={!effectiveHasPrevious()}
      onclick={goToFirst}
      aria-label="Ir a primera página"
    >
      « Primero
    </button>

    <button
      class="table-pagination__button"
      disabled={!effectiveHasPrevious()}
      onclick={goToPrevious}
      aria-label="Página anterior"
    >
      Anterior
    </button>

    {#if showPageInput}
      <div class="table-pagination__goto">
        <label for="page-input" class="visually-hidden">Página</label>
        <input
          id="page-input"
          class="table-pagination__input"
          type="number"
          min="1"
          max={effectiveTotalPages()}
          bind:value={pageInput}
          onkeydown={(event) => event.key === 'Enter' && handlePageInput()}
          onblur={handlePageInput}
          aria-label="Ir a página"
        />
        <button class="table-pagination__button" onclick={handlePageInput}>
          Ir
        </button>
      </div>
    {/if}

    <button
      class="table-pagination__button"
      disabled={!effectiveHasNext()}
      onclick={goToNext}
      aria-label="Siguiente página"
    >
      Siguiente
    </button>

    <button
      class="table-pagination__button"
      disabled={!effectiveHasNext()}
      onclick={goToLast}
      aria-label="Ir a última página"
    >
      Último »
    </button>

    {#if showPageSizeSelector}
      <div class="table-pagination__page-size">
        <label for="page-size" class="visually-hidden">Filas por página</label>
        <select
          id="page-size"
          class="table-pagination__select"
          value={effectivePageSize()}
          onchange={handlePageSizeChange}
          aria-label="Filas por página"
        >
          {#each pageSizes as size}
            <option value={size}>{size} / pág</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>
</div>

<style>
  .table-pagination {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--border-color-light, rgba(128, 128, 128, 0.1));
    background: var(--foreground-color);
  }

  .table-pagination__info {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-right: 0.75rem;
  }

  .table-pagination__current,
  .table-pagination__total {
    font-weight: 600;
    color: var(--text-color-primary);
  }

  .table-pagination__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .table-pagination__goto,
  .table-pagination__page-size {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .table-pagination__input,
  .table-pagination__select {
    padding: 0.35rem 0.4rem;
    min-width: 3.5rem;
    border: 1px solid var(--border-color-light, rgba(128, 128, 128, 0.2));
    background: var(--background-color);
    border-radius: 0.375rem;
    color: var(--text-color-primary);
    font-size: 0.875rem;
  }

  .table-pagination__button {
    padding: 0.45rem 0.75rem;
    border: 1px solid var(--border-color-light, rgba(128, 128, 128, 0.2));
    background: var(--background-color);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color-primary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .table-pagination__button:hover:not(:disabled) {
    background: rgba(var(--brand-primary-rgb), 0.08);
    border-color: var(--brand-primary);
  }

  .table-pagination__button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
