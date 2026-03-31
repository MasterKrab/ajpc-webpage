import { z } from 'zod'
import { router, teacherProcedure, adminProcedure } from '../../trpc'
import { modules, moduleMaterials } from '@db/schema'
import { eq } from 'drizzle-orm'
import { generateId } from '@lib/auth'

const moduleInputSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
})

const materialInputSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  type: z.enum(['link', 'document']).default('link'),
})

export const docenteModulesRouter = router({
  /**
   * Returns all modules for a given course, each with their associated materials.
   * Ordered by creation date ascending.
   */
  listByCourse: teacherProcedure
    .input(z.object({ courseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const courseModules = await ctx.database
        .select()
        .from(modules)
        .where(eq(modules.courseId, input.courseId))
        .orderBy(modules.createdAt)

      const modulesWithMaterials = await Promise.all(
        courseModules.map(async (courseModule) => {
          const materialList = await ctx.database
            .select()
            .from(moduleMaterials)
            .where(eq(moduleMaterials.moduleId, courseModule.id))

          return { ...courseModule, materials: materialList }
        }),
      )

      return modulesWithMaterials
    }),

  /**
   * Creates a new module for a course. Only admins can create modules.
   */
  create: adminProcedure
    .input(moduleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const newModuleId = generateId()
      await ctx.database.insert(modules).values({ id: newModuleId, ...input })
      return { id: newModuleId }
    }),

  /**
   * Adds a material link to an existing module. Only admins can add materials.
   */
  createMaterial: adminProcedure
    .input(materialInputSchema)
    .mutation(async ({ ctx, input }) => {
      const newMaterialId = generateId()
      await ctx.database
        .insert(moduleMaterials)
        .values({ id: newMaterialId, ...input })
      return { id: newMaterialId }
    }),

  /**
   * Updates a module's title, courseId, or description. Only admins can update modules.
   */
  update: adminProcedure
    .input(moduleInputSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateFields } = input
      await ctx.database
        .update(modules)
        .set(updateFields)
        .where(eq(modules.id, id))
      return { success: true }
    }),

  /**
   * Deletes a module and all its materials. Only admins can delete modules.
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Materials must be deleted before the module due to foreign key constraint
      await ctx.database
        .delete(moduleMaterials)
        .where(eq(moduleMaterials.moduleId, input.id))
      await ctx.database.delete(modules).where(eq(modules.id, input.id))
      return { success: true }
    }),

  /**
   * Deletes a single material from a module. Only admins can delete materials.
   */
  deleteMaterial: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.database
        .delete(moduleMaterials)
        .where(eq(moduleMaterials.id, input.id))
      return { success: true }
    }),
})
