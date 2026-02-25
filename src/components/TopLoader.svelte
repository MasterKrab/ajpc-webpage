<script lang="ts">
  import { onMount } from 'svelte'

  type LoaderState = 'idle' | 'loading' | 'done'

  let state = $state<LoaderState>('idle')
  let element: HTMLDivElement

  onMount(() => {
    const start = () => (state = 'loading')
    const done = () => (state = 'done')

    document.addEventListener('astro:before-preparation', start)
    document.addEventListener('astro:page-load', done)

    return () => {
      document.removeEventListener('astro:before-preparation', start)
      document.removeEventListener('astro:page-load', done)
    }
  })
</script>

<div
  bind:this={element}
  class="top-loader"
  class:top-loader--loading={state === 'loading'}
  class:top-loader--done={state === 'done'}
  aria-hidden="true"
></div>

<style>
  .top-loader {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 99999;
    width: 100%;
    height: 0.25rem;
    background: linear-gradient(
      90deg,
      var(--brand-primary),
      var(--brand-secondary)
    );
    border-radius: 0 2px 2px 0;
    transform-origin: left;
    transform: scaleX(0);
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
  }

  .top-loader--loading {
    opacity: 1;
    transform: scaleX(0.85);
    transition:
      transform 4s cubic-bezier(0.1, 0.5, 0.3, 1),
      opacity 0.2s ease;
  }

  .top-loader--done {
    opacity: 0;
    transform: scaleX(1);
    transition:
      transform 0.15s ease,
      opacity 0.4s ease 0.15s;
  }
</style>
