import { z } from 'zod'
import { router, adminProcedure } from '../../trpc'
import { enrollments, courses, users } from '@db/schema'
import { eq, and, sql, or, like, inArray } from 'drizzle-orm'

const enrollmentListInputSchema = z.object({
  courseId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})

const enrollmentUpdateInputSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  adminNotes: z.string().optional(),
  feedback: z.string().optional(),
  sectionId: z.string().nullable().optional(),
})

export const adminEnrollmentsRouter = router({
  /**
   * Returns a paginated list of enrollments, optionally filtered by course and/or status.
   * Joins course name, course level, and the student's Discord username.
   */
  list: adminProcedure
    .input(enrollmentListInputSchema)
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit
      const conditions = []

      if (input.courseId) {
        conditions.push(eq(enrollments.courseId, input.courseId))
      }
      if (input.status) {
        conditions.push(eq(enrollments.status, input.status))
      }
      if (input.search) {
        const searchPattern = `%${input.search}%`
        conditions.push(
          or(
            like(users.discordUsername, searchPattern),
            like(enrollments.fullName, searchPattern),
            like(enrollments.email, searchPattern),
          ),
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [totalCountRow] = await ctx.database
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.userId, users.id))
        .where(whereClause)

      const enrollmentList = await ctx.database
        .select({
          enrollment: enrollments,
          courseName: courses.name,
          courseLevel: courses.level,
          discordUsername: users.discordUsername,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .innerJoin(users, eq(enrollments.userId, users.id))
        .where(whereClause)
        .limit(input.limit)
        .offset(offset)

      const userIds = enrollmentList.map((e) => e.enrollment.userId)
      const otherEnrollments =
        userIds.length > 0
          ? await ctx.database
              .select({
                userId: enrollments.userId,
                courseName: courses.name,
                status: enrollments.status,
              })
              .from(enrollments)
              .innerJoin(courses, eq(enrollments.courseId, courses.id))
              .where(inArray(enrollments.userId, userIds))
          : []

      const enrollmentsWithOthers = enrollmentList.map((e) => {
        const userOthers = otherEnrollments.filter(
          (oe) => oe.userId === e.enrollment.userId,
        )
        return {
          ...e,
          allEnrollments: userOthers.map((oe) => ({
            courseName: oe.courseName,
            status: oe.status,
          })),
        }
      })

      return {
        enrollments: enrollmentsWithOthers,
        total: totalCountRow.count,
        page: input.page,
        limit: input.limit,
      }
    }),

  /**
   * Returns all enrollments for CSV export without pagination limits.
   */
  exportAll: adminProcedure
    .input(
      z.object({
        courseId: z.string().optional(),
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = []

      if (input.courseId) {
        conditions.push(eq(enrollments.courseId, input.courseId))
      }
      if (input.status) {
        conditions.push(eq(enrollments.status, input.status))
      }
      if (input.search) {
        const searchPattern = `%${input.search}%`
        conditions.push(
          or(
            like(users.discordUsername, searchPattern),
            like(enrollments.fullName, searchPattern),
            like(enrollments.email, searchPattern),
          ),
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const enrollmentList = await ctx.database
        .select({
          enrollment: enrollments,
          courseName: courses.name,
          courseLevel: courses.level,
          discordUsername: users.discordUsername,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .innerJoin(users, eq(enrollments.userId, users.id))
        .where(whereClause)

      return {
        enrollments: enrollmentList,
      }
    }),

  /**
   * Updates enrollment status, admin notes, feedback, and/or section assignment.
   * Resets notifiedAt when status changes so the student can be re-notified.
   */
  update: adminProcedure
    .input(enrollmentUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateFields } = input

      const updatePayload: {
        updatedAt: Date
        status?: 'pending' | 'approved' | 'rejected'
        notifiedAt?: Date | null
        adminNotes?: string
        feedback?: string
        sectionId?: string | null
      } = {
        updatedAt: new Date(),
      }

      if (updateFields.status !== undefined) {
        updatePayload.status = updateFields.status
        updatePayload.notifiedAt = null
      }

      if (updateFields.adminNotes !== undefined)
        updatePayload.adminNotes = updateFields.adminNotes

      if (updateFields.feedback !== undefined)
        updatePayload.feedback = updateFields.feedback

      if (updateFields.sectionId !== undefined)
        updatePayload.sectionId = updateFields.sectionId

      await ctx.database
        .update(enrollments)
        .set(updatePayload)
        .where(eq(enrollments.id, id))

      return { success: true }
    }),
})
