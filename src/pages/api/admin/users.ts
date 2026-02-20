import type { APIRoute } from 'astro'
import { isSudo } from '@lib/auth'
import { db } from '@db/index'
import { users } from '@db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user!
  if (!isSudo(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = await db.select().from(users)
  return Response.json(result)
}

const updateRoleSchema = z.object({
  role: z.enum(['student', 'admin', 'sudo']),
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

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetId))

  if (!target) {
    return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  await db
    .update(users)
    .set({ role: parsed.data.role })
    .where(eq(users.id, targetId))

  return Response.json({ success: true })
}
