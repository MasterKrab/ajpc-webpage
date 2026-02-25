import type { APIRoute } from 'astro'
import { isStaff, isAdmin, generateId } from '@lib/auth'
import { db } from '@db/index'
import { modules, moduleMaterials } from '@db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const moduleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
})

const materialSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  type: z.enum(['link', 'document']).default('link'),
})

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isStaff(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const courseId = url.searchParams.get('courseId')
  if (!courseId) {
    return Response.json({ error: 'courseId requerido' }, { status: 400 })
  }

  const courseModules = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(modules.createdAt)

  const modulesWithMaterials = await Promise.all(
    courseModules.map(async (m) => {
      const materials = await db
        .select()
        .from(moduleMaterials)
        .where(eq(moduleMaterials.moduleId, m.id))
      return { ...m, materials }
    }),
  )

  return Response.json(modulesWithMaterials)
}

export const POST: APIRoute = async ({ locals, request, url }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const action = url.searchParams.get('action')
  const body = await request.json()

  if (action === 'material') {
    const parsed = materialSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: 'Datos inválidos' }, { status: 400 })

    const id = generateId()
    await db.insert(moduleMaterials).values({ id, ...parsed.data })
    return Response.json({ id }, { status: 201 })
  }

  const parsed = moduleSchema.safeParse(body)
  if (!parsed.success)
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })

  const id = generateId()
  await db.insert(modules).values({ id, ...parsed.data })
  return Response.json({ id }, { status: 201 })
}

export const DELETE: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const id = url.searchParams.get('id')
  const type = url.searchParams.get('type') // 'module' | 'material'

  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

  if (type === 'material') {
    await db.delete(moduleMaterials).where(eq(moduleMaterials.id, id))
  } else {
    // Delete materials first
    await db.delete(moduleMaterials).where(eq(moduleMaterials.moduleId, id))
    await db.delete(modules).where(eq(modules.id, id))
  }

  return Response.json({ success: true })
}
