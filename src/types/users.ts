import type { User } from '@db/schema'

export interface UserDisplayData {
  id: string
  name: string | null
  discordUsername: string
  discordId: string
  discordAvatar: string | null
  email?: string | null
  role?: User['role']
  createdAt?: Date | null
  updatedAt?: Date | null
}

export interface Student extends UserDisplayData {
  enrollmentId: string
}
