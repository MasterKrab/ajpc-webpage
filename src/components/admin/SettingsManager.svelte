<script lang="ts">
  import { onMount } from 'svelte'
  import { toast } from 'svelte-sonner'
  import Loader from '@components/ui/Loader.svelte'

  interface Props {
    initialSettings?: Record<string, string>
  }

  let { initialSettings = {} }: Props = $props()

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
    try {
      updating = true
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      if (response.ok) {
        settings[key] = value
        toast.success('Configuración actualizada')
      } else {
        toast.error('Error al guardar la configuración')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión')
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
    <Loader label="Cargando configuración..." />
  {:else}
    <div class="settings-grid">
      <article class="setting-card">
        <div class="setting-card__header">
          <div class="setting-card__info">
            <h3 class="setting-card__title" id="registration-title">
              Registro Público
            </h3>
            <p class="setting-card__desc" id="registration-desc">
              Permitir que cualquier usuario con una cuenta de Discord se
              registre. Si está desactivado, solo los usuarios con invitación o
              ya registrados podrán ingresar.
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
  }

  .settings-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .setting-card {
    background-color: var(--foreground-color);
    border: 1px solid rgba(128, 128, 128, 0.15);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .setting-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
  }

  .setting-card__info {
    flex: 1;
  }

  .setting-card__title {
    margin: 0 0 0.5rem;
    font-size: 1.125rem;
    color: var(--text-color-primary);
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
    border: 0 solid #bbb;
    border-radius: 20px;
    margin: 0;
  }

  .toggle-switch__inner {
    display: block;
    width: 200%;
    margin-left: -100%;
    transition: margin 0.3s ease-in 0s;
  }

  .toggle-switch__inner:before,
  .toggle-switch__inner:after {
    display: block;
    float: left;
    width: 50%;
    height: 28px;
    padding: 0;
    line-height: 28px;
    font-size: 14px;
    color: white;
    font-family: Trebuchet, Arial, sans-serif;
    font-weight: bold;
    box-sizing: border-box;
  }

  .toggle-switch__inner:before {
    content: '';
    padding-left: 10px;
    background-color: var(--brand-primary);
    color: #ffffff;
  }

  .toggle-switch__inner:after {
    content: '';
    padding-right: 10px;
    background-color: rgba(128, 128, 128, 0.2);
    color: #999999;
    text-align: right;
  }

  .toggle-switch__switch {
    display: block;
    width: 22px;
    height: 22px;
    margin: 3px;
    background: #ffffff;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 22px;
    border-radius: 20px;
    transition: all 0.3s ease-in 0s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  .toggle-switch__input:checked + .toggle-switch__label .toggle-switch__inner {
    margin-left: 0;
  }

  .toggle-switch__input:checked + .toggle-switch__label .toggle-switch__switch {
    right: 0px;
  }

  .toggle-switch__input:focus-visible + .toggle-switch__label {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
  }
</style>
