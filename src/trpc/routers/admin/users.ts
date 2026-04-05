import { z } from 'zod'
import { router, adminProcedure, sudoProcedure } from '../../trpc'
import { users } from '@db/schema'
import { eq, or, like, sql, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

const userListInputSchema = z.object({
  role: z.enum(['student', 'docente', 'admin', 'sudo']).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})

const updateRoleInputSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['student', 'docente', 'admin', 'sudo']),
})

export const adminUsersRouter = router({
  /**
   * Returns a paginated list of users with optional role and text search filters.
   */
  list: adminProcedure
    .input(userListInputSchema)
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit
      const conditions = []

      if (input.role) {
        conditions.push(eq(users.role, input.role))
      }
      if (input.search) {
        const searchPattern = `%${input.search}%`
        conditions.push(
          or(
            like(users.discordUsername, searchPattern),
            like(users.name, searchPattern),
            like(users.email, searchPattern),
          ),
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [totalCountResult, userList] = await Promise.all([
        ctx.database
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(whereClause),
        ctx.database
          .select()
          .from(users)
          .where(whereClause)
          .limit(input.limit)
          .offset(offset)
      ])

      const totalCountRow = totalCountResult[0]

      return {
        users: userList,
        total: totalCountRow.count,
        page: input.page,
        limit: input.limit,
      }
    }),

  /**
   * Updates another user's role. Only sudo users can perform this action.
   * A sudo user cannot change their own role.
   */
  updateRole: sudoProcedure
    .input(updateRoleInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No puedes cambiar tu propio rol.',
        })
      }

      const [targetUser] = await ctx.database
        .select()
        .from(users)
        .where(eq(users.id, input.id))

      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado.',
        })
      }

      await ctx.database
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.id))

      return { success: true }
    }),
})
