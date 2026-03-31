import { z } from 'zod'
import { router, teacherProcedure } from '../../trpc'
import { attendance } from '@db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { generateId } from '@lib/auth'

const attendanceListInputSchema = z.object({
  moduleId: z.string().min(1),
  sectionId: z.string().min(1),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(50),
})

const attendanceUpsertInputSchema = z.object({
  moduleId: z.string().min(1),
  sectionId: z.string().min(1),
  studentId: z.string().min(1),
  status: z.enum(['present', 'absent', 'late', 'excused']),
})

export const docenteAttendanceRouter = router({
  /**
   * Returns a paginated list of attendance records for a given module and section.
   */
  list: teacherProcedure
    .input(attendanceListInputSchema)
    .query(async ({ ctx, input }: { ctx: any; input: any }) => {
      const offset = (input.page - 1) * input.limit

      const whereClause = and(
        eq(attendance.moduleId, input.moduleId),
        eq(attendance.sectionId, input.sectionId),
      )

      const [totalCountRow] = await ctx.database
        .select({ count: sql<number>`count(*)` })
        .from(attendance)
        .where(whereClause)

      const attendanceList = await ctx.database
        .select()
        .from(attendance)
        .where(whereClause)
        .limit(input.limit)
        .offset(offset)

      return {
        attendance: attendanceList,
        total: totalCountRow.count,
        page: input.page,
        limit: input.limit,
      }
    }),

  /**
   * Creates or updates an attendance record for a student in a module/section.
   * If a record already exists for this combination, it updates the status.
   */
  upsert: teacherProcedure
    .input(attendanceUpsertInputSchema)
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      const [existingRecord] = await ctx.database
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.moduleId, input.moduleId),
            eq(attendance.sectionId, input.sectionId),
            eq(attendance.studentId, input.studentId),
          ),
        )

      if (existingRecord) {
        await ctx.database
          .update(attendance)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(attendance.id, existingRecord.id))

        return { id: existingRecord.id, created: false }
      }

      const newAttendanceId = generateId()
      await ctx.database.insert(attendance).values({
        id: newAttendanceId,
        ...input,
      })

      return { id: newAttendanceId, created: true }
    }),
})
