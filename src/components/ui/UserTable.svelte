<script module lang="ts">
  import type { UserDisplayData } from '@app-types/users'
  export type { UserDisplayData }
</script>

<script lang="ts" generics="T extends UserDisplayData">
  import InfiniteScroll from '@components/ui/InfiniteScroll.svelte'
  import RoleBadge from '@components/ui/RoleBadge.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import type { Snippet } from 'svelte'
  import Table from '@components/tables/Table.svelte'
  import TableHead from '@components/tables/TableHead.svelte'
  import TableBody from '@components/tables/TableBody.svelte'
  import TableRow from '@components/tables/TableRow.svelte'
  import TableCell from '@components/tables/TableCell.svelte'
  import TableHeader from '@components/tables/TableHeader.svelte'

  interface Props {
    users: T[]
    loading?: boolean
    hasMore?: boolean
    onLoadMore?: () => void
    showEmail?: boolean
    showRole?: boolean
    actions?: Snippet<[T]>
    emptyMessage?: string
    ariaLabel?: string
  }

  let {
    users,
    loading = false,
    hasMore = false,
    onLoadMore,
    showEmail = false,
    showRole = false,
    actions,
    emptyMessage = 'No se encontraron usuarios.',
    ariaLabel = 'Tabla de usuarios',
  }: Props = $props()
</script>

<div class="user-table-container">
  {#if loading && users.length === 0}
    <Loader size="lg" label="Cargando usuarios..." />
  {:else if users.length === 0}
    <div class="empty-state">
      <p>{emptyMessage}</p>
    </div>
  {:else}
    <Table {ariaLabel}>
      <TableHead>
        <TableRow>
          <TableHeader>Usuario</TableHeader>
          <TableHeader>Nombre</TableHeader>
          {#if showEmail}
            <TableHeader>Email</TableHeader>
          {/if}
          {#if showRole}
            <TableHeader>Rol</TableHeader>
          {/if}
          {#if actions}
            <TableHeader>Acciones</TableHeader>
          {/if}
        </TableRow>
      </TableHead>
      <TableBody>
        {#each users as user (user.id)}
          <TableRow>
            <TableCell>
              <div class="user-cell">
                {#if user.discordAvatar && user.discordId}
                  <img
                    class="user-cell__avatar"
                    src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=64`}
                    alt=""
                    width="32"
                    height="32"
                    loading="lazy"
                  />
                {:else}
                  <div class="user-cell__avatar-placeholder">
                    {user.discordUsername?.[0]?.toUpperCase() || '?'}
                  </div>
                {/if}
                <span class="user-cell__username">@{user.discordUsername}</span>
              </div>
            </TableCell>
            <TableCell>
              <span class="user-name">{user.name || '—'}</span>
            </TableCell>
            {#if showEmail}
              <TableCell>
                <span class="user-email">{user.email || '—'}</span>
              </TableCell>
            {/if}
            {#if showRole}
              <TableCell>
                <RoleBadge role={user.role || ''} />
              </TableCell>
            {/if}
            {#if actions}
              <TableCell class="user-table__td--actions">
                {@render actions(user)}
              </TableCell>
            {/if}
          </TableRow>
        {/each}
      </TableBody>
    </Table>

    {#if hasMore && onLoadMore}
      <InfiniteScroll {hasMore} {loading} {onLoadMore} />
    {/if}
  {/if}
</div>

<style>
  .user-table-container {
    position: relative;
    width: 100%;
    min-height: 12.5rem;
    text-align: left;
  }

  .user-table__td--actions {
    display: flex;
    gap: 0.5rem;
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-cell__avatar,
  .user-cell__avatar-placeholder {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--border-color);
    box-shadow: var(--shadow-sm);
  }

  .user-cell__avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--brand-primary);
    color: white;
    font-weight: 700;
    font-size: 1rem;
  }

  .user-cell__username {
    font-weight: 600;
    color: var(--text-color-primary);
  }

  .user-name {
    font-weight: 500;
  }

  .user-email {
    color: var(--text-color-secondary);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: var(--text-color-secondary);
    text-align: center;
  }
</style>
