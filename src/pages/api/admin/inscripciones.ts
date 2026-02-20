import type { APIRoute } from 'astro'
import { isAdmin, isSudo } from '@lib/auth'
import { db } from '@db/index'
import { enrollments, courses, users } from '@db/schema'
import { eq,  and } from 'drizzle-orm'
import { z } from 'zod'

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isAdmin(user)) 
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  

  const courseId = url.searchParams.get('courseId')
  const status = url.searchParams.get('status')

  const baseQuery = db
    .select({
      enrollment: enrollments,
      courseName: courses.name,
      courseLevel: courses.level,
      discordUsername: users.discordUsername,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(users, eq(enrollments.userId, users.id))

  const conditions = []
  if (courseId) conditions.push(eq(enrollments.courseId, courseId))
  if (status)
    conditions.push(
      eq(enrollments.status, status as 'pending' | 'approved' | 'rejected'),
    )

  const query =
    conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery

  const result = await query
  return Response.json(result)
}

const updateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  adminNotes: z.string().optional(),
  feedback: z.string().optional(),
})

export const PATCH: APIRoute = async ({ locals, request, url }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const enrollmentId = url.searchParams.get('id')
  if (!enrollmentId) {
    return Response.json({ error: 'ID requerido' }, { status: 400 })
  }

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const [enrollment] = await db
    .select({
      enrollment: enrollments,
      courseName: courses.name,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.id, enrollmentId))

  if (!enrollment) {
    return Response.json({ error: 'Inscripción no encontrada' }, { status: 404 })
  }

  const updateData: any = {
    status: parsed.data.status,
  }

  if (parsed.data.adminNotes !== undefined) updateData.adminNotes = parsed.data.adminNotes
  if (parsed.data.feedback !== undefined) updateData.feedback = parsed.data.feedback

  await db
    .update(enrollments)
    .set(updateData)
    .where(eq(enrollments.id, enrollmentId))

  return Response.json({ success: true })
}
