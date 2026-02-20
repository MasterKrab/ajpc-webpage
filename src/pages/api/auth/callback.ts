export const runtime = 'edge'

import type { APIRoute } from 'astro'
import { createDiscordClient, getDiscordUser } from '@lib/discord'
import { OAuth2RequestError } from 'arctic'
import { createSession, generateId } from '@lib/auth'
import { db } from '@db/index'
import { users, inviteCodes, settings } from '@db/schema'
import { eq, sql } from 'drizzle-orm'

export const GET: APIRoute = async ({ url, cookies, request }) => {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = cookies.get('discord_oauth_state')?.value

  if (!code || !state || state !== storedState) {
    return new Response('Invalid OAuth state', { status: 400 })
  }

  cookies.delete('discord_oauth_state', { path: '/' })

  try {
    const redirectUri = new URL('/api/auth/callback', request.url).toString()
    const discord = createDiscordClient(redirectUri)
    const tokens = await discord.validateAuthorizationCode(code, null)
    const discordUser = await getDiscordUser(tokens.accessToken())

    // Extract invite code from state if present (format: state:inviteCode)
    const [, inviteCode] = state.split(':')

    let role: 'student' | 'docente' | 'admin' = 'student'
    let inviteValid = false

    if (inviteCode) {
      const [invite] = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, inviteCode))

      if (invite && !invite.usedBy) {
        role = invite.role
        inviteValid = true
      }
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.discordId, discordUser.id))

    let userId: string

    if (existingUser) {
      userId = existingUser.id

      const updateData: any = {
        discordUsername: discordUser.username,
        discordAvatar: discordUser.avatar,
        email: existingUser.email,
        updatedAt: new Date(),
      }

      if (inviteValid) {
        updateData.role = role
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existingUser.id))
    } else {
      // Check if registration is allowed
      const [registrationSetting] = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'public_registration'))

      const isRegistrationEnabled = registrationSetting?.value !== 'false' // Default to true if not set

      if (!isRegistrationEnabled && !inviteValid) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: new URL(
              '/login?error=registration_disabled',
              url.origin,
            ).toString(),
          },
        })
      }

      userId = generateId()
      await db.insert(users).values({
        id: userId,
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordAvatar: discordUser.avatar,
        email: null,
        role: role,
        name: null,
      })
    }

    if (inviteValid && inviteCode) {
      // Auto-delete invite after use
      await db.delete(inviteCodes).where(eq(inviteCodes.code, inviteCode))
    }

    createSession(cookies, userId)

    if (role == 'admin' || role == 'docente') {
      return new Response(null, {
        status: 302,
        headers: {
          Location: new URL('/dashboard/cuenta', url.origin).toString(),
        },
      })
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: new URL('/dashboard', url.origin).toString(),
      },
    })
  } catch (error) {
    if (error instanceof OAuth2RequestError) {
      console.error('Discord OAuth rate limit:', error)
      return new Response(null, {
        status: 302,
        headers: {
          Location: new URL('/login?error=rate_limited', url.origin).toString(),
        },
      })
    }
    console.error('Discord OAuth callback error:', error)
    return new Response('Authentication failed', { status: 500 })
  }
}
