import type { APIRoute } from 'astro'
import { validateSession } from '@lib/auth'
import { db } from '@db/index'
import { users } from '@db/schema'
import { eq } from 'drizzle-orm'
import { decodeJwt } from 'jose'

export const GET: APIRoute = async ({ url, cookies }) => {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = cookies.get('codeforces_oauth_state')?.value

  if (!code || !state || state !== storedState)
    return new Response('Invalid state', { status: 400 })

  const user = await validateSession(cookies)

  if (!user) return new Response('Unauthorized', { status: 401 })

  try {
    const tokenUrl = 'https://codeforces.com/oauth/token'
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: import.meta.env.CODEFORCES_CLIENT_ID,
        client_secret: import.meta.env.CODEFORCES_CLIENT_SECRET,
        redirect_uri: import.meta.env.CODEFORCES_REDIRECT_URI,
      }),
    })

    const tokens = await response.json()
    if (!tokens.id_token) {
      throw new Error('No id_token returned')
    }

    const payload = decodeJwt(tokens.id_token) as {
      handle: string
      rating?: number
      avatar?: string
    }

    await db
      .update(users)
      .set({
        codeforcesHandle: payload.handle,
        codeforcesRating: payload.rating || null,
        codeforcesLastSync: Math.floor(Date.now() / 1000),
      })
      .where(eq(users.id, user.id))

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/dashboard/cuenta?codeforces_status=success',
      },
    })
  } catch (error) {
    console.error('Codeforces OAuth Error:', error)

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/dashboard/cuenta?codeforces_status=error',
      },
    })
  }
}
