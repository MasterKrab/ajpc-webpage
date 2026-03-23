import type { APIRoute } from 'astro'
import { isAdmin, generateId } from '@lib/auth'
import { db } from '@db/index'
import { courses, enrollments } from '@db/schema'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

const courseSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  year: z.number().int().min(2024).max(2100),
  maxStudents: z.number().int().positive().optional().nullable(),
  status: z.enum(['open', 'closed']).optional(),
  availableSchedules: z
    .array(
      z.object({
        id: z.string(),
        day: z.string(),
        timeRange: z.string(),
      }),
    )
    .optional()
    .default([]),
})

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isAdmin(user))
    return Response.json({ error: 'No autorizado' }, { status: 403 })

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '50'))
  const offset = (page - 1) * limit

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(courses)

  const result = await db.select().from(courses).limit(limit).offset(offset)

  return Response.json({
    courses: result,
    total: totalCount.count,
    page,
    limit,
  })
}

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user!
  if (!isAdmin(user))
    return Response.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const parsed = courseSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Datos inválidos', details: parsed.error.format() },
      { status: 400 },
    )
  }

  const id = generateId()
  await db.insert(courses).values({
    id,
    ...parsed.data,
    maxStudents: parsed.data.maxStudents ?? null,
    status: parsed.data.status ?? 'closed',
  })

  return Response.json({ id }, { status: 201 })
}

const updateCourseSchema = courseSchema.partial()

export const PATCH: APIRoute = async ({ locals, request, url }) => {
  const user = locals.user!
  if (!isAdmin(user))
    return Response.json({ error: 'No autorizado' }, { status: 403 })

  const courseId = url.searchParams.get('id')
  if (!courseId) {
    return Response.json({ error: 'ID requerido' }, { status: 400 })
  }

  const body = await request.json()
  const parsed = updateCourseSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))

  if (!existing) {
    return Response.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  await db
    .update(courses)
    .set({
      ...parsed.data,
      maxStudents: parsed.data.maxStudents ?? null,
    })
    .where(eq(courses.id, courseId))

  return Response.json({ success: true })
}

export const DELETE: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isAdmin(user))
    return Response.json({ error: 'No autorizado' }, { status: 403 })

  const courseId = url.searchParams.get('id')
  if (!courseId) {
    return Response.json({ error: 'ID requerido' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))

  if (!existing) {
    return Response.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  // Delete course (will cascade to sections, modules, enrollments, etc.)
  await db.delete(courses).where(eq(courses.id, courseId))

  return Response.json({ success: true })
}
