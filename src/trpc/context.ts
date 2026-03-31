import { db } from '@db/index'
import type { User } from '@db/schema'

export interface TRPCContext {
  user: User | null
  database: typeof db
}

/**
 * Creates the tRPC context from Astro locals.
 * The user is already populated by the middleware (validateSession).
 */
export function createContext(locals: App.Locals): TRPCContext {
  return {
    user: locals.user ?? null,
    database: db,
  }
}
