<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    variant?:
      | 'primary'
      | 'secondary'
      | 'danger'
      | 'success'
      | 'warning'
      | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    dashed?: boolean
    iconOnly?: boolean
    icon?: Snippet
    ariaLabel?: string
    loading?: boolean
    loadingText?: string
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    onclick?: (e: MouseEvent) => void
    color?: string
    textColor?: string
    extraClass?: string
    children?: Snippet
  }

  let {
    variant = 'primary',
    size = 'md',
    dashed = false,
    iconOnly = false,
    icon,
    ariaLabel,
    loading = false,
    loadingText = 'Cargando...',
    disabled = false,
    type = 'button',
    onclick,
    color,
    textColor,
    extraClass = '',
    children,
  }: Props = $props()

  const isDisabled = $derived(disabled || loading)

  const classes = $derived(
    [
      'button',
      `button--${variant}`,
      `button--${size}`,
      dashed && 'button--dashed',
      iconOnly && 'button--icon-only',
      loading && 'button--loading',
      extraClass,
    ]
      .filter(Boolean)
      .join(' '),
  )

  const inlineStyle = $derived(
    [
      color && `--button-override-bg: ${color}`,
      textColor && `--button-override-color: ${textColor}`,
    ]
      .filter(Boolean)
      .join('; '),
  )
</script>

<button
  {type}
  class={classes}
  style={inlineStyle || undefined}
  disabled={isDisabled}
  aria-disabled={isDisabled}
  aria-busy={loading}
  aria-label={iconOnly ? ariaLabel : undefined}
  {onclick}
>
  {#if loading}
    <span class="button__spinner" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      >
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    </span>
    {#if !iconOnly}
      <span class="button__loading-text">{loadingText}</span>
    {/if}
  {:else}
    {#if icon}
      <span class="button__icon" aria-hidden="true">{@render icon()}</span>
    {/if}
    {#if !iconOnly && children}
      <span class="button__label">{@render children()}</span>
    {/if}
  {/if}
</button>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: none;
    border-radius: var(--button-radius);
    font-family: inherit;
    font-weight: var(--button-font-weight);
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
    transition:
      background-color 0.2s ease,
      color 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.15s ease,
      opacity 0.2s ease;
  }

  .button--sm {
    padding: 0.3rem 0.75rem;
    font-size: 0.8rem;
    border-radius: var(--button-radius);
    gap: 0.375rem;
  }

  .button--md {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }

  .button--lg {
    padding: 0.875rem 2rem;
    font-size: 1rem;
    border-radius: var(--button-radius-lg);
  }

  .button--primary {
    background-color: var(--button-override-bg, var(--button-primary-bg));
    color: var(--button-override-color, var(--button-primary-color));
  }

  .button--primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--button-primary-shadow);
  }

  .button--secondary {
    background-color: var(--button-override-bg, var(--button-secondary-bg));
    color: var(--button-override-color, var(--button-secondary-color));
    border: 1px solid var(--button-secondary-border);
  }

  .button--secondary:hover:not(:disabled) {
    background-color: var(--border-color-light);
  }

  .button--danger {
    background-color: var(--button-override-bg, var(--button-danger-bg));
    color: var(--button-override-color, var(--button-danger-color));
  }

  .button--danger:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--button-danger-shadow);
  }

  .button--success {
    background-color: var(--button-override-bg, var(--button-success-bg));
    color: var(--button-override-color, var(--button-success-color));
  }

  .button--success:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--button-success-shadow);
  }

  .button--warning {
    background-color: var(--button-override-bg, var(--button-warning-bg));
    color: var(--button-override-color, var(--button-warning-color));
  }

  .button--warning:hover:not(:disabled) {
    opacity: 0.85;
  }

  .button--ghost {
    background-color: transparent;
    color: var(--button-override-color, var(--button-ghost-color));
    border: 1px solid var(--button-ghost-border);
  }

  .button--ghost:hover:not(:disabled) {
    background-color: var(--button-ghost-color);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--button-primary-shadow);
  }

  .button--dashed {
    background-color: transparent;
    border: 2px dashed currentColor;
  }

  .button--dashed:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .button--icon-only {
    padding: 0;
    border-radius: 0.625rem;
  }

  .button--icon-only.button--sm {
    width: 1.875rem;
    height: 1.875rem;
  }

  .button--icon-only.button--md {
    width: 2.25rem;
    height: 2.25rem;
  }

  .button--icon-only.button--lg {
    width: 2.75rem;
    height: 2.75rem;
  }

  /* Loading */
  .button--loading {
    cursor: wait;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .button__icon,
  .button__spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .button__icon :global(svg),
  .button__spinner :global(svg) {
    width: 1em;
    height: 1em;
  }

  .button--sm .button__icon :global(svg),
  .button--sm .button__spinner :global(svg) {
    width: 0.875em;
    height: 0.875em;
  }

  .button--lg .button__icon :global(svg),
  .button--lg .button__spinner :global(svg) {
    width: 1.125em;
    height: 1.125em;
  }

  .button__spinner :global(svg) {
    animation: button-spin 0.75s linear infinite;
  }

  @keyframes button-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
