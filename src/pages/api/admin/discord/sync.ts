import type { APIRoute } from 'astro'
import { isAdmin } from '@lib/auth'
import { db } from '@db/index'
import { courses, enrollments, users } from '@db/schema'
import { eq, and } from 'drizzle-orm'
import { getGuildMembers, type DiscordGuildMember } from '@lib/discord'

export const GET: APIRoute = async ({ locals, url }) => {
  const currentUser = locals.user!
  if (!isAdmin(currentUser)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const courseId = url.searchParams.get('courseId')
  if (!courseId) {
    return Response.json({ error: 'ID de curso requerido' }, { status: 400 })
  }

  try {
    const [currentCourse] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))

    if (!currentCourse) {
      return Response.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    if (!currentCourse.discordGuildId) {
      return Response.json({ error: 'El curso no tiene un servidor de Discord configurado' }, { status: 400 })
    }

    // Fetch all approved students for this course
    const approvedEnrollments = await db
      .select({
        enrollment: enrollments,
        user: users
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.status, 'approved')
      ))

    // Fetch Discord members
    console.log(`[Discord Sync] Fetching members for guild ${currentCourse.discordGuildId}...`)
    const discordMembers = await getGuildMembers(currentCourse.discordGuildId)
    console.log(`[Discord Sync] Found ${discordMembers.length} members in Discord.`)
    
    const discordMembersMap = new Map<string, DiscordGuildMember>(
      discordMembers.map((member) => [member.user.id, member])
    )

    // Match students with Discord members
    const synchronizationData = approvedEnrollments.map(({ enrollment, user }) => {
      const discordMember = discordMembersMap.get(user.discordId)
      
      return {
        enrollmentId: enrollment.id,
        fullName: enrollment.fullName,
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        hasToken: !!user.discordAccessToken,
        inGuild: !!discordMember,
        currentNickname: discordMember?.nick || null,
        needsNicknameUpdate: discordMember ? (discordMember.nick !== enrollment.fullName) : false,
        hasRole: discordMember && currentCourse.discordRoleId ? discordMember.roles.includes(currentCourse.discordRoleId) : false
      }
    })

    return Response.json({
      courseName: currentCourse.name,
      discordGuildId: currentCourse.discordGuildId,
      discordRoleId: currentCourse.discordRoleId,
      students: synchronizationData
    })
  } catch (error: any) {
    console.error('[Discord Sync Error]:', error)
    return Response.json({ error: `Error interno: ${error.message || 'Desconocido'}` }, { status: 500 })
  }
}
