<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    title,
    subtitle,
    onBack,
    extra,
    children,
  }: {
    title: string
    subtitle?: string | Snippet
    onBack?: () => void
    extra?: Snippet
    children?: Snippet
  } = $props()
</script>

<header class="panel-header">
  <div class="panel-header__top">
    <div class="panel-header__content">
      <div class="panel-header__title-group">
        <h1 class="panel-header__title">{title}</h1>
        {#if extra}
          <div class="panel-header__extra">
            {@render extra()}
          </div>
        {/if}
      </div>
      {#if subtitle}
        <div class="panel-header__subtitle">
          {#if typeof subtitle === 'string'}
            {subtitle}
          {:else}
            {@render subtitle()}
          {/if}
        </div>
      {/if}
    </div>

    {#if onBack}
      <button class="panel-header__back" onclick={onBack}> ← Volver </button>
    {/if}
  </div>

  {#if children}
    <div class="panel-header__bottom">
      {@render children()}
    </div>
  {/if}
</header>

<style>
  .panel-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 0;
    border-bottom: 1px solid rgba(var(--brand-primary-rgb), 0.1);
    margin-bottom: 0.25rem;
  }

  .panel-header__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .panel-header__title-group {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .panel-header__title {
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-color-primary);
    letter-spacing: -0.02em;
  }

  .panel-header__subtitle {
    margin: 0.25rem 0 0;
    color: var(--text-color-secondary);
    font-size: 1rem;
    font-weight: 500;
  }

  .panel-header__back {
    font-size: 0.9rem;
    font-weight: 600;
    padding: 0.5rem 1rem;
    margin: 0.5rem 1rem;
    border: 0.125rem solid var(--brand-primary);
    border-radius: 0.25rem;
    color: var(--brand-primary);
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
  }

  .panel-header__back:hover {
    background-color: var(--brand-primary);
    color: var(--text-color-tertiary);
  }

  .panel-header__bottom {
    margin-top: -0.5rem;
  }

  @media (max-width: 640px) {
    .panel-header__top {
      flex-direction: column-reverse;
      align-items: flex-start;
    }

    .panel-header__back {
      align-self: flex-end;
    }
  }
</style>
