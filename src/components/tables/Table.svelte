<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    children: Snippet
    class?: string
    id?: string
    ariaLabel?: string
  }

  let { children, class: className = '', id, ariaLabel }: Props = $props()
</script>

<div class="table-wrapper {className}" {id}>
  <table class="table" aria-label={ariaLabel}>
    {@render children()}
  </table>
</div>

<style>
  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    background: var(--foreground-color);
    box-shadow: var(--shadow-sm);
    border-radius: 0.75rem;
    border: 1px solid var(--border-color-light, rgba(128, 128, 128, 0.1));
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    text-align: left;
  }
</style>
