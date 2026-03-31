import { createCallerFactory } from './trpc'
import { appRouter } from './index'
import { createContext } from './context'

const createCaller = createCallerFactory(appRouter)

/**
 * Creates a server-side tRPC caller for use in Astro page frontmatter.
 * This bypasses the HTTP layer entirely — calls go directly to the router.
 * Use this in .astro files instead of calling the API over HTTP.
 *
 * @example
 * ```ts
 * // In an Astro page frontmatter:
 * const caller = createServerCaller(Astro.locals)
 * const profile = await caller.user.getProfile()
 * ```
 */
export function createServerCaller(locals: App.Locals) {
  const context = createContext(locals)
  return createCaller(context)
}
