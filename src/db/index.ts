import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    if (!_db) {
      const url = import.meta.env.TURSO_DATABASE_URL
      if (!url) throw new Error('TURSO_DATABASE_URL not set')

      const client = createClient({
        url,
        authToken: import.meta.env.TURSO_AUTH_TOKEN,
      })
      _db = drizzle(client, { schema })
    }
    return (_db as Record<string | symbol, unknown>)[prop]
  },
})
