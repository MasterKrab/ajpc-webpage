import type { APIRoute } from 'astro'
import { isSudo, isAdmin } from '@lib/auth'
import { db } from '@db/index'
import { users } from '@db/schema'
import { eq, or, like, sql, and } from 'drizzle-orm'
import { z } from 'zod'

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const roleFilter = url.searchParams.get('role')
  const search = url.searchParams.get('search')
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '50'))
  const offset = (page - 1) * limit

  let conditions = []
  if (roleFilter) {
    // @ts-ignore
    conditions.push(eq(users.role, roleFilter))
  }
  if (search) {
    const searchPattern = `%${search}%`
    conditions.push(
      or(
        like(users.discordUsername, searchPattern),
        like(users.name, searchPattern),
        like(users.email, searchPattern),
      ),
    )
  }

  const finalWhere = conditions.length > 0 ? and(...conditions) : undefined

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(finalWhere)

  const result = await db
    .select()
    .from(users)
    .where(finalWhere)
    .limit(limit)
    .offset(offset)

  return Response.json({
    users: result,
    total: totalCount.count,
    page,
    limit,
  })
}

const updateRoleSchema = z.object({
  role: z.enum(['student', 'docente', 'admin', 'sudo']),
})

export const PATCH: APIRoute = async ({ locals, request, url }) => {
  const user = locals.user!
  if (!isSudo(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const targetId = url.searchParams.get('id')
  if (!targetId) {
    return Response.json({ error: 'ID requerido' }, { status: 400 })
  }

  if (targetId === user.id) {
    return Response.json(
      { error: 'No puedes cambiar tu propio rol' },
      { status: 400 },
    )
  }

  const body = await request.json()
  const parsed = updateRoleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const [target] = await db.select().from(users).where(eq(users.id, targetId))

  if (!target) {
    return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  await db
    .update(users)
    .set({ role: parsed.data.role })
    .where(eq(users.id, targetId))

  return Response.json({ success: true })
}
