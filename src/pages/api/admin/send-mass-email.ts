import type { APIRoute } from 'astro'
import { isAdmin } from '@lib/auth'
import { db } from '@db/index'
import { enrollments, courses, sections } from '@db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { sendEmail } from '@lib/email'
import { wrapTemplate } from '@lib/email-shared'
import sanitizeHtml from 'sanitize-html'

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user!
  if (!isAdmin(user))
    return Response.json({ error: 'No autorizado' }, { status: 403 })

  const { recipientType, courseIds, sectionIds, subject, body, signature } =
    await request.json()

  if (!subject || !body) {
    return Response.json(
      { error: 'Asunto y cuerpo requeridos' },
      { status: 400 },
    )
  }

  // Sanitize inputs
  // Sanitize inputs
  const cleanBody = sanitizeHtml(body, {
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
  })

  const cleanSignature = sanitizeHtml(signature, {
    allowedTags: [],
    allowedAttributes: {},
  })

  let recipients: { email: string; fullName: string; courseName?: string }[] =
    []
  const seenEmails = new Set<string>()

  if (recipientType === 'all') {
    const allEnrollments = await db
      .select({
        email: enrollments.email,
        fullName: enrollments.fullName,
      })
      .from(enrollments)
      .where(eq(enrollments.status, 'approved'))

    for (const enrollment of allEnrollments) {
      if (!seenEmails.has(enrollment.email.toLowerCase())) {
        recipients.push({
          email: enrollment.email,
          fullName: enrollment.fullName,
        })
        seenEmails.add(enrollment.email.toLowerCase())
      }
    }
  } else if (
    recipientType === 'course' &&
    Array.isArray(courseIds) &&
    courseIds.length > 0
  ) {
    const courseEnrollments = await db
      .select({
        email: enrollments.email,
        fullName: enrollments.fullName,
        courseName: courses.name,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(
        and(
          inArray(enrollments.courseId, courseIds),
          eq(enrollments.status, 'approved'),
        ),
      )

    for (const enrollment of courseEnrollments) {
      if (!seenEmails.has(enrollment.email.toLowerCase())) {
        recipients.push(enrollment)
        seenEmails.add(enrollment.email.toLowerCase())
      }
    }
  } else if (
    recipientType === 'section' &&
    Array.isArray(sectionIds) &&
    sectionIds.length > 0
  ) {
    const sectionEnrollments = await db
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
          inArray(enrollments.sectionId, sectionIds),
          eq(enrollments.status, 'approved'),
        ),
      )

    for (const enrollment of sectionEnrollments) {
      if (!seenEmails.has(enrollment.email.toLowerCase())) {
        recipients.push(enrollment)
        seenEmails.add(enrollment.email.toLowerCase())
      }
    }
  } else {
    return Response.json({ error: 'Destinatarios no válidos' }, { status: 400 })
  }

  if (recipients.length === 0)
    return Response.json(
      { error: 'No se encontraron destinatarios' },
      { status: 404 },
    )

  let successCount = 0

  for (const recipient of recipients) {
    const emailBody = cleanBody
      .replace(/{{name}}/g, recipient.fullName)
      .replace(/{{courseName}}/g, recipient.courseName || '')

    const html = wrapTemplate(emailBody, cleanSignature)

    await sendEmail({
      to: recipient.email,
      subject: subject,
      html: html,
    })
    successCount++
  }

  return Response.json({ success: true, count: successCount })
}
