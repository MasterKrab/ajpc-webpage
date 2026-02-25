import type { APIRoute } from 'astro'
import { isStaff } from '@lib/auth'
import { db } from '@db/index'
import { enrollments, users } from '@db/schema'
import { eq, and, sql, or, like } from 'drizzle-orm'

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isStaff(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const sectionId = url.searchParams.get('sectionId')
  if (!sectionId) {
    return Response.json({ error: 'sectionId requerido' }, { status: 400 })
  }

  const search = url.searchParams.get('search')
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '50'))
  const offset = (page - 1) * limit

  const baseConditions = [
    eq(enrollments.sectionId, sectionId),
    eq(enrollments.status, 'approved'),
  ]

  if (search) {
    const searchPattern = `%${search}%`
    baseConditions.push(
      or(
        like(users.discordUsername, searchPattern),
        like(users.name, searchPattern),
      ),
    )
  }

  const finalWhere = and(...baseConditions)

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(finalWhere as any)

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      discordUsername: users.discordUsername,
      discordId: users.discordId,
      discordAvatar: users.discordAvatar,
      enrollmentId: enrollments.id,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(finalWhere as any)
    .limit(limit)
    .offset(offset)

  return Response.json({
    students: result,
    total: totalCount.count,
    page,
    limit,
  })
}
