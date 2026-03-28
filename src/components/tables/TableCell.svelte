<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    children?: Snippet
    class?: string
    colspan?: number
    rowspan?: number
  }

  let { children, class: className = '', colspan, rowspan }: Props = $props()
</script>

<td class="table-cell {className}" {colspan} {rowspan}>
  {#if children}
    {@render children()}
  {/if}
</td>

<style>
  .table-cell {
    padding: 1rem 1.25rem;
    vertical-align: middle;
    color: var(--text-color-primary);
  }
</style>
