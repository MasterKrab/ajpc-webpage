<script lang="ts">
  import TableRow from '@components/tables/TableRow.svelte'
  import TableCell from '@components/tables/TableCell.svelte'

  interface Props {
    cells?: ('avatar-text' | 'w100' | 'w150' | 'w180' | 'pill' | 'action')[]
  }

  let { cells = ['w150', 'w150', 'w150'] }: Props = $props()
</script>

<TableRow>
  {#each cells as type}
    <TableCell>
      {#if type === 'avatar-text'}
        <div class="skeleton-wrapper">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-text skeleton-text--w100"></div>
        </div>
      {:else if type === 'pill'}
        <div class="skeleton-pill"></div>
      {:else if type === 'action'}
        <div class="skeleton-text skeleton-text--w100"></div>
      {:else}
        <div class="skeleton-text skeleton-text--{type}"></div>
      {/if}
    </TableCell>
  {/each}
</TableRow>

<style>
  .skeleton-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .skeleton-avatar {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background: var(--border-color);
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-text {
    height: 1rem;
    border-radius: 0.25rem;
    background: var(--border-color);
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-text--w100 {
    width: 6.25rem;
  }

  .skeleton-text--w150 {
    width: 9.375rem;
  }

  .skeleton-text--w180 {
    width: 11.25rem;
  }

  .skeleton-pill {
    height: 1.5rem;
    width: 4rem;
    border-radius: 1rem;
    background: var(--border-color);
    animation: pulse 1.5s infinite ease-in-out;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.2;
    }
  }
</style>
