import type { APIRoute } from 'astro'
import { deleteSession } from '@lib/auth'

export const GET: APIRoute = async ({ cookies, url }) => {
  deleteSession(cookies)
  return Response.redirect(new URL('/', url.origin).toString())
}
