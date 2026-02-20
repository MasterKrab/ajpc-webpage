import type { APIRoute } from 'astro'
import { deleteSession } from '@lib/auth'

export const GET: APIRoute = async ({ cookies, url }) => {
  deleteSession(cookies)
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL('/', url.origin).toString(),
    },
  })
}
