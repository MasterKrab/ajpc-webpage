import type { APIRoute } from 'astro'
import { isAdmin, generateId } from '@lib/auth'
import { db } from '@db/index'
import { courses, enrollments } from '@db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const courseSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  year: z.number().int().min(2024).max(2100),
  maxStudents: z.number().int().positive().optional().nullable(),
  status: z.enum(['open', 'closed']).optional(),
  enrollmentStartDate: z.string().optional().nullable(),
  enrollmentEndDate: z.string().optional().nullable(),
})

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user!
  if (!isAdmin(user))
    return Response.json({ error: 'No autorizado' }, { status: 403 })

  const result = await db.select().from(courses)
  return Response.json(result)
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
    enrollmentStartDate: parsed.data.enrollmentStartDate
      ? new Date(parsed.data.enrollmentStartDate)
      : null,
    enrollmentEndDate: parsed.data.enrollmentEndDate
      ? new Date(parsed.data.enrollmentEndDate)
      : null,
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
      enrollmentStartDate: parsed.data.enrollmentStartDate
        ? new Date(parsed.data.enrollmentStartDate)
        : parsed.data.enrollmentStartDate === null
          ? null
          : undefined,
      enrollmentEndDate: parsed.data.enrollmentEndDate
        ? new Date(parsed.data.enrollmentEndDate)
        : parsed.data.enrollmentEndDate === null
          ? null
          : undefined,
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

  // Delete enrollments first (manual cascade)
  await db.delete(enrollments).where(eq(enrollments.courseId, courseId))
  // Delete course
  await db.delete(courses).where(eq(courses.id, courseId))

  return Response.json({ success: true })
}
