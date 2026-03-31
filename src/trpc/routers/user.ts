import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { users, settings } from '@db/schema'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

const updateProfileInputSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50),
  email: z.string().email({ message: 'Email inválido' }).max(100),
})

export const userRouter = router({
  /**
   * Returns the current authenticated user's profile.
   */
  getProfile: protectedProcedure.query(({ ctx }) => {
    return ctx.user
  }),

  /**
   * Updates the current authenticated user's display name and email.
   */
  updateProfile: protectedProcedure
    .input(updateProfileInputSchema)
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      await ctx.database
        .update(users)
        .set({
          name: input.name,
          email: input.email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))

      return { success: true, name: input.name }
    }),

  /**
   * Deletes the current authenticated user's account.
   * Sudo users cannot delete their own account through this procedure.
   */
  deleteAccount: protectedProcedure.mutation(async ({ ctx }: { ctx: any }) => {
    if (ctx.user.role === 'sudo') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message:
          'Los usuarios Sudo no pueden eliminar su propia cuenta desde el panel.',
      })
    }

    const [accountDeletionSetting] = await ctx.database
      .select()
      .from(settings)
      .where(eq(settings.key, 'allow_account_deletion'))

    if (accountDeletionSetting?.value !== 'true') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'La eliminación de cuentas está desactivada actualmente.',
      })
    }

    await ctx.database.delete(users).where(eq(users.id, ctx.user.id))

    return { success: true }
  }),
})
