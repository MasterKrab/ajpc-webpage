import { z } from 'zod'
import { router, adminProcedure } from '../../trpc'
import { sections, enrollments, sectionDocentes, users } from '@db/schema'
import { eq } from 'drizzle-orm'
import { generateId } from '@lib/auth'

const sectionInputSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().min(1).max(100),
  teacherIds: z.array(z.string()).optional(),
})

export const adminSectionsRouter = router({
  /**
   * Returns all sections for a given course, including their assigned teachers.
   */
  listByCourse: adminProcedure
    .input(z.object({ courseId: z.string().min(1) }))
    .query(async ({ ctx, input }: { ctx: any; input: any }) => {
      const sectionList = await ctx.database
        .select()
        .from(sections)
        .where(eq(sections.courseId, input.courseId))

      const sectionsWithTeachers = await Promise.all(
        sectionList.map(async (section: any) => {
          const assignedTeachers = await ctx.database
            .select({
              id: users.id,
              name: users.name,
              discordUsername: users.discordUsername,
            })
            .from(sectionDocentes)
            .innerJoin(users, eq(sectionDocentes.teacherId, users.id))
            .where(eq(sectionDocentes.sectionId, section.id))

          return {
            ...section,
            teachers: assignedTeachers,
          }
        }),
      )

      return sectionsWithTeachers
    }),

  /**
   * Creates a new section and optionally assigns teachers to it.
   */
  create: adminProcedure
    .input(sectionInputSchema)
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      const { teacherIds, ...sectionFields } = input
      const newSectionId = generateId()

      await ctx.database.insert(sections).values({
        id: newSectionId,
        ...sectionFields,
      })

      if (teacherIds && teacherIds.length > 0) {
        await ctx.database.insert(sectionDocentes).values(
          teacherIds.map((teacherId: string) => ({
            sectionId: newSectionId,
            teacherId,
          })),
        )
      }

      return { id: newSectionId }
    }),

  /**
   * Updates a section's name/courseId and replaces its teacher assignments.
   */
  update: adminProcedure
    .input(sectionInputSchema.partial().extend({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      const { id, teacherIds, ...sectionFields } = input

      if (Object.keys(sectionFields).length > 0) {
        await ctx.database
          .update(sections)
          .set({
            ...sectionFields,
            updatedAt: new Date(),
          })
          .where(eq(sections.id, id))
      }

      if (teacherIds !== undefined) {
        // Replace all teacher assignments atomically
        await ctx.database
          .delete(sectionDocentes)
          .where(eq(sectionDocentes.sectionId, id))

        if (teacherIds.length > 0) {
          await ctx.database.insert(sectionDocentes).values(
            teacherIds.map((teacherId: string) => ({
              sectionId: id,
              teacherId,
            })),
          )
        }
      }

      return { success: true }
    }),

  /**
   * Deletes a section and unlinks its enrolled students (sets sectionId to null).
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      // Unlink students before deleting so they aren't orphaned
      await ctx.database
        .update(enrollments)
        .set({ sectionId: null })
        .where(eq(enrollments.sectionId, input.id))

      await ctx.database.delete(sections).where(eq(sections.id, input.id))

      return { success: true }
    }),
})
