import { Discord } from 'arctic'

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

  if (!response.ok) throw new Error('Failed to fetch Discord user')

  return response.json()
}
