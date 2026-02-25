<script module lang="ts">
  import type { UserDisplayData } from '@app-types/users'
  export type { UserDisplayData }
</script>

<script lang="ts" generics="T extends UserDisplayData">
  import InfiniteScroll from '@components/ui/InfiniteScroll.svelte'
  import RoleBadge from '@components/ui/RoleBadge.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import type { Snippet } from 'svelte'

  interface Props {
    users: T[]
    loading?: boolean
    hasMore?: boolean
    onLoadMore?: () => void
    showEmail?: boolean
    showRole?: boolean
    actions?: Snippet<[T]>
    emptyMessage?: string
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
    <div class="table-wrapper">
      <table class="user-table">
        <thead>
          <tr class="user-table__tr">
            <th class="user-table__th">Usuario</th>
            <th class="user-table__th">Nombre</th>
            {#if showEmail}
              <th class="user-table__th">Email</th>
            {/if}
            {#if showRole}
              <th class="user-table__th">Rol</th>
            {/if}
            {#if actions}
              <th class="user-table__th">Acciones</th>
            {/if}
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr class="user-table__tr">
              <td class="user-table__td">
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
                  <span class="user-cell__username"
                    >@{user.discordUsername}</span
                  >
                </div>
              </td>
              <td class="user-table__td">
                <span class="user-name">{user.name || '—'}</span>
              </td>
              {#if showEmail}
                <td class="user-table__td">
                  <span class="user-email">{user.email || '—'}</span>
                </td>
              {/if}
              {#if showRole}
                <td class="user-table__td">
                  <RoleBadge role={user.role || ''} />
                </td>
              {/if}
              {#if actions}
                <td class="user-table__td user-table__td--actions">
                  {@render actions(user)}
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

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

  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    background: var(--foreground-color);
    box-shadow: var(--shadow-sm);
  }

  .user-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .user-table__td,
  .user-table__th {
    min-width: 12.5rem;
  }

  .user-table__th {
    padding: 1rem 1.25rem;
    font-weight: 700;
    color: var(--text-color-secondary);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 0.125rem solid
      var(--border-color-light, rgba(128, 128, 128, 0.1));
    background: rgba(var(--brand-primary-rgb), 0.02);
  }

  .user-table__td {
    padding: 1rem 1.25rem;
    border-bottom: 0.063 solid
      var(--border-color-light, rgba(128, 128, 128, 0.1));
    color: var(--text-color-primary);
    vertical-align: middle;
  }

  .user-table__td--actions {
    display: flex;
    gap: 0.5rem;
  }

  .user-table__tr:last-child .user-table__td {
    border-bottom: none;
  }

  .user-table__tr:hover {
    background-color: rgba(var(--brand-primary-rgb), 0.03);
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

  @media (max-width: 640px) {
    .user-table th,
    .user-table td {
      padding: 0.75rem 1rem;
    }
  }
</style>
