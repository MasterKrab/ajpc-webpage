<script lang="ts">
  type Tab = {
    id: string
    label: string
    icon?: string
    count?: number
  }

  let {
    tabs,
    activeTab = $bindable(),
    variant = 'primary',
  }: {
    tabs: Tab[]
    activeTab: string
    variant?: 'primary' | 'secondary'
  } = $props()
</script>

<div class="tabs-container tabs-container--{variant}" role="tablist">
  {#each tabs as tab}
    <button
      class="button-tab button-tab--{variant}"
      class:button-tab--is-active={activeTab === tab.id}
      onclick={() => (activeTab = tab.id)}
      role="tab"
      aria-selected={activeTab === tab.id}
    >
      {#if tab.icon}
        <span class="button-tab__icon">{tab.icon}</span>
      {/if}
      <span class="button-tab__label">{tab.label}</span>
      {#if tab.count !== undefined}
        <span class="button-tab__count">{tab.count}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .tabs-container {
    display: flex;
    gap: 0.5rem;
    padding: 0 0.5rem;
    overflow-x: auto;
  }

  .tabs-container--secondary {
    background: var(--background-color);
    padding: 0.4rem;
    border-radius: 0.75rem;
    gap: 0.25rem;
  }

  .button-tab {
    --tab-color: var(--text-color-secondary);
    --tab-bg: transparent;
    --tab-border: transparent;
    --tab-shadow: none;
    --tab-radius: 0;
    --tab-color-active: var(--brand-primary);
    --tab-bg-active: transparent;
    --tab-border-active: var(--brand-primary);
    --tab-shadow-active: none;

    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 1rem 1.5rem;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--tab-bg);
    color: var(--tab-color);
    border: none;
    border-bottom: 3px solid var(--tab-border);
    border-radius: var(--tab-radius);
    box-shadow: var(--tab-shadow);
    position: relative;
    white-space: nowrap;
  }

  .button-tab--secondary {
    --tab-radius: 0.5rem;
    --tab-border-active: transparent;
    --tab-bg-active: var(--foreground-color);
    --tab-shadow-active: var(--shadow-sm);
    padding: 0.6rem 1rem;
    border-bottom: none;
  }

  .button-tab--is-active {
    color: var(--tab-color-active);
    background: var(--tab-bg-active);
    border-color: var(--tab-border-active);
    box-shadow: var(--tab-shadow-active);
  }

  .button-tab:hover:not(.button-tab--is-active) {
    color: var(--text-color-primary);
    background-color: rgba(var(--brand-primary-rgb), 0.03);
  }

  .button-tab__icon {
    font-size: 1.1rem;
  }

  .button-tab__label {
    font-size: 0.95rem;
  }

  .button-tab__count {
    background: rgba(var(--brand-primary-rgb), 0.1);
    color: var(--text-color-primary);
    padding: 0.1rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    transition: all 0.2s ease;
  }

  .button-tab--is-active .button-tab__count {
    background: var(--brand-primary);
    color: white;
  }
</style>
