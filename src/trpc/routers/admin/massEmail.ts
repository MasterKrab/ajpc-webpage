import { z } from 'zod'
import { router, adminProcedure } from '../../trpc'
import { enrollments, courses, sections } from '@db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { sendEmail } from '@lib/email'
import { wrapTemplate } from '@lib/email-shared'
import sanitizeHtml from 'sanitize-html'
import { TRPCError } from '@trpc/server'

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img',
    'h1',
    'h2',
    'h3',
    'u',
    'span',
    'div',
    'style',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['style', 'class', 'id', 'width', 'height'],
    a: ['href', 'name', 'target'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
  },
}

const massEmailInputSchema = z.discriminatedUnion('recipientType', [
  z.object({
    recipientType: z.literal('all'),
    subject: z.string().min(1),
    body: z.string().min(1),
    signature: z.string().default(''),
  }),
  z.object({
    recipientType: z.literal('course'),
    courseIds: z.array(z.string()).min(1),
    subject: z.string().min(1),
    body: z.string().min(1),
    signature: z.string().default(''),
  }),
  z.object({
    recipientType: z.literal('section'),
    sectionIds: z.array(z.string()).min(1),
    subject: z.string().min(1),
    body: z.string().min(1),
    signature: z.string().default(''),
  }),
])

export const adminMassEmailRouter = router({
  /**
   * Sends a mass email to approved students.
   * Recipients can be: all approved students, students in specific courses,
   * or students in specific sections. Deduplicates recipients by email address.
   */
  send: adminProcedure
    .input(massEmailInputSchema)
    .mutation(async ({ ctx, input }) => {
      const sanitizedBody = sanitizeHtml(input.body, sanitizeOptions)
      const sanitizedSignature = sanitizeHtml(input.signature, {
        allowedTags: [],
        allowedAttributes: {},
      })

      type Recipient = { email: string; fullName: string; courseName?: string }
      const recipients: Recipient[] = []
      const seenEmailAddresses = new Set<string>()

      if (input.recipientType === 'all') {
        const allApprovedEnrollments = await ctx.database
          .select({ email: enrollments.email, fullName: enrollments.fullName })
          .from(enrollments)
          .where(eq(enrollments.status, 'approved'))

        for (const enrollmentRecord of allApprovedEnrollments) {
          if (!seenEmailAddresses.has(enrollmentRecord.email.toLowerCase())) {
            recipients.push({ email: enrollmentRecord.email, fullName: enrollmentRecord.fullName })
            seenEmailAddresses.add(enrollmentRecord.email.toLowerCase())
          }
        }
      } else if (input.recipientType === 'course') {
        const courseEnrollments = await ctx.database
          .select({
            email: enrollments.email,
            fullName: enrollments.fullName,
            courseName: courses.name,
          })
          .from(enrollments)
          .innerJoin(courses, eq(enrollments.courseId, courses.id))
          .where(
            and(
              inArray(enrollments.courseId, input.courseIds),
              eq(enrollments.status, 'approved'),
            ),
          )

        for (const enrollmentRecord of courseEnrollments) {
          if (!seenEmailAddresses.has(enrollmentRecord.email.toLowerCase())) {
            recipients.push(enrollmentRecord)
            seenEmailAddresses.add(enrollmentRecord.email.toLowerCase())
          }
        }
      } else if (input.recipientType === 'section') {
        const sectionEnrollments = await ctx.database
          .select({
            email: enrollments.email,
            fullName: enrollments.fullName,
            courseName: courses.name,
          })
          .from(enrollments)
          .innerJoin(courses, eq(enrollments.courseId, courses.id))
          .innerJoin(sections, eq(enrollments.sectionId, sections.id))
          .where(
            and(
              inArray(enrollments.sectionId, input.sectionIds),
              eq(enrollments.status, 'approved'),
            ),
          )

        for (const enrollmentRecord of sectionEnrollments) {
          if (!seenEmailAddresses.has(enrollmentRecord.email.toLowerCase())) {
            recipients.push(enrollmentRecord)
            seenEmailAddresses.add(enrollmentRecord.email.toLowerCase())
          }
        }
      }

      if (recipients.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No se encontraron destinatarios para el envío.',
        })
      }

      let successCount = 0

      for (const recipient of recipients) {
        const personalizedBody = sanitizedBody
          .replace(/{{name}}/g, recipient.fullName)
          .replace(/{{courseName}}/g, recipient.courseName || '')

        await sendEmail({
          to: recipient.email,
          subject: input.subject,
          html: wrapTemplate(personalizedBody, sanitizedSignature),
        })

        successCount++
      }

      return { count: successCount }
    }),
})
