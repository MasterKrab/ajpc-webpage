import type { APIRoute } from 'astro'
import { isAdmin, generateId } from '@lib/auth'
import { db } from '@db/index'
import { sections, enrollments, sectionDocentes, users } from '@db/schema'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

const sectionSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().min(1).max(100),
  teacherIds: z.array(z.string()).optional(),
})

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const courseId = url.searchParams.get('courseId')
  if (!courseId) {
    return Response.json({ error: 'courseId requerido' }, { status: 400 })
  }

  const sectionsList = await db
    .select()
    .from(sections)
    .where(eq(sections.courseId, courseId))

  const result = await Promise.all(
    sectionsList.map(async (section) => {
      const docentes = await db
        .select({
          id: users.id,
          name: users.name,
          discordUsername: users.discordUsername,
        })
        .from(sectionDocentes)
        .innerJoin(users, eq(sectionDocentes.teacherId, users.id))
        .where(eq(sectionDocentes.sectionId, section.id))

      return {
        ...section,
        docentes,
      }
    }),
  )

  return Response.json(result)
}

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = sectionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const id = generateId()
  const { teacherIds, ...sectionData } = parsed.data

  await db.insert(sections).values({
    id,
    ...sectionData,
  })

  if (teacherIds && teacherIds.length > 0) {
    await db.insert(sectionDocentes).values(
      teacherIds.map((tId) => ({
        sectionId: id,
        teacherId: tId,
      })),
    )
  }

  return Response.json({ id }, { status: 201 })
}

export const PATCH: APIRoute = async ({ locals, request, url }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const sectionId = url.searchParams.get('id')
  if (!sectionId) {
    return Response.json({ error: 'ID requerido' }, { status: 400 })
  }

  const body = await request.json()
  const parsed = sectionSchema.partial().safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { teacherIds, ...sectionData } = parsed.data

  if (Object.keys(sectionData).length > 0) {
    await db
      .update(sections)
      .set({
        ...sectionData,
        updatedAt: new Date(),
      })
      .where(eq(sections.id, sectionId))
  }

  if (teacherIds !== undefined) {
    await db
      .delete(sectionDocentes)
      .where(eq(sectionDocentes.sectionId, sectionId))

    if (teacherIds.length > 0) {
      await db.insert(sectionDocentes).values(
        teacherIds.map((tId) => ({
          sectionId,
          teacherId: tId,
        })),
      )
    }
  }

  return Response.json({ success: true })
}

export const DELETE: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const sectionId = url.searchParams.get('id')
  if (!sectionId) {
    return Response.json({ error: 'ID requerido' }, { status: 400 })
  }

  const assigned = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.sectionId, sectionId))
    .limit(1)

  if (assigned.length > 0) {
    return Response.json(
      { error: 'No se puede eliminar una sección con estudiantes asignados' },
      { status: 400 },
    )
  }

  await db
    .delete(sectionDocentes)
    .where(eq(sectionDocentes.sectionId, sectionId))
  await db.delete(sections).where(eq(sections.id, sectionId))

  return Response.json({ success: true })
}
