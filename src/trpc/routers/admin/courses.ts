import { z } from 'zod'
import { router, adminProcedure } from '../../trpc'
import { courses, enrollments } from '@db/schema'
import { eq, sql } from 'drizzle-orm'
import { generateId } from '@lib/auth'
import { TRPCError } from '@trpc/server'

const courseInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  year: z.number().int().min(2024).max(2100),
  maxStudents: z.number().int().positive().optional().nullable(),
  status: z.enum(['open', 'closed']).optional(),
  availableSchedules: z
    .array(
      z.object({
        id: z.string(),
        day: z.string(),
        timeRange: z.string(),
      }),
    )
    .optional()
    .default([]),
  discordGuildId: z
    .string()
    .max(30)
    .trim()
    .regex(/^\d+$/, 'ID de servidor inválido (debe ser numérico)')
    .optional()
    .nullable(),
  discordRoleId: z
    .string()
    .max(30)
    .trim()
    .regex(/^\d+$/, 'ID de rol inválido (debe ser numérico)')
    .optional()
    .nullable(),
})

const courseListInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})

const courseUpdateInputSchema = courseInputSchema.partial().extend({
  id: z.string().min(1),
})

export const adminCoursesRouter = router({
  /**
   * Returns a paginated list of all courses.
   */
  list: adminProcedure.input(courseListInputSchema).query(async ({ ctx, input }) => {
    const offset = (input.page - 1) * input.limit

    const [totalCountRow] = await ctx.database
      .select({ count: sql<number>`count(*)` })
      .from(courses)

    const courseList = await ctx.database
      .select()
      .from(courses)
      .limit(input.limit)
      .offset(offset)

    return {
      courses: courseList,
      total: totalCountRow.count,
      page: input.page,
      limit: input.limit,
    }
  }),

  /**
   * Creates a new course and returns its generated ID.
   */
  create: adminProcedure.input(courseInputSchema).mutation(async ({ ctx, input }) => {
    const newCourseId = generateId()
    await ctx.database.insert(courses).values({
      id: newCourseId,
      ...input,
      maxStudents: input.maxStudents ?? null,
      status: input.status ?? 'closed',
    })
    return { id: newCourseId }
  }),

  /**
   * Updates an existing course's fields.
   */
  update: adminProcedure
    .input(courseUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateFields } = input

      const [existingCourse] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, id))

      if (!existingCourse) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Curso no encontrado.',
        })
      }

      await ctx.database
        .update(courses)
        .set({
          ...updateFields,
          maxStudents: updateFields.maxStudents ?? null,
          discordGuildId: updateFields.discordGuildId ?? null,
          discordRoleId: updateFields.discordRoleId ?? null,
        })
        .where(eq(courses.id, id))

      return { success: true }
    }),

  /**
   * Deletes a course and all its cascaded relations (sections, modules, enrollments).
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [existingCourse] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, input.id))

      if (!existingCourse) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Curso no encontrado.',
        })
      }

      await ctx.database.delete(courses).where(eq(courses.id, input.id))

      return { success: true }
    }),
})
