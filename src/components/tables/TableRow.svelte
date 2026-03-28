<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    children: Snippet
    class?: string
    onClick?: () => void
  }

  let { children, class: className = '', onClick }: Props = $props()
</script>

<tr
  class="table-row {className}"
  onclick={onClick}
  class:table-row--clickable={!!onClick}
>
  {@render children()}
</tr>

<style>
  .table-row {
    border-bottom: 1px solid var(--border-color-light, rgba(128, 128, 128, 0.1));
    transition: background-color 0.2s;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row:hover {
    background-color: rgba(var(--brand-primary-rgb), 0.03);
  }

  .table-row--clickable {
    cursor: pointer;
  }
</style>
