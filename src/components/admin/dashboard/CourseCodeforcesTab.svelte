<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Button from '@components/ui/Button.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import Table from '@components/tables/Table.svelte'
  import TableHead from '@components/tables/TableHead.svelte'
  import TableBody from '@components/tables/TableBody.svelte'
  import TableRow from '@components/tables/TableRow.svelte'
  import TableCell from '@components/tables/TableCell.svelte'
  import TableHeader from '@components/tables/TableHeader.svelte'

  import { trpcClient } from '@app-trpc/client'

  interface Contest {
    id: string
    name: string
    type: string
    startTimeSeconds: number | null
    durationSeconds: number | null
    countedForGlobal: boolean | number // Support both during transition
  }

  interface Props {
    courseId: string
    codeforcesGroupId: string | null
    initialContests: Contest[]
  }

  let { courseId, codeforcesGroupId, initialContests }: Props = $props()

  let contests = $state<Contest[]>(initialContests)
  let syncing = $state(false)
  let toggling = $state<Record<string, boolean>>({})

  const syncContests = async () => {
    syncing = true
    try {
      contests = await trpcClient.codeforces.syncContests.mutate({ courseId })
      toast.success('Contests sincronizados correctamente')
    } catch (error: any) {
      toast.error(`Error al sincronizar: ${error.message}`)
    } finally {
      syncing = false
    }
  }

  const toggleContest = async (contestId: string, enabled: boolean) => {
    toggling[contestId] = true
    try {
      await trpcClient.codeforces.toggleContest.mutate({
        courseId,
        contestId,
        enabled,
      })

      contests = contests.map((c) =>
        c.id === contestId ? { ...c, countedForGlobal: !!enabled } : c,
      )
      toast.success(
        enabled
          ? 'Concurso añadido al ranking'
          : 'Concurso removido del ranking',
      )
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      toggling[contestId] = false
    }
  }

  const formatDate = (seconds: number | null) => {
    if (!seconds) return '—'
    return new Date(seconds * 1000).toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }
</script>

<div class="codeforces-tab">
  <header class="codeforces-tab__header">
    <div class="codeforces-tab__info">
      <h2 class="codeforces-tab__title">Contests de Codeforces</h2>
      <p class="codeforces-tab__desc">
        Gestiona qué concursos del grupo de Codeforces se consideran para el
        ranking global del curso.
      </p>
      {#if !codeforcesGroupId}
        <p class="codeforces-tab__warning">
          ⚠️ Este curso no tiene un ID de grupo de Codeforces configurado. Ve a
          la pestaña de Configuración para añadirlo.
        </p>
      {/if}
    </div>
    {#if codeforcesGroupId}
      <Button onclick={syncContests} loading={syncing} variant="secondary">
        Sincronizar Contests
      </Button>
    {/if}
  </header>

  {#if contests.length === 0}
    <div class="codeforces-tab__empty">
      {#if syncing}
        <Loader label="Sincronizando contests..." />
      {:else}
        <p>No hay contests sincronizados aún.</p>
      {/if}
    </div>
  {:else}
    <div class="codeforces-tab__table">
      <Table ariaLabel="Lista de contests de Codeforces">
        <TableHead>
          <TableRow>
            <TableHeader>ID</TableHeader>
            <TableHeader>Nombre</TableHeader>
            <TableHeader>Tipo</TableHeader>
            <TableHeader>Fecha de Inicio</TableHeader>
            <TableHeader>En Ranking AJPC</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each contests as contest (contest.id)}
            <TableRow>
              <TableCell>{contest.id}</TableCell>
              <TableCell><strong>{contest.name}</strong></TableCell>
              <TableCell>{contest.type}</TableCell>
              <TableCell>{formatDate(contest.startTimeSeconds)}</TableCell>
              <TableCell>
                <div class="toggle-switch">
                  <input
                    type="checkbox"
                    id="contest-{contest.id}"
                    class="toggle-switch__input"
                    checked={!!contest.countedForGlobal}
                    disabled={toggling[contest.id]}
                    onchange={(e) =>
                      toggleContest(contest.id, e.currentTarget.checked)}
                  />
                  <label
                    for="contest-{contest.id}"
                    class="toggle-switch__label"
                  >
                    <span class="toggle-switch__inner"></span>
                    <span class="toggle-switch__switch"></span>
                  </label>
                </div>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>

<style>
  .codeforces-tab {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .codeforces-tab__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .codeforces-tab__title {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
  }

  .codeforces-tab__desc {
    margin: 0;
    color: var(--text-color-secondary);
  }

  .codeforces-tab__warning {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 0.5rem;
    color: #856404;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .codeforces-tab__empty {
    padding: 4rem;
    text-align: center;
    background: var(--foreground-color);
    border: 1px dashed var(--border-color);
    border-radius: 1rem;
    color: var(--text-color-secondary);
  }

  .toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
  }

  .toggle-switch__input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-switch__label {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(128, 128, 128, 0.2);
    transition: 0.4s;
    border-radius: 24px;
  }

  .toggle-switch__switch {
    position: absolute;
    content: '';
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch__input:checked + .toggle-switch__label {
    background-color: var(--brand-primary);
  }

  .toggle-switch__input:checked + .toggle-switch__label .toggle-switch__switch {
    transform: translateX(20px);
  }

  .toggle-switch__input:disabled + .toggle-switch__label {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
