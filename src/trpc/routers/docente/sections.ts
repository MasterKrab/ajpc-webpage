import { z } from 'zod'
import { router, teacherProcedure, adminProcedure } from '../../trpc'
import { sections, enrollments, courses, sectionDocentes } from '@db/schema'
import { eq, and, sql } from 'drizzle-orm'

export const docenteSectionsRouter = router({
  /**
   * Returns all sections available to the current user.
   * Admins and sudo see all sections; teachers only see their assigned ones.
   * Includes student count (approved enrollments only) and course name.
   */
  list: teacherProcedure.query(async ({ ctx }) => {
    const isAdminOrSudo = ctx.user.role === 'admin' || ctx.user.role === 'sudo'

    type SectionRow = {
      id: string
      name: string
      courseId: string
      courseName: string
      studentCount: number
    }

    if (isAdminOrSudo) {
      const sectionList: SectionRow[] = await ctx.database
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

      return sectionList
    }

    // Teachers only see their assigned sections
    const teacherSectionList: SectionRow[] = await ctx.database
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
      .innerJoin(sectionDocentes, eq(sections.id, sectionDocentes.sectionId))
      .where(eq(sectionDocentes.teacherId, ctx.user.id))
      .groupBy(sections.id, courses.name)

    return teacherSectionList
  }),
})
