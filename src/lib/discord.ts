import { Discord } from 'arctic'

export const createDiscordClient = (redirectUri: string): Discord => {
  return new Discord(
    import.meta.env.DISCORD_CLIENT_ID,
    import.meta.env.DISCORD_CLIENT_SECRET,
    redirectUri,
  )
}

export const discord = new Discord(
  import.meta.env.DISCORD_CLIENT_ID,
  import.meta.env.DISCORD_CLIENT_SECRET,
  import.meta.env.DISCORD_REDIRECT_URI,
)

export interface DiscordUser {
  id: string
  username: string
  avatar: string | null
  email?: string
}

export const getDiscordUser = async (
  accessToken: string,
): Promise<DiscordUser> => {
  const response = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Discord user')
  }

  return response.json()
}

export const DISCORD_SCOPES = ['identify', 'email', 'guilds.join']

export const addMemberToGuild = async (
  guildId: string,
  userId: string,
  userAccessToken: string,
  nickname?: string,
  roleId?: string,
): Promise<{ success: boolean; error?: string }> => {
  guildId = guildId.trim()
  userId = userId.trim()

  if (roleId) roleId = roleId.trim()

  const botToken = import.meta.env.DISCORD_BOT_TOKEN
  if (!botToken) {
    console.warn('DISCORD_BOT_TOKEN is not set')
    return { success: false, error: 'DISCORD_BOT_TOKEN no configurado' }
  }

  const payload: {
    access_token: string
    nick?: string
    roles?: string[]
  } = {
    access_token: userAccessToken,
  }

  if (nickname) payload.nick = nickname

  if (roleId) payload.roles = [roleId]

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: 'Error desconocido' }))
    console.error(`Failed to add member to guild ${guildId}:`, errorBody)

    if (response.status === 403) {
      return {
        success: false,
        error:
          'Permiso denegado (403). El bot no tiene permiso para invitar o el rol que intenta asignar es igual o superior al suyo.',
      }
    }

    if (errorBody.code === 50025) {
      return {
        success: false,
        error:
          'El token del alumno no tiene el permiso guilds.join. El alumno debe cerrar sesión y volver a entrar.',
      }
    }

    return {
      success: false,
      error: errorBody.message || 'Error al añadir al servidor',
    }
  }

  return { success: true }
}

export interface DiscordGuildMember {
  user: {
    id: string
    username: string
    discriminator: string
    avatar: string | null
  }
  nick: string | null
  roles: string[]
  joined_at: string
  deaf: boolean
  mute: boolean
}

export const getGuildMembers = async (
  guildId: string,
  limit = 1000,
): Promise<DiscordGuildMember[]> => {
  guildId = guildId.trim()
  const botToken = import.meta.env.DISCORD_BOT_TOKEN
  if (!botToken) {
    console.warn('DISCORD_BOT_TOKEN is not set')
    return []
  }

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members?limit=${limit}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    },
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`Failed to fetch members for guild ${guildId}:`, errorBody)
    return []
  }

  return response.json()
}

export const isMemberInGuild = async (
  guildId: string,
  userId: string,
): Promise<boolean> => {
  guildId = guildId.trim()
  userId = userId.trim()
  const botToken = import.meta.env.DISCORD_BOT_TOKEN
  if (!botToken) {
    console.warn('DISCORD_BOT_TOKEN is not set')
    return false
  }

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    },
  )

  return response.ok
}

export const updateMemberNickname = async (
  guildId: string,
  userId: string,
  nickname: string,
): Promise<{ success: boolean; error?: string }> => {
  guildId = guildId.trim()
  userId = userId.trim()
  const botToken = import.meta.env.DISCORD_BOT_TOKEN
  if (!botToken) {
    console.warn('DISCORD_BOT_TOKEN is not set')
    return { success: false, error: 'DISCORD_BOT_TOKEN no configurado' }
  }

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nick: nickname }),
    },
  )

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: 'Error desconocido' }))
    console.error(`Failed to update nickname for user ${userId}:`, errorBody)

    if (response.status === 403) {
      return {
        success: false,
        error:
          'Permiso denegado (403). Probablemente el rol del bot está por debajo del usuario o el usuario es el dueño del servidor.',
      }
    }

    return {
      success: false,
      error: errorBody.message || 'Error al actualizar apodo en Discord',
    }
  }

  return { success: true }
}
