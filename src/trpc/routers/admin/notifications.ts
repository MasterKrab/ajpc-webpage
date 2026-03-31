import { z } from 'zod'
import { router, adminProcedure } from '../../trpc'
import { enrollments, courses, emailTemplates } from '@db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { sendEmail } from '@lib/email'
import { wrapTemplate } from '@lib/email-shared'
import { TRPCError } from '@trpc/server'

const sendNotificationsInputSchema = z.union([
  z.object({ enrollmentId: z.string().min(1), courseId: z.undefined().optional() }),
  z.object({ courseId: z.string().min(1), enrollmentId: z.undefined().optional() }),
])

export const adminNotificationsRouter = router({
  /**
   * Sends approval/rejection email notifications to one enrollment or all
   * un-notified non-pending enrollments in a course.
   * Returns the count of successfully sent emails.
   */
  send: adminProcedure
    .input(sendNotificationsInputSchema)
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      type NotificationTarget = {
        enrollment: typeof enrollments.$inferSelect
        courseName: string
      }

      let notificationTargets: NotificationTarget[] = []

      if (input.enrollmentId) {
        const result = await ctx.database
          .select({
            enrollment: enrollments,
            courseName: courses.name,
          })
          .from(enrollments)
          .innerJoin(courses, eq(enrollments.courseId, courses.id))
          .where(eq(enrollments.id, input.enrollmentId))

        notificationTargets = result
      } else if (input.courseId) {
        const result = await ctx.database
          .select({
            enrollment: enrollments,
            courseName: courses.name,
          })
          .from(enrollments)
          .innerJoin(courses, eq(enrollments.courseId, courses.id))
          .where(
            and(
              eq(enrollments.courseId, input.courseId),
              isNull(enrollments.notifiedAt),
              sql`${enrollments.status} != 'pending'`,
            ),
          )

        notificationTargets = result
      }

      if (notificationTargets.length === 0) {
        return { count: 0, message: 'No hay notificaciones pendientes.' }
      }

      const allTemplates = await ctx.database.select().from(emailTemplates)
      const approvedTemplate = allTemplates.find((template: any) => template.id === 'approved')
      const rejectedTemplate = allTemplates.find((template: any) => template.id === 'rejected')

      if (!approvedTemplate || !rejectedTemplate) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Plantillas de correo no configuradas.',
        })
      }

      let successCount = 0

      for (const target of notificationTargets) {
        const emailTemplate =
          target.enrollment.status === 'approved' ? approvedTemplate : rejectedTemplate

        const feedbackBlock = target.enrollment.feedback
          ? `<p><strong>${target.enrollment.status === 'approved' ? 'Comentarios' : 'Motivo'}:</strong> ${target.enrollment.feedback}</p>`
          : ''

        const emailBody = emailTemplate.body
          .replace(/{{name}}/g, target.enrollment.fullName)
          .replace(/{{courseName}}/g, target.courseName)
          .replace(/{{feedback}}/g, feedbackBlock)

        await sendEmail({
          to: target.enrollment.email,
          subject: emailTemplate.subject,
          html: wrapTemplate(emailBody, emailTemplate.signature),
        })

        await ctx.database
          .update(enrollments)
          .set({ notifiedAt: new Date() })
          .where(eq(enrollments.id, target.enrollment.id))

        successCount++
      }

      return { count: successCount }
    }),
})
