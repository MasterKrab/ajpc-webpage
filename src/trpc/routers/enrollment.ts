import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { enrollments, courses, emailTemplates } from '@db/schema'
import { eq, and } from 'drizzle-orm'
import { generateId } from '@lib/auth'
import { sendEmail } from '@lib/email'
import { wrapTemplate } from '@lib/email-shared'
import { TRPCError } from '@trpc/server'

const createEnrollmentInputSchema = z.object({
  courseId: z.string().min(1),
  age: z.number().int().min(8).max(25),
  gender: z.string().min(1),
  schoolYear: z.string().min(1),
  schoolName: z.string().optional(),
  region: z.string().optional(),
  commune: z.string().optional(),
  previousExperience: z.string().max(1000).optional(),
  motivation: z.string().max(1000).optional(),
  schoolType: z.string().min(1, 'Selecciona el tipo de establecimiento'),
  selectedSchedules: z.array(z.string()),
  acceptTerms: z.literal(true),
  acceptConduct: z.literal(true),
})

export const enrollmentRouter = router({
  /**
   * Returns all enrollments for the current authenticated user.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.database
      .select({
        enrollment: enrollments,
        courseName: courses.name,
        courseLevel: courses.level,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, ctx.user.id))

    return result
  }),

  /**
   * Creates a new enrollment for the current authenticated user.
   * Validates that the course is open, not at capacity, and the user
   * has not already enrolled. Sends a confirmation email on success.
   */
  create: protectedProcedure
    .input(createEnrollmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { courseId, ...enrollmentData } = input

      if (!ctx.user.name || !ctx.user.email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Debes completar tu perfil antes de inscribirte.',
        })
      }

      const [course] = await ctx.database
        .select()
        .from(courses)
        .where(and(eq(courses.id, courseId), eq(courses.status, 'open')))

      if (!course) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El curso no existe o no está abierto para inscripciones.',
        })
      }

      if (course.maxStudents) {
        const approvedEnrollments = await ctx.database
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.courseId, courseId),
              eq(enrollments.status, 'approved'),
            ),
          )

        if (approvedEnrollments.length >= course.maxStudents) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'El curso ha alcanzado el máximo de estudiantes.',
          })
        }
      }

      const [existingEnrollment] = await ctx.database
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, ctx.user.id),
            eq(enrollments.courseId, courseId),
          ),
        )

      if (existingEnrollment) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ya tienes una inscripción en este curso.',
        })
      }

      const newEnrollmentId = generateId()
      await ctx.database.insert(enrollments).values({
        id: newEnrollmentId,
        userId: ctx.user.id,
        courseId,
        fullName: ctx.user.name,
        email: ctx.user.email,
        age: enrollmentData.age,
        gender: enrollmentData.gender,
        schoolYear: enrollmentData.schoolYear,
        schoolName: enrollmentData.schoolName,
        region: enrollmentData.region,
        commune: enrollmentData.commune,
        previousExperience: enrollmentData.previousExperience,
        motivation: enrollmentData.motivation,
        schoolType: enrollmentData.schoolType,
        selectedSchedules: enrollmentData.selectedSchedules,
      })

      // Send confirmation email using the customizable received template
      const [receivedTemplate] = await ctx.database
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, 'received'))

      const emailBody = (
        receivedTemplate?.body ||
        `<p>Hola <strong>{{name}}</strong>,</p><p>Hemos recibido tu inscripción al curso <strong>{{courseName}}</strong>.</p>`
      )
        .replace(/{{name}}/g, ctx.user.name)
        .replace(/{{courseName}}/g, course.name)

      await sendEmail({
        to: ctx.user.email,
        subject: (receivedTemplate?.subject || '¡Inscripción recibida! — AJPC').replace(
          /{{courseName}}/g,
          course.name,
        ),
        html: wrapTemplate(emailBody, receivedTemplate?.signature || 'AJPC'),
      })

      return { id: newEnrollmentId, status: 'pending' as const }
    }),
})
