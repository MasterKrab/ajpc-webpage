import { z } from 'zod'
import { router, teacherProcedure } from '../../trpc'
import { studentObservations } from '@db/schema'
import { eq, and } from 'drizzle-orm'
import { generateId } from '@lib/auth'

const observationInputSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  observation: z.string().min(1).max(5000),
})

export const docenteObservationsRouter = router({
  /**
   * Returns all observations for a specific student in a specific course,
   * ordered by creation date ascending.
   */
  list: teacherProcedure
    .input(z.object({ studentId: z.string().min(1), courseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const observationList = await ctx.database
        .select()
        .from(studentObservations)
        .where(
          and(
            eq(studentObservations.studentId, input.studentId),
            eq(studentObservations.courseId, input.courseId),
          ),
        )
        .orderBy(studentObservations.createdAt)

      return observationList
    }),

  /**
   * Creates a new observation for a student from the current teacher.
   */
  create: teacherProcedure
    .input(observationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const newObservationId = generateId()

      await ctx.database.insert(studentObservations).values({
        id: newObservationId,
        studentId: input.studentId,
        courseId: input.courseId,
        observation: input.observation,
        teacherId: ctx.user.id,
      })

      return { id: newObservationId }
    }),
})
