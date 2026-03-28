<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    children: Snippet
    class?: string
  }

  let { children, class: className = '' }: Props = $props()
</script>

<thead class="table-header {className}">
  {@render children()}
</thead>

<style>
  .table-header {
    background: rgba(var(--brand-primary-rgb), 0.02);
  }
</style>
