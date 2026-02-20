import { createHmac, randomBytes } from 'node:crypto'
import type { AstroCookies } from 'astro'
import { db } from '@db/index'
import { users, type User } from '@db/schema'
import { eq } from 'drizzle-orm'

const SESSION_COOKIE = 'ajpc_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const getSecret = () => {
  const secret = import.meta.env.SESSION_SECRET
  if (!secret || secret.length < 32)
    throw new Error('SESSION_SECRET must be at least 32 characters')
  return secret
}

const sign = (payload: string): string => {
  const hmac = createHmac('sha256', getSecret())
  hmac.update(payload)
  return `${payload}.${hmac.digest('base64url')}`
}

const verify = (token: string): string | null => {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return null

  const payload = token.slice(0, lastDot)
  const expected = sign(payload)

  return expected === token ? payload : null
}

export const createSession = (cookies: AstroCookies, userId: string) => {
  const token = sign(userId)
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export const deleteSession = (cookies: AstroCookies) => {
  cookies.delete(SESSION_COOKIE, { path: '/' })
}

export const validateSession = async (
  cookies: AstroCookies,
): Promise<User | null> => {
  const token = cookies.get(SESSION_COOKIE)?.value
  if (!token) return null

  const userId = verify(token)
  if (!userId) return null

  const [user] = await db.select().from(users).where(eq(users.id, userId))
  return user ?? null
}

export const generateId = (): string => randomBytes(16).toString('hex')

export const hasRole = (
  user: User | null,
  ...roles: Array<'student' | 'docente' | 'admin' | 'sudo'>
): boolean => {
  if (!user) return false
  return roles.includes(user.role as any)
}

export const isAdmin = (user: User | null): boolean =>
  hasRole(user, 'admin', 'sudo')

export const isStaff = (user: User | null): boolean =>
  hasRole(user, 'docente', 'admin', 'sudo')

export const isSudo = (user: User | null): boolean =>
  hasRole(user, 'sudo')
