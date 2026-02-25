<script lang="ts">
  import { toast } from 'svelte-sonner'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import UserTable from '@components/ui/UserTable.svelte'
  import Select from '@components/ui/Select.svelte'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'

  type User = {
    id: string
    discordId: string
    discordUsername: string
    discordAvatar: string | null
    name: string | null
    email: string | null
    role: 'student' | 'docente' | 'admin' | 'sudo'
  }

  interface Props {
    initialUsers?: User[]
    initialTotal?: number
  }

  let { initialUsers = [], initialTotal = 0 }: Props = $props()

  let usersList = $state<User[]>(initialUsers)
  let usersTotal = $state(initialTotal)
  let usersLoading = $state(false)
  let roleChangeLoading = $state<string | null>(null)
  let userSearchQuery = $state('')
  let usersPage = $state(1)
  const USERS_PER_PAGE = 20

  const hasMoreUsers = $derived(usersList.length < usersTotal)

  const fetchUsers = async (page = 1, append = false) => {
    if (!append) usersLoading = true
    try {
      const searchParam = userSearchQuery
        ? `&search=${encodeURIComponent(userSearchQuery)}`
        : ''
      const response = await fetch(
        `/api/admin/users?page=${page}&limit=${USERS_PER_PAGE}${searchParam}`,
      )
      const data = await response.json()
      if (append) usersList = [...usersList, ...(data.users || [])]
      else usersList = data.users || []
      usersTotal = data.total || 0
      usersPage = page
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      usersLoading = false
    }
  }

  const changeRole = async (userId: string, role: string) => {
    roleChangeLoading = userId
    const response = await fetch(`/api/admin/users?id=${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (response.ok) toast.success('Rol actualizado correctamente')
    else toast.error('Error al actualizar el rol')
    roleChangeLoading = null
    fetchUsers(1, false)
  }

  let lastSearch = ''
  $effect(() => {
    if (userSearchQuery === lastSearch) return
    const timer = setTimeout(() => {
      lastSearch = userSearchQuery
      fetchUsers(1, false)
    }, 400)
    return () => clearTimeout(timer)
  })

  // Only do initial fetch if no SSR data was provided
  if (initialUsers.length === 0) fetchUsers(1, false)
</script>

<SubHeader title="Gestión de usuarios">
  {#snippet actions()}
    <SearchBox bind:value={userSearchQuery} placeholder="Buscar usuarios..." />
  {/snippet}
</SubHeader>

<DashboardContent padding={false}>
  <UserTable
    users={usersList}
    loading={usersLoading}
    hasMore={hasMoreUsers}
    onLoadMore={() => fetchUsers(usersPage + 1, true)}
    showEmail
    showRole
  >
    {#snippet actions(user)}
      <Select
        options={[
          { value: 'student', label: 'student' },
          { value: 'docente', label: 'docente' },
          { value: 'admin', label: 'admin' },
          { value: 'sudo', label: 'sudo' },
        ]}
        value={user.role}
        disabled={roleChangeLoading === user.id || user.role === 'sudo'}
        onChange={(val) => changeRole(user.id, val)}
        placeholder=""
      />
    {/snippet}
  </UserTable>
</DashboardContent>
