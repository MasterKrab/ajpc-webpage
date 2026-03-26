import type { APIRoute } from 'astro'
import { isAdmin } from '@lib/auth'
import { db } from '@db/index'
import { courses, enrollments, users } from '@db/schema'
import { eq } from 'drizzle-orm'
import { updateMemberNickname } from '@lib/discord'

export const POST: APIRoute = async ({ locals, request }) => {
  const currentUser = locals.user!
  if (!isAdmin(currentUser)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { enrollmentId } = await request.json()
  if (!enrollmentId) {
    return Response.json({ error: 'ID de inscripción requerido' }, { status: 400 })
  }

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))

  if (!enrollment) {
    return Response.json({ error: 'Inscripción no encontrada' }, { status: 404 })
  }

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, enrollment.courseId))

  if (!course?.discordGuildId) {
    return Response.json({ error: 'El curso no tiene un servidor de Discord configurado' }, { status: 400 })
  }

  const [studentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, enrollment.userId))

  if (!studentUser) {
    return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  try {
    const response = await updateMemberNickname(
      course.discordGuildId,
      studentUser.discordId,
      enrollment.fullName
    )

    if (!response.success) {
      return Response.json({ error: response.error || 'Error al actualizar el apodo. Revisa los permisos del bot.' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Discord Nickname Sync Error:', error)
    return Response.json({ error: 'Error interno de Discord API' }, { status: 500 })
  }
}
