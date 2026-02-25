<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import Loader from '@components/ui/Loader.svelte'

  let props = $props<{
    onLoadMore: () => void
    hasMore: boolean
    loading: boolean
    threshold?: number
  }>()

  let observerItem = $state<HTMLElement | undefined>()

  let observer: IntersectionObserver

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && props.hasMore && !props.loading) {
          props.onLoadMore()
        }
      },
      {
        rootMargin: `0px 0px ${props.threshold ?? 200}px 0px`,
      },
    )

    if (observerItem) observer.observe(observerItem)
  })

  onDestroy(() => {
    if (observer) observer.disconnect()
  })
</script>

<div class="infinite-scroll">
  {#if props.hasMore}
    <div bind:this={observerItem} class="observer-trigger">
      {#if props.loading}
        <Loader size="md" />
      {/if}
    </div>
  {/if}
</div>

<style>
  .infinite-scroll {
    display: flex;
    justify-content: center;
    padding: 2rem;
    width: 100%;
  }

  .observer-trigger {
    height: 40px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .infinite-scroll {
    display: flex;
    justify-content: center;
    padding: 2rem;
    width: 100%;
  }

  .observer-trigger {
    height: 40px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
