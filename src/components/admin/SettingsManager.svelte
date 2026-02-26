<script lang="ts">
  import { onMount } from 'svelte'
  import { toast } from 'svelte-sonner'
  import Loader from '@components/ui/Loader.svelte'
  import Button from '@components/ui/Button.svelte'

  interface Props {
    initialSettings?: Record<string, string>
    userRole?: 'student' | 'docente' | 'admin' | 'sudo'
  }

  let { initialSettings = {}, userRole = 'admin' }: Props = $props()

  let settings = $state<Record<string, string>>(initialSettings)
  let loading = $state(Object.keys(initialSettings).length === 0)
  let updating = $state(false)

  const fetchSettings = async () => {
    try {
      loading = true
      const response = await fetch('/api/admin/settings')
      if (response.ok) settings = await response.json()
      else toast.error('Error al cargar la configuración')
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión')
    } finally {
      loading = false
    }
  }

  const updateSetting = async (key: string, value: string) => {
    const promise = (async () => {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (!response.ok) throw new Error('Failed to update')

      settings[key] = value
      return response
    })()

    toast.promise(promise, {
      loading: 'Actualizando configuración...',
      success: 'Configuración actualizada correctamente',
      error: 'Error al guardar la configuración',
    })

    try {
      updating = true
      await promise
    } catch (error) {
      console.error(error)
    } finally {
      updating = false
    }
  }

  onMount(() => {
    if (Object.keys(initialSettings).length === 0) fetchSettings()
  })
</script>

<div class="settings-manager">
  <h2 class="settings-manager__title">Configuración del Sistema</h2>

  {#if loading}
    <div class="settings-manager__loader">
      <Loader label="Cargando configuración..." />
    </div>
  {:else}
    <div class="settings-manager__grid">
      <!-- Public Registration -->
      <article class="setting-card">
        <div class="setting-card__header">
          <div class="setting-card__info">
            <h3 class="setting-card__title" id="registration-title">
              Registro Público
            </h3>
            <p class="setting-card__desc" id="registration-desc">
              Permitir que cualquier usuario con una cuenta de Discord se cree
              una cuenta. Si está desactivado, solo los usuarios con invitación
              o ya registrados podrán ingresar.
            </p>
          </div>
          <div class="toggle-switch">
            <input
              type="checkbox"
              id="public_registration"
              class="toggle-switch__input"
              checked={settings['public_registration'] !== 'false'}
              disabled={updating}
              aria-labelledby="registration-title"
              aria-describedby="registration-desc"
              onchange={({ currentTarget }) =>
                updateSetting(
                  'public_registration',
                  currentTarget.checked ? 'true' : 'false',
                )}
            />
            <label
              for="public_registration"
              class="toggle-switch__label"
              aria-hidden="true"
            >
              <span class="toggle-switch__inner"></span>
              <span class="toggle-switch__switch"></span>
            </label>
          </div>
        </div>
      </article>

      <!-- Maintenance Settings -->
      <article class="setting-card">
        <div class="setting-card__header">
          <div class="setting-card__info">
            <h3 class="setting-card__title">Mantenimiento por Rol</h3>
            <p class="setting-card__desc">
              Bloquea el acceso a diferentes tipos de usuario. Los usuarios
              bloqueados serán redirigidos a la página de mantenimiento. (Sudo
              nunca es bloqueado).
            </p>
          </div>
        </div>

        <div class="settings-manager__maintenance">
          <!-- Roles -->
          <div class="settings-manager__roles">
            <div class="role-toggle">
              <span class="role-toggle__label" id="maint-student-title"
                >Estudiantes</span
              >
              <div class="toggle-switch">
                <input
                  type="checkbox"
                  id="maintenance_role_student"
                  class="toggle-switch__input"
                  checked={settings['maintenance_role_student'] === 'true'}
                  disabled={updating}
                  aria-labelledby="maint-student-title"
                  onchange={({ currentTarget }) =>
                    updateSetting(
                      'maintenance_role_student',
                      currentTarget.checked ? 'true' : 'false',
                    )}
                />
                <label
                  for="maintenance_role_student"
                  class="toggle-switch__label"
                >
                  <span class="toggle-switch__inner"></span>
                  <span class="toggle-switch__switch"></span>
                </label>
              </div>
            </div>

            <div class="role-toggle">
              <span class="role-toggle__label" id="maint-docente-title"
                >Docentes</span
              >
              <div class="toggle-switch">
                <input
                  type="checkbox"
                  id="maintenance_role_docente"
                  class="toggle-switch__input"
                  checked={settings['maintenance_role_docente'] === 'true'}
                  disabled={updating}
                  aria-labelledby="maint-docente-title"
                  onchange={({ currentTarget }) =>
                    updateSetting(
                      'maintenance_role_docente',
                      currentTarget.checked ? 'true' : 'false',
                    )}
                />
                <label
                  for="maintenance_role_docente"
                  class="toggle-switch__label"
                >
                  <span class="toggle-switch__inner"></span>
                  <span class="toggle-switch__switch"></span>
                </label>
              </div>
            </div>

            {#if userRole === 'sudo'}
              <div class="role-toggle role-toggle--danger">
                <span class="role-toggle__label" id="maint-admin-title"
                  >Administradores (Peligro)</span
                >
                <div class="toggle-switch">
                  <input
                    type="checkbox"
                    id="maintenance_role_admin"
                    class="toggle-switch__input"
                    checked={settings['maintenance_role_admin'] === 'true'}
                    disabled={updating}
                    aria-labelledby="maint-admin-title"
                    onchange={({ currentTarget }) =>
                      updateSetting(
                        'maintenance_role_admin',
                        currentTarget.checked ? 'true' : 'false',
                      )}
                  />
                  <label
                    for="maintenance_role_admin"
                    class="toggle-switch__label"
                  >
                    <span
                      class="toggle-switch__inner toggle-switch__inner--danger"
                    ></span>
                    <span class="toggle-switch__switch"></span>
                  </label>
                </div>
              </div>
            {/if}
          </div>

          <!-- Message -->
          <div class="maintenance-message">
            <label for="maintenance_message" class="maintenance-message__label">
              Mensaje de Mantenimiento (Solo HTML)
            </label>
            <textarea
              id="maintenance_message"
              class="maintenance-message__input"
              rows="4"
              disabled={updating}
              bind:value={settings['maintenance_message']}
              placeholder="El sitio se encuentra en mantenimiento..."
            ></textarea>
            <Button
              loading={updating}
              onclick={() =>
                updateSetting(
                  'maintenance_message',
                  settings['maintenance_message'] || '',
                )}
              extraClass="maintenance-message__save"
            >
              Guardar Mensaje
            </Button>
          </div>
        </div>
      </article>
    </div>
  {/if}
</div>

<style>
  .settings-manager {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .settings-manager__title {
    font-size: 1.5rem;
    margin: 0;
    color: var(--text-color-primary);
  }

  .settings-manager__grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .settings-manager__loader {
    padding: 3rem;
    display: flex;
    justify-content: center;
  }

  .setting-card {
    background-color: var(--foreground-color);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: var(--transition-theme);
  }

  .setting-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .setting-card__info {
    flex: 1;
  }

  .setting-card__title {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    color: var(--text-color-primary);
    font-weight: 600;
  }

  .setting-card__desc {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    line-height: 1.5;
  }

  .toggle-switch {
    position: relative;
    width: 50px;
    height: 28px;
    flex-shrink: 0;
  }

  .toggle-switch__input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .toggle-switch__label {
    display: block;
    overflow: hidden;
    cursor: pointer;
    border-radius: 20px;
    margin: 0;
    height: 100%;
  }

  .toggle-switch__inner {
    display: block;
    width: 200%;
    margin-left: -100%;
    transition: margin 0.3s ease-in-out;
  }

  .toggle-switch__inner::before,
  .toggle-switch__inner::after {
    display: block;
    float: left;
    width: 50%;
    height: 28px;
    box-sizing: border-box;
    content: '';
  }

  .toggle-switch__inner::before {
    background-color: var(--brand-primary);
  }

  .toggle-switch__inner::after {
    background-color: rgba(128, 128, 128, 0.2);
  }

  .toggle-switch__inner--danger::before {
    background-color: var(--color-danger);
  }

  .toggle-switch__switch {
    display: block;
    width: 22px;
    height: 22px;
    margin: 3px;
    background: #ffffff;
    position: absolute;
    top: 0;
    right: 22px;
    border-radius: 50%;
    transition: all 0.3s ease-in-out;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  .toggle-switch__input:checked + .toggle-switch__label .toggle-switch__inner {
    margin-left: 0;
  }

  .toggle-switch__input:checked + .toggle-switch__label .toggle-switch__switch {
    right: 0;
  }

  .toggle-switch__input:focus-visible + .toggle-switch__label {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
  }

  /* Maintenance Section */
  .settings-manager__maintenance {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .settings-manager__roles {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .role-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: var(--border-color-light);
    border-radius: 0.75rem;
    border: 1px solid transparent;
    transition: var(--transition-theme);
  }

  .role-toggle--danger {
    border-left: 4px solid var(--color-danger);
  }

  .role-toggle__label {
    font-size: 0.9375rem;
    color: var(--text-color-primary);
    font-weight: 500;
  }

  .maintenance-message {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .maintenance-message__label {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    font-weight: 600;
  }

  .maintenance-message__input {
    width: 100%;
    padding: 1rem;
    background-color: transparent;
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
    color: var(--text-color-primary);
    font-family: inherit;
    font-size: 0.9375rem;
    resize: vertical;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .maintenance-message__input:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px rgba(17, 107, 177, 0.1);
  }
</style>
