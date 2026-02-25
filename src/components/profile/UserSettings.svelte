<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Button from '@components/ui/Button.svelte'

  interface Props {
    initialName: string | null
    initialEmail: string | null
    isAdminUser: boolean
    redirectTo?: string
  }

  let { initialName, initialEmail, isAdminUser, redirectTo }: Props = $props()

  let name = $state(initialName || '')
  let email = $state(initialEmail || '')
  let loading = $state(false)

  const updateProfile = async () => {
    if (!name.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    if (!email.trim()) {
      toast.error('El email no puede estar vacío')
      return
    }

    loading = true
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    })

    if (response.ok) {
      toast.success('Perfil actualizado correctamente')
      initialName = name
      initialEmail = email
      if (redirectTo) {
        window.location.href = redirectTo
      }
    } else {
      const data = await response.json()
      toast.error(data.error || 'Error al actualizar el perfil')
    }
    loading = false
  }
</script>

<section class="settings-form">
  <div class="settings-form__header">
    <h2 class="settings-form__title">Datos del Perfil</h2>
    <p class="settings-form__subtitle">
      Mantén tu información actualizada para que podamos contactarte.
    </p>
  </div>

  <div class="settings-form__body">
    <div class="form-group">
      <label for="display-name" class="settings-form__label"
        >Nombre completo</label
      >
      <input
        id="display-name"
        type="text"
        class="form-input"
        bind:value={name}
        placeholder="Ejemplo: Enzo Ferrari"
        maxlength="50"
        disabled={loading}
      />

      <label for="email" class="settings-form__label">Correo electrónico</label>
      <input
        id="email"
        type="email"
        class="form-input"
        bind:value={email}
        placeholder="ejemplo@correo.com"
        maxlength="100"
        disabled={loading}
      />

      <div class="form-actions">
        <Button
          onclick={updateProfile}
          {loading}
          loadingText="Guardando..."
          disabled={!name.trim() ||
            !email.trim() ||
            (name === initialName && email === initialEmail)}
        >
          Guardar Cambios
        </Button>
      </div>

      {#if isAdminUser && (!initialName || !initialEmail)}
        <p class="error-text">
          ⚠️ Debes configurar tu nombre y correo para operar como parte del
          equipo.
        </p>
      {/if}
    </div>
  </div>
</section>

<style>
  .settings-form {
    background-color: var(--foreground-color);
    border: 1px solid rgba(128, 128, 128, 0.12);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .settings-form__header {
    margin-bottom: 1.5rem;
  }

  .settings-form__title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }

  .settings-form__subtitle {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .settings-form__label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-primary);
  }

  .form-actions {
    margin-top: 1rem;
    display: flex;
    justify-content: flex-end;
  }

  .form-input {
    flex: 1;
    padding: 0.625rem 0.875rem;
    border: 2px solid rgba(128, 128, 128, 0.2);
    border-radius: 0.5rem;
    background: var(--foreground-color);
    color: var(--text-color-primary);
    font-family: inherit;
    font-size: 0.9375rem;
    transition: border-color 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--brand-primary);
  }

  .error-text {
    font-size: 0.75rem;
    color: #d32f2f;
    margin: 0;
    font-weight: 600;
  }

  @media screen and (max-width: 480px) {
    .form-actions {
      flex-direction: column;
    }
  }
</style>
