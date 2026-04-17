<script lang="ts">
  import { toast } from 'svelte-sonner'
  import SearchBox from '@components/ui/SearchBox.svelte'
  import UserTable from '@components/ui/UserTable.svelte'
  import Select from '@components/ui/Select.svelte'
  import SubHeader from '@components/ui/SubHeader.svelte'
  import DashboardContent from '@components/ui/DashboardContent.svelte'
  import Button from '@components/ui/Button.svelte'
  import ConfirmModal from '@components/ui/ConfirmModal.svelte'
  import { trpcClient } from '@app-trpc/client'
  import { downloadCSV, generateCSV } from '@utils/csv'

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
  let usersPerPage = $state(10)

  const totalPages = $derived(Math.max(1, Math.ceil(usersTotal / usersPerPage)))

  const fetchUsers = async (page = 1) => {
    usersLoading = true
    try {
      const result = await trpcClient.admin.users.list.query({
        page,
        limit: usersPerPage,
        search: userSearchQuery || undefined,
      })
      usersList = result.users as unknown as User[]
      usersTotal = result.total
      usersPage = page
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      usersLoading = false
    }
  }

  const changeRole = async (userId: string, role: string) => {
    roleChangeLoading = userId
    try {
      await trpcClient.admin.users.updateRole.mutate({
        id: userId,
        role: role as 'student' | 'docente' | 'admin' | 'sudo',
      })
      toast.success('Rol actualizado correctamente')
    } catch (error: unknown) {
      const trpcError = error as { message?: string }
      toast.error(trpcError?.message || 'Error al actualizar el rol')
    } finally {
      roleChangeLoading = null
      fetchUsers(usersPage)
    }
  }

  let lastSearch = ''
  $effect(() => {
    if (userSearchQuery === lastSearch) return
    const timer = setTimeout(() => {
      lastSearch = userSearchQuery
      usersPage = 1
      fetchUsers(1)
    }, 400)
    return () => clearTimeout(timer)
  })

  const handlePageChange = (page: number) => {
    fetchUsers(page)
  }

  const handlePageSizeChange = (size: number) => {
    usersPerPage = size
    fetchUsers(1)
  }

  // Only do initial fetch if no SSR data was provided
  if (initialUsers.length === 0) fetchUsers(1)

  let exportingCsv = $state(false)
  let isExportModalOpen = $state(false)
  
  const exportCsv = async () => {
    isExportModalOpen = false
    exportingCsv = true
    const toastId = toast.loading('Exportando CSV...')
    try {
      const result = await trpcClient.admin.users.exportAll.query({
        search: userSearchQuery || undefined,
      })

      const headers = [
        { key: 'id', label: 'ID' },
        { key: 'discordUsername', label: 'Discord Username' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
      ]

      const csvStr = generateCSV(result.users, headers)
      await downloadCSV('usuarios.csv', csvStr)
      toast.success('CSV descargado correctamente', { id: toastId })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.dismiss(toastId)
      } else {
        toast.error('Error al exportar CSV', { id: toastId })
      }
    } finally {
      exportingCsv = false
    }
  }
</script>

<ConfirmModal
  isOpen={isExportModalOpen}
  title="Descargar CSV"
  message="¿Estás seguro de que deseas descargar el listado de usuarios? Esta acción exportará todos los registros que coincidan con tu búsqueda actual."
  confirmText="Descargar"
  onConfirm={exportCsv}
  onCancel={() => (isExportModalOpen = false)}
/>

<SubHeader title="Gestión de usuarios">
  {#snippet actions()}
    <Button
      variant="secondary"
      size="sm"
      onclick={() => (isExportModalOpen = true)}
      loading={exportingCsv}
    >
      Descargar CSV
    </Button>
    <SearchBox bind:value={userSearchQuery} placeholder="Buscar usuarios..." />
  {/snippet}
</SubHeader>

<DashboardContent padding={false}>
  <UserTable
    users={usersList}
    loading={usersLoading}
    showEmail
    showRole
    currentPage={usersPage}
    totalItems={usersTotal}
    {totalPages}
    pageSize={usersPerPage}
    onPageChange={handlePageChange}
    onPageSizeChange={handlePageSizeChange}
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
