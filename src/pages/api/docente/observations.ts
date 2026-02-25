import type { APIRoute } from 'astro'
import { isStaff, generateId } from '@lib/auth'
import { db } from '@db/index'
import { studentObservations } from '@db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const observationSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  observation: z.string().min(1).max(5000),
})

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isStaff(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const studentId = url.searchParams.get('studentId')
  const courseId = url.searchParams.get('courseId')

  if (!studentId || !courseId) {
    return Response.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const result = await db
    .select()
    .from(studentObservations)
    .where(
      and(
        eq(studentObservations.studentId, studentId),
        eq(studentObservations.courseId, courseId),
      ),
    )
    .orderBy(studentObservations.createdAt)

  return Response.json(result)
}

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user!
  if (!isStaff(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = observationSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const id = generateId()
  await db.insert(studentObservations).values({
    id,
    ...parsed.data,
    teacherId: user.id,
  })

  return Response.json({ id }, { status: 201 })
}
