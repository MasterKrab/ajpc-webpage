<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Select from '@components/ui/Select.svelte'
  import Button from '@components/ui/Button.svelte'
  import Loader from '@components/ui/Loader.svelte'
  import Table from '@components/tables/Table.svelte'
  import TableHead from '@components/tables/TableHead.svelte'
  import TableBody from '@components/tables/TableBody.svelte'
  import TableRow from '@components/tables/TableRow.svelte'
  import TableCell from '@components/tables/TableCell.svelte'
  import TableHeader from '@components/tables/TableHeader.svelte'

  import { trpcClient } from '@app-trpc/client'

  interface Course {
    id: string
    name: string
  }

  interface RankEntry {
    userId: string
    name: string | null
    handle: string | null
    totalPoints: number
    totalPenaltySeconds: number
    totalWrongAttempts: number
  }

  interface Props {
    courses: Course[]
    initialCourseId: string
    isAdmin: boolean
  }

  let { courses, initialCourseId, isAdmin }: Props = $props()

  let selectedCourseId = $state(initialCourseId)
  let ranking = $state<RankEntry[]>([])
  let loading = $state(false)
  let syncing = $state(false)

  const fetchRanking = async () => {
    if (!selectedCourseId) return
    loading = true
    try {
      ranking = await trpcClient.codeforces.getRanking.query({
        courseId: selectedCourseId,
      })
    } catch (error: any) {
      toast.error(error.message || 'Error al obtener el ranking')
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if (selectedCourseId) {
      fetchRanking()
    }
  })

  const syncRanking = async () => {
    if (!selectedCourseId) return
    syncing = true
    try {
      await trpcClient.codeforces.syncRankingManual.mutate({
        courseId: selectedCourseId,
      })
      toast.success('Ranking actualizado correctamente')
      fetchRanking()
    } catch (error: any) {
      toast.error(`Error al sincronizar: ${error.message}`)
    } finally {
      syncing = false
    }
  }

  const formatPenalty = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
</script>

<div class="ranking-manager">
  <div class="ranking-manager__controls">
    <div class="ranking-manager__filter">
      <label for="course-select" class="ranking-manager__label"
        >Seleccionar Curso</label
      >
      <Select
        name="course-select"
        options={courses.map((c) => ({ value: c.id, label: c.name }))}
        bind:value={selectedCourseId}
        placeholder="Selecciona un curso"
      />
    </div>

    {#if isAdmin}
      <div class="ranking-manager__actions">
        <Button onclick={syncRanking} loading={syncing} variant="secondary">
          Actualizar Puntajes (Sincronizar Codeforces)
        </Button>
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="ranking-manager__loader">
      <Loader label="Cargando ranking..." />
    </div>
  {:else if ranking.length === 0}
    <div class="ranking-manager__empty">
      <p>No hay datos de ranking para este curso.</p>
    </div>
  {:else}
    <div class="ranking-manager__table">
      <Table ariaLabel="Ranking del curso">
        <TableHead>
          <TableRow>
            <TableHeader>#</TableHeader>
            <TableHeader>Estudiante</TableHeader>
            <TableHeader>Handle Codeforces</TableHeader>
            <TableHeader>Puntos</TableHeader>
            <TableHeader>Tiempo (Penalty)</TableHeader>
            <TableHeader>Fallos</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each ranking as entry, index}
            <TableRow>
              <TableCell><strong>{index + 1}</strong></TableCell>
              <TableCell>{entry.name || 'Sin nombre'}</TableCell>
              <TableCell>
                {#if entry.handle}
                  <a
                    href="https://codeforces.com/profile/{entry.handle}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ranking-manager__handle"
                  >
                    {entry.handle}
                  </a>
                {:else}
                  <span class="ranking-manager__no-handle">—</span>
                {/if}
              </TableCell>
              <TableCell>
                <span class="ranking-manager__points">
                  {entry.totalPoints} pts
                </span>
              </TableCell>
              <TableCell>
                <span class="ranking-manager__meta">
                  {formatPenalty(entry.totalPenaltySeconds)}
                </span>
              </TableCell>
              <TableCell>
                <span
                  class="ranking-manager__meta ranking-manager__meta--danger"
                >
                  {entry.totalWrongAttempts}
                </span>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>

<style>
  .ranking-manager {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: var(--foreground-color);
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid var(--border-color);
  }

  .ranking-manager__controls {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .ranking-manager__filter {
    flex: 1;
    min-width: 200px;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ranking-manager__label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-secondary);
  }

  .ranking-manager__loader,
  .ranking-manager__empty {
    padding: 4rem;
    text-align: center;
    color: var(--text-color-secondary);
  }

  .ranking-manager__handle {
    color: var(--brand-primary);
    text-decoration: none;
    font-weight: 600;
  }

  .ranking-manager__handle:hover {
    text-decoration: underline;
  }

  .ranking-manager__points {
    font-weight: 800;
    color: var(--brand-secondary);
    font-size: 1.1rem;
  }

  .ranking-manager__meta {
    font-weight: 600;
    color: var(--text-color-secondary);
    font-size: 0.9rem;
  }

  .ranking-manager__meta--danger {
    color: var(--color-danger);
  }

  .ranking-manager__no-handle {
    color: var(--color-danger);
    font-size: 0.8rem;
    font-style: italic;
  }
</style>
