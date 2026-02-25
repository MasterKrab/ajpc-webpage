import type { APIRoute } from 'astro'
import { isTeacher, generateId } from '@lib/auth'
import { db } from '@db/index'
import { attendance } from '@db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'

const attendanceSchema = z.object({
  moduleId: z.string().min(1),
  sectionId: z.string().min(1),
  studentId: z.string().min(1),
  status: z.enum(['present', 'absent', 'late', 'excused']),
})

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user!
  if (!isTeacher(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const moduleId = url.searchParams.get('moduleId')
  const sectionId = url.searchParams.get('sectionId')
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '50'))
  const offset = (page - 1) * limit

  if (!moduleId || !sectionId) {
    return Response.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const finalWhere = and(
    eq(attendance.moduleId, moduleId),
    eq(attendance.sectionId, sectionId),
  )

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(attendance)
    .where(finalWhere)

  const result = await db
    .select()
    .from(attendance)
    .where(finalWhere)
    .limit(limit)
    .offset(offset)

  return Response.json({
    attendance: result,
    total: totalCount.count,
    page,
    limit,
  })
}

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user!
  if (!isTeacher(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = attendanceSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.moduleId, parsed.data.moduleId),
        eq(attendance.sectionId, parsed.data.sectionId),
        eq(attendance.studentId, parsed.data.studentId),
      ),
    )

  if (existing) {
    await db
      .update(attendance)
      .set({
        status: parsed.data.status,
        updatedAt: new Date(),
      })
      .where(eq(attendance.id, existing.id))
    return Response.json({ success: true, id: existing.id })
  }

  const id = generateId()
  await db.insert(attendance).values({
    id,
    ...parsed.data,
  })

  return Response.json({ id }, { status: 201 })
}
