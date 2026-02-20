import type { APIRoute } from 'astro'
import { generateState } from 'arctic'
import { createDiscordClient } from '@lib/discord'

export const GET: APIRoute = async ({ cookies, request }) => {
  let state = generateState()
  const inviteCode = new URL(request.url).searchParams.get('invite')

  if (inviteCode) {
    state = `${state}:${inviteCode}`
  }

  const scopes = ['identify', 'email']

  const redirectUri = new URL('/api/auth/callback', request.url).toString()
  const discord = createDiscordClient(redirectUri)
  const url = discord.createAuthorizationURL(state, null, scopes)

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
