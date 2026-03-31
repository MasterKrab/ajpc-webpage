import { z } from 'zod'
import { router, adminProcedure } from '../../trpc'
import { inviteCodes, users } from '@db/schema'
import { eq, desc } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { TRPCError } from '@trpc/server'

const createInviteInputSchema = z.object({
  role: z.enum(['student', 'docente', 'admin']),
  maxUses: z.coerce.number().int().min(1).optional().default(1),
})

export const adminInvitesRouter = router({
  /**
   * Returns all invite codes.
   * Sudo users see all invites; admin users only see their own.
   */
  list: adminProcedure.query(async ({ ctx }) => {
    const isSudoUser = ctx.user.role === 'sudo'

    let queryBuilder = ctx.database
      .select({
        code: inviteCodes.code,
        role: inviteCodes.role,
        createdBy: inviteCodes.createdBy,
        creatorUsername: users.discordUsername,
        creatorAvatar: users.discordAvatar,
        creatorDiscordId: users.discordId,
        usedBy: inviteCodes.usedBy,
        createdAt: inviteCodes.createdAt,
        usedAt: inviteCodes.usedAt,
        maxUses: inviteCodes.maxUses,
        uses: inviteCodes.uses,
      })
      .from(inviteCodes)
      .leftJoin(users, eq(inviteCodes.createdBy, users.id))

    const filteredQuery = isSudoUser
      ? queryBuilder
      : queryBuilder.where(eq(inviteCodes.createdBy, ctx.user.id))

    const inviteList = await filteredQuery.orderBy(desc(inviteCodes.createdAt))
    return inviteList
  }),

  /**
   * Creates a new invite code.
   * Only sudo users can create admin-level invites.
   */
  create: adminProcedure
    .input(createInviteInputSchema)
    .mutation(async ({ ctx, input }) => {
      const isSudoUser = ctx.user.role === 'sudo'

      if (input.role === 'admin' && !isSudoUser) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Solo sudo puede crear codigos de invitación para administradores.',
        })
      }

      const inviteCode = randomBytes(8).toString('hex')

      await ctx.database.insert(inviteCodes).values({
        code: inviteCode,
        role: input.role,
        createdBy: ctx.user.id,
        maxUses: input.maxUses,
      })

      return { code: inviteCode, role: input.role, maxUses: input.maxUses }
    }),

  /**
   * Deletes an invite code.
   * Sudo can delete any invite; admins can only delete their own.
   */
  delete: adminProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const isSudoUser = ctx.user.role === 'sudo'

      const [existingInvite] = await ctx.database
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, input.code))

      if (!existingInvite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitación no encontrada.',
        })
      }

      if (!isSudoUser && existingInvite.createdBy !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No autorizado para eliminar esta invitación.',
        })
      }

      await ctx.database
        .delete(inviteCodes)
        .where(eq(inviteCodes.code, input.code))

      return { success: true }
    }),
})
