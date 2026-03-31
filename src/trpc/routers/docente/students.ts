import { z } from 'zod'
import { router, teacherProcedure } from '../../trpc'
import { enrollments, users } from '@db/schema'
import { eq, and, sql, or, like } from 'drizzle-orm'

const studentListInputSchema = z.object({
  sectionId: z.string().min(1),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})

export const docenteStudentsRouter = router({
  /**
   * Returns a paginated list of approved students in a given section.
   * Supports optional text search on discord username and display name.
   */
  list: teacherProcedure
    .input(studentListInputSchema)
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit

      const baseConditions = [
        eq(enrollments.sectionId, input.sectionId),
        eq(enrollments.status, 'approved'),
      ]

      if (input.search) {
        const searchPattern = `%${input.search}%`
        baseConditions.push(
          or(
            like(users.discordUsername, searchPattern),
            like(users.name, searchPattern),
          ) as ReturnType<typeof eq>,
        )
      }

      const whereClause = and(...baseConditions)

      const [totalCountRow] = await ctx.database
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.userId, users.id))
        .where(whereClause)

      const studentList = await ctx.database
        .select({
          id: users.id,
          name: users.name,
          discordUsername: users.discordUsername,
          discordId: users.discordId,
          discordAvatar: users.discordAvatar,
          enrollmentId: enrollments.id,
        })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.userId, users.id))
        .where(whereClause)
        .limit(input.limit)
        .offset(offset)

      return {
        students: studentList,
        total: totalCountRow.count,
        page: input.page,
        limit: input.limit,
      }
    }),
})
