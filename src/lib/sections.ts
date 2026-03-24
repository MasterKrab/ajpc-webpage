import { db } from '@db/index'
import { sections, courses, sectionDocentes, enrollments } from '@db/schema'
import { eq, and } from 'drizzle-orm'
import { isAdmin } from '@lib/auth'
import type { User } from '@db/schema'

export const getSectionData = async (sectionId: string) => {
  const [sectionRow] = await db
    .select({
      id: sections.id,
      name: sections.name,
      courseId: sections.courseId,
      courseName: courses.name,
    })
    .from(sections)
    .innerJoin(courses, eq(sections.courseId, courses.id))
    .where(eq(sections.id, sectionId))

  return sectionRow || null
}

export const verifyTeacherAccess = async (user: User, sectionId: string) => {
  if (isAdmin(user)) return true

  const [access] = await db
    .select()
    .from(sectionDocentes)
    .where(
      and(
        eq(sectionDocentes.sectionId, sectionId),
        eq(sectionDocentes.teacherId, user.id),
      ),
    )

  return !!access
}

export const verifyStudentAccess = async (user: User, sectionId: string) => {
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, user.id),
        eq(enrollments.sectionId, sectionId),
        eq(enrollments.status, 'approved'),
      ),
    )

  return !!enrollment
}
