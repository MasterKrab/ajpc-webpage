<script lang="ts">
  import { fly } from 'svelte/transition'
  import Snail from '@components/ui/Snail.svelte'

  interface Props {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    fullscreen?: boolean
    label?: string
  }

  let { size = 'xl', fullscreen = false, label }: Props = $props()

  const sizes = {
    xs: '1.5rem',
    sm: '2.5rem',
    md: '4rem',
    lg: '6rem',
    xl: '10rem',
  }

  const selectedSize = sizes[size]
</script>

<div
  class="loader"
  class:loader--fullscreen={fullscreen}
  role="status"
  aria-live="polite"
  in:fly={{ duration: 200, y: 5, opacity: 0 }}
>
  <div class="loader__content" style:width={selectedSize}>
    <Snail size="100%" />
    <span class="sr-only">{label || 'Cargando...'}</span>
  </div>
  {#if label}
    <p class="loader__label">{label}</p>
  {/if}
</div>

<style>
  .loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
  }

  .loader--fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(var(--foreground-color-rgb, 255, 255, 255), 0.8);
    backdrop-filter: blur(4px);
    z-index: 9999;
  }

  .loader__content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loader__label {
    font-weight: 600;
    color: var(--text-color-secondary);
    font-size: 1.25rem;
    margin: 0;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }

  .sr-only {
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
</style>
