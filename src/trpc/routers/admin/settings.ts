import { z } from 'zod'
import { router, adminProcedure } from '../../trpc'
import { settings } from '@db/schema'

export const adminSettingsRouter = router({
  /**
   * Returns all application settings as a key-value map.
   */
  get: adminProcedure.query(async ({ ctx }: { ctx: any }) => {
    const allSettings = await ctx.database.select().from(settings)

    const settingsMap = allSettings.reduce(
      (accumulator: any, currentSetting: any) => {
        accumulator[currentSetting.key] = currentSetting.value
        return accumulator
      },
      {} as Record<string, string>,
    )

    return settingsMap
  }),

  /**
   * Upserts multiple settings at once from a key-value map.
   */
  update: adminProcedure
    .input(z.record(z.string(), z.string()))
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      const settingEntries = Object.entries(input)

      for (const [key, value] of settingEntries) {
        await ctx.database
          .insert(settings)
          .values({
            key,
            value: String(value),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: settings.key,
            set: {
              value: String(value),
              updatedAt: new Date(),
            },
          })
      }

      return { success: true }
    }),
})
