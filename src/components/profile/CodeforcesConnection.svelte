<script lang="ts">
  import Button from '@components/ui/Button.svelte'
  import ConfirmModal from '@components/ui/ConfirmModal.svelte'
  import { trpcClient } from '@app-trpc/client'
  import { toast } from 'svelte-sonner'
  import codeforcesLogoSVG from '@assets/codeforces.svg'

  interface Props {
    initialHandle?: string | null
    initialRating?: number | null
    lastSync?: number | null
  }

  let {
    initialHandle = null,
    initialRating = null,
    lastSync = null,
  }: Props = $props()

  let connectedHandle = $state(initialHandle)
  let rating = $state(initialRating)
  let lastSyncDate = $state(lastSync)
  let isUnlinkModalOpen = $state(false)
  let isUnlinking = $state(false)

  const handleUnlink = async () => {
    isUnlinking = true
    try {
      await trpcClient.codeforces.unlinkAccount.mutate()
      connectedHandle = null
      rating = null
      lastSyncDate = null
      toast.success('Cuenta de Codeforces desvinculada correctamente')
    } catch (error: any) {
      toast.error('Error al desvincular la cuenta: ' + error.message)
    } finally {
      isUnlinking = false
      isUnlinkModalOpen = false
    }
  }

  const intl = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
    timeStyle: 'long',
  })

  const formatDate = (seconds: number) => intl.format(new Date(seconds * 1000))

  const getIsoDate = (seconds: number) => new Date(seconds * 1000).toISOString()
</script>

<section class="settings__card">
  <h2 class="settings__card-title">
    <img class="settings__card-logo" src={codeforcesLogoSVG.src} alt="" /> Conexión
    Codeforces
  </h2>

  <div class="codeforces-connect">
    <p class="settings__text">
      Conecta tu cuenta de Codeforces para participar en concursos y el ranking
      AJPC. Usamos el sistema oficial de Codeforces para validar tu identidad.
    </p>

    <div class="codeforces-connect__actions">
      <Button
        variant="secondary"
        extraClass="codeforces-connect__action"
        href="/api/codeforces/login"
      >
        {connectedHandle
          ? 'Actualizar conexión Codeforces'
          : 'Conectar cuenta de Codeforces'}
      </Button>

      {#if connectedHandle}
        <Button
          variant="danger"
          extraClass="codeforces-connect__action"
          onclick={() => (isUnlinkModalOpen = true)}
          disabled={isUnlinking}
        >
          Desvincular cuenta
        </Button>
      {/if}
    </div>
  </div>

  {#if connectedHandle}
    <div class="codeforces-connect__status">
      <p class="settings__field">
        <span class="settings__label">Estado</span>
        <span class="settings__value">
          Conectado como <a
            class="settings__link"
            href="https://codeforces.com/profile/{connectedHandle}"
            target="_blank"
            rel="noopener noreferrer">{connectedHandle}</a
          >
          {#if rating !== null}
            <span class="codeforces-connect__rating">({rating} rating)</span>
          {/if}
        </span>
      </p>

      {#if lastSyncDate}
        <p class="settings__field">
          <span class="settings__label">Última actualización</span>
          <span class="settings__value">
            <time datetime={getIsoDate(lastSyncDate)}>
              {formatDate(lastSyncDate)}
            </time>
          </span>
        </p>
      {/if}
    </div>
  {:else}
    <p class="settings__hint">No has conectado ninguna cuenta de Codeforces.</p>
  {/if}
</section>

<ConfirmModal
  isOpen={isUnlinkModalOpen}
  title="Desvincular cuenta de Codeforces"
  message="¿Estás seguro de que deseas desvincular tu cuenta de Codeforces? No aparecerás en los rankings de los cursos hasta que la vuelvas a vincular."
  confirmText="Desvincular"
  cancelText="Cancelar"
  variant="danger"
  loading={isUnlinking}
  onConfirm={handleUnlink}
  onCancel={() => (isUnlinkModalOpen = false)}
/>

<style>
  .codeforces-connect {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .codeforces-connect__actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  @media screen and (min-width: 37.5rem) {
    .codeforces-connect__actions {
      flex-direction: row;
    }
  }

  :global(.codeforces-connect__action) {
    width: 100%;
  }

  .codeforces-connect__status {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .codeforces-connect__rating {
    color: var(--brand-secondary);
    font-weight: 700;
  }

  /* Reuse styles from account.astro if possible, or define them locally */
  .settings__card {
    background-color: var(--foreground-color);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .codeforces-connect__rating {
    color: var(--brand-secondary);
    font-weight: 700;
  }

  /* Reuse styles from account.astro if possible, or define them locally */
  .settings__card {
    background-color: var(--foreground-color);
    border: 1px solid rgba(128, 128, 128, 0.12);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .settings__card-title {
    display: flex;
    gap: 0.5rem;
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 1rem;
    line-height: 2.5;
  }

  .settings__card-logo {
    width: 2rem;
  }

  .settings__label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-color-secondary);
  }

  .settings__field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    margin: 0;
  }

  .settings__value {
    font-size: 0.9375rem;
    color: var(--text-color-primary);
  }

  .settings__hint {
    margin: 1rem 0 0;
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    font-style: italic;
  }

  .settings__text {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin: 0 0 1rem;
  }

  .settings__link {
    font-weight: bold;
    color: var(--brand-primary);
  }
</style>
