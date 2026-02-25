<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    title,
    actions,
    description,
    actionsSameRow = true,
  }: {
    title: string
    actions?: Snippet
    description?: string
    actionsSameRow?: boolean
  } = $props()
</script>

<header class="sub-header">
  <div class="sub-header__content">
    <div class="sub-header__titles">
      <h2 class="sub-header__title">{title}</h2>
      {#if description}
        <p class="sub-header__description">{description}</p>
      {/if}
    </div>
    {#if actions}
      <div
        class="sub-header__actions"
        class:sub-header__actions--same-row={actionsSameRow}
      >
        {@render actions()}
      </div>
    {/if}
  </div>
</header>

<style>
  .sub-header {
    margin-bottom: 0.5rem;
  }

  .sub-header__content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .sub-header__title {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-color-primary);
    letter-spacing: -0.01em;
  }

  .sub-header__description {
    margin: 0.25rem 0 0;
    color: var(--text-color-secondary);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .sub-header__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  .sub-header__actions--same-row {
    flex: 1;
  }

  @media (max-width: 40rem) {
    .sub-header__actions {
      justify-content: flex-start;
      width: 100%;
    }
  }
</style>
