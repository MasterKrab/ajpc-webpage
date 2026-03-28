<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    children: Snippet
    class?: string
  }

  let { children, class: className = '' }: Props = $props()
</script>

<tbody class="table__body {className}">
  {@render children()}
</tbody>

<style>
  .table__body {
    background: var(--foreground-color);
  }
</style>
