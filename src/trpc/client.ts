import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from './index'

/**
 * Vanilla tRPC client for use in Svelte components and client-side code.
 * Uses HTTP batching to combine multiple concurrent requests into one.
 * Configured with superjson to correctly handle Date, Map, Set, etc.
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
    }),
  ],
})
