import type { APIRoute } from 'astro'
import { isAdmin } from '@lib/auth'
import { db } from '@db/index'
import { enrollments, courses, emailTemplates } from '@db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { sendEmail } from '@lib/email'
import { wrapTemplate } from '@lib/email-shared'
import { z } from 'zod'



export const POST: APIRoute = async ({ locals, request }) => {

  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const { enrollmentId, courseId } = body

  if (!enrollmentId && !courseId) {
    return Response.json({ error: 'EnrollmentId o CourseId requerido' }, { status: 400 })
  }

  let targets = []

  if (enrollmentId) {
    const response = await db
      .select({
        enrollment: enrollments,
        courseName: courses.name,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.id, enrollmentId))
    targets = response
  } else {
    const response = await db
      .select({
        enrollment: enrollments,
        courseName: courses.name,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(
        and(
          eq(enrollments.courseId, courseId),
          isNull(enrollments.notifiedAt),
          sql`${enrollments.status} != 'pending'`
        )
      )
    targets = response
  }

  if (targets.length === 0) 
    return Response.json({ message: 'No hay notificaciones pendientes' })
  

  const templates = await db.select().from(emailTemplates)
  const approvedTemplate = templates.find(template => template.id === 'approved')
  const rejectedTemplate = templates.find(template => template.id === 'rejected')

  if (!approvedTemplate || !rejectedTemplate) 
    return Response.json({ error: 'Plantillas no configuradas' }, { status: 500 })
  

  let successCount = 0
  for (const target of targets) {
    const template = target.enrollment.status === 'approved' ? approvedTemplate : rejectedTemplate
    
    let emailBody = template.body
      .replace(/{{name}}/g, target.enrollment.fullName)
      .replace(/{{courseName}}/g, target.courseName)
      .replace(/{{feedback}}/g, target.enrollment.feedback 
        ? `<p><strong>${target.enrollment.status === 'approved' ? 'Comentarios' : 'Motivo'}:</strong> ${target.enrollment.feedback}</p>` 
        : '')

    await sendEmail({
      to: target.enrollment.email,
      subject: template.subject,
      html: wrapTemplate(emailBody, template.signature),
    })

    await db
      .update(enrollments)
      .set({ notifiedAt: new Date() })
      .where(eq(enrollments.id, target.enrollment.id))
    
    successCount++
  }

  return Response.json({ success: true, count: successCount })
}
