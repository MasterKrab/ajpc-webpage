import type { APIRoute } from 'astro'
import { isAdmin } from '@lib/auth'
import { db } from '@db/index'
import { enrollments, courses } from '@db/schema'
import { eq, inArray } from 'drizzle-orm'
import { sendEmail } from '@lib/email'
import { wrapTemplate } from '@lib/email-shared'
import sanitizeHtml from 'sanitize-html'




export const POST: APIRoute = async ({ locals, request }) => {

  const user = locals.user!
  if (!isAdmin(user)) 
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  

  const { recipientType, courseIds, subject, body, signature } = await request.json()

  if (!subject || !body) {
    return Response.json({ error: 'Asunto y cuerpo requeridos' }, { status: 400 })
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

  let recipients: { email: string; fullName: string; courseName?: string }[] = []

  if (recipientType === 'all') {
    // Approved enrollments represent the student base.
    const allEnrollments = await db
      .select({
        email: enrollments.email,
        fullName: enrollments.fullName,
      })
      .from(enrollments)
      .where(eq(enrollments.status, 'approved'))

    const seen = new Set<string>()
    for (const enr of allEnrollments) {
      if (!seen.has(enr.email)) {
        recipients.push({ email: enr.email, fullName: enr.fullName })
        seen.add(enr.email)
      }
    }
  } else if (recipientType === 'course' && Array.isArray(courseIds) && courseIds.length > 0) {
    const courseEnrollments = await db
      .select({
        email: enrollments.email,
        fullName: enrollments.fullName,
        courseName: courses.name,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(inArray(enrollments.courseId, courseIds))
    
    // De-duplicate by email (case where a student is in multiple selected courses)
    const seen = new Set<string>()
    for (const enr of courseEnrollments) 
      if (!seen.has(enr.email)) {
        recipients.push(enr)
        seen.add(enr.email)
      }
    
  } else {
    return Response.json({ error: 'Destinatarios no válidos' }, { status: 400 })
  }

  if (recipients.length === 0) 
    return Response.json({ error: 'No se encontraron destinatarios' }, { status: 404 })
  

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

