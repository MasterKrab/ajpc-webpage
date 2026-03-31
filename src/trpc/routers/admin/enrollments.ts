import { z } from 'zod'
import { router, adminProcedure } from '../../trpc'
import { enrollments, courses, users } from '@db/schema'
import { eq, and, sql } from 'drizzle-orm'

const enrollmentListInputSchema = z.object({
  courseId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
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
    .query(async ({ ctx, input }: { ctx: any; input: any }) => {
      const offset = (input.page - 1) * input.limit
      const conditions = []

      if (input.courseId) {
        conditions.push(eq(enrollments.courseId, input.courseId))
      }
      if (input.status) {
        conditions.push(eq(enrollments.status, input.status))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [totalCountRow] = await ctx.database
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
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

      return {
        enrollments: enrollmentList,
        total: totalCountRow.count,
        page: input.page,
        limit: input.limit,
      }
    }),

  /**
   * Updates enrollment status, admin notes, feedback, and/or section assignment.
   * Resets notifiedAt when status changes so the student can be re-notified.
   */
  update: adminProcedure
    .input(enrollmentUpdateInputSchema)
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
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
