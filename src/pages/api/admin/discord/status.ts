import type { APIRoute } from 'astro'
import { isAdmin } from '@lib/auth'
import { db } from '@db/index'
import { courses, enrollments, users } from '@db/schema'
import { eq } from 'drizzle-orm'
import { isMemberInGuild } from '@lib/discord'

export const GET: APIRoute = async ({ locals, url }) => {
  const currentUser = locals.user!
  if (!isAdmin(currentUser)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const enrollmentId = url.searchParams.get('enrollmentId')
  if (!enrollmentId) {
    return Response.json(
      { error: 'ID de inscripción requerido' },
      { status: 400 },
    )
  }

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))

  if (!enrollment) {
    return Response.json(
      { error: 'Inscripción no encontrada' },
      { status: 404 },
    )
  }

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, enrollment.courseId))

  if (!course?.discordGuildId) {
    return Response.json({ inGuild: false, configMissing: true })
  }

  const [enrolledUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, enrollment.userId))

  if (!enrolledUser) {
    return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const inGuild_status = await isMemberInGuild(
    course.discordGuildId,
    enrolledUser.discordId,
  )

  return Response.json({
    inGuild: inGuild_status,
    hasToken: !!enrolledUser.discordAccessToken,
    discordId: enrolledUser.discordId,
  })
}
