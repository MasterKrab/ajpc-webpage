import type { APIRoute } from 'astro'
import { generateState } from 'arctic'
import { discord } from '@lib/discord'

export const GET: APIRoute = async ({ cookies, request }) => {
  const state = generateState()
  const scopes = ['identify', 'email']
  const url = discord.createAuthorizationURL(state, null, scopes)

  const inviteCode = new URL(request.url).searchParams.get('code')
  if (inviteCode) {
    cookies.set('ajpc_invite_code', inviteCode, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    })
  }

  cookies.set('discord_oauth_state', state, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  })
}
