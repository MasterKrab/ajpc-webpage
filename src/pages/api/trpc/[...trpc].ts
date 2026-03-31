import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { APIRoute } from 'astro'
import { appRouter } from '../../../trpc/index'
import { createContext } from '../../../trpc/context'

/**
 * The single HTTP endpoint that handles all tRPC requests.
 * tRPC uses the URL path segment after /api/trpc/ to route to the correct procedure.
 * Supports GET (queries) and POST (mutations) via the fetch adapter.
 */
const handleTRPCRequest: APIRoute = async ({ request, locals }) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createContext(locals),
    onError({ error, path }: { error: { code: string; message: string }; path: string | undefined }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error(`[tRPC] Internal server error on procedure "${path}":`, error)
      }
    },
  })
}

export const GET = handleTRPCRequest
export const POST = handleTRPCRequest
