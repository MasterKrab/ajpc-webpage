import type { APIRoute } from 'astro'
import { z } from 'zod'
import { db } from '@db/index'
import { enrollments, courses, emailTemplates } from '@db/schema'
import { eq, and } from 'drizzle-orm'
import { generateId } from '@lib/auth'
import { sendEmail } from '@lib/email'
import { wrapTemplate } from '@lib/email-shared'

const enrollmentSchema = z.object({
  courseId: z.string().min(1),
  age: z.number().int().min(8).max(25),
  gender: z.string().min(1),
  schoolYear: z.string().min(1),
  schoolName: z.string().optional(),
  region: z.string().optional(),
  commune: z.string().optional(),
  previousExperience: z.string().max(1000).optional(),
  motivation: z.string().max(1000).optional(),
})

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user!

  const result = await db
    .select({
      enrollment: enrollments,
      courseName: courses.name,
      courseLevel: courses.level,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.userId, user.id))

  return Response.json(result)
}

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user!

  const body = await request.json()
  const parsed = enrollmentSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: 'Datos inválidos', details: parsed.error.format() },
      { status: 400 },
    )
  }

  const { courseId, ...data } = parsed.data

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.status, 'open')))

  if (!course) {
    return Response.json(
      { error: 'El curso no existe o no está abierto para inscripciones' },
      { status: 400 },
    )
  }

  if (course.maxStudents) {
    const existing = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.status, 'approved'),
        ),
      )

    if (existing.length >= course.maxStudents) {
      return Response.json(
        { error: 'El curso ha alcanzado el máximo de estudiantes' },
        { status: 400 },
      )
    }
  }

  const [existingEnrollment] = await db
    .select()
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, user.id), eq(enrollments.courseId, courseId)),
    )

  if (existingEnrollment) {
    return Response.json(
      { error: 'Ya tienes una inscripción en este curso' },
      { status: 400 },
    )
  }

  if (!user.name || !user.email) {
    return Response.json(
      { error: 'Debes completar tu perfil antes de inscribirte' },
      { status: 400 },
    )
  }

  const id = generateId()
  await db.insert(enrollments).values({
    id,
    userId: user.id,
    courseId,
    fullName: user.name,
    email: user.email,
    ...data,
  })

  // Fetch customizable template
  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, 'received'))

  const emailBody = (
    template?.body ||
    `<p>Hola <strong>{{name}}</strong>,</p><p>Hemos recibido tu inscripción al curso <strong>{{courseName}}</strong>.</p>`
  )
    .replace(/{{name}}/g, user.name)
    .replace(/{{courseName}}/g, course.name)

  await sendEmail({
    to: user.email,
    subject: (template?.subject || '¡Inscripción recibida! — AJPC').replace(
      /{{courseName}}/g,
      course.name,
    ),
    html: wrapTemplate(emailBody, template?.signature || 'AJPC'),
  })

  return Response.json({ id, status: 'pending' }, { status: 201 })
}
