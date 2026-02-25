<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    children,
    padding = true,
    shadow = true,
    fullWidth = true,
  }: {
    children: Snippet
    padding?: boolean
    shadow?: boolean
    fullWidth?: boolean
  } = $props()
</script>

<div
  class="dashboard-content"
  class:dashboard-content--no-padding={!padding}
  class:dashboard-content--no-shadow={!shadow}
  class:dashboard-content--full-width={fullWidth}
>
  {@render children()}
</div>

<style>
  .dashboard-content {
    background: var(--foreground-color);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .dashboard-content--full-width {
    width: 100%;
  }

  .dashboard-content--no-padding {
    padding: 0;
  }

  .dashboard-content--no-shadow {
    box-shadow: none;
  }

  @media (max-width: 40rem) {
    .dashboard-content {
      padding: 1.25rem;
      border-radius: 1rem;
    }
    .dashboard-content--no-padding {
      padding: 0;
    }
  }
</style>
