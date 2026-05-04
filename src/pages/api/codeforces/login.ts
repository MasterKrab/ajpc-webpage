import type { APIRoute } from 'astro'
import { generateState } from 'arctic'
import { validateSession } from '@lib/auth'

export const GET: APIRoute = async ({ cookies }) => {
  const user = await validateSession(cookies)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const state = generateState()
  const url = new URL('https://codeforces.com/oauth/authorize')
  url.searchParams.set('client_id', import.meta.env.CODEFORCES_CLIENT_ID)
  url.searchParams.set('redirect_uri', import.meta.env.CODEFORCES_REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid')
  url.searchParams.set('state', state)

  cookies.set('codeforces_oauth_state', state, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  })

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  })
}
