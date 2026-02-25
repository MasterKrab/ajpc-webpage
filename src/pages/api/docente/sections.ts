import type { APIRoute } from 'astro'
import { isStaff, isAdmin } from '@lib/auth'
import { db } from '@db/index'
import {
  sections,
  enrollments,
  users,
  courses,
  sectionDocentes,
} from '@db/schema'
import { eq, and, sql } from 'drizzle-orm'

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user!
  if (!isStaff(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const isUserAdmin = isAdmin(user)

  let query: any = db
    .select({
      id: sections.id,
      name: sections.name,
      courseId: sections.courseId,
      courseName: courses.name,
      studentCount: sql<number>`count(${enrollments.id})`.mapWith(Number),
    })
    .from(sections)
    .innerJoin(courses, eq(sections.courseId, courses.id))
    .leftJoin(
      enrollments,
      and(
        eq(sections.id, enrollments.sectionId),
        eq(enrollments.status, 'approved'),
      ),
    )
    .groupBy(sections.id, courses.name)

  // If not admin, only show assigned sections
  if (!isUserAdmin) {
    query = query
      .innerJoin(sectionDocentes, eq(sections.id, sectionDocentes.sectionId))
      .where(eq(sectionDocentes.teacherId, user.id))
  }

  const teacherSections = await query

  return Response.json(teacherSections)
}
