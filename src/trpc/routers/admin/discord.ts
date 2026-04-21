import { z } from 'zod'
import { router, adminProcedure } from '../../trpc'
import { courses, enrollments, users, sections } from '@db/schema'
import { eq } from 'drizzle-orm'
import {
  addMemberToGuild,
  isMemberInGuild,
  getGuildMembers,
  updateMemberNickname,
  getGuildRoles,
  createGuildRole,
  addRoleToMember,
  type DiscordGuildMember,
} from '@lib/discord'
import { TRPCError } from '@trpc/server'

export const adminDiscordRouter = router({
  /**
   * Checks whether an enrolled student is a member of the course's Discord guild.
   * Returns guild membership status and whether the user has granted Discord access.
   */
  getMemberStatus: adminProcedure
    .input(z.object({ enrollmentId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [enrollment] = await ctx.database
        .select()
        .from(enrollments)
        .where(eq(enrollments.id, input.enrollmentId))

      if (!enrollment)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscripción no encontrada.',
        })

      const [course] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, enrollment.courseId))

      if (!course?.discordGuildId) {
        return {
          inGuild: false,
          configMissing: true,
          hasToken: false,
          discordId: null,
        }
      }

      const [enrolledUser] = await ctx.database
        .select()
        .from(users)
        .where(eq(users.id, enrollment.userId))

      if (!enrolledUser)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado.',
        })

      const isInGuild = await isMemberInGuild(
        course.discordGuildId,
        enrolledUser.discordId,
      )

      return {
        inGuild: isInGuild,
        configMissing: false,
        hasToken: !!enrolledUser.discordAccessToken,
        discordId: enrolledUser.discordId,
      }
    }),

  /**
   * Adds an enrolled student to the course's Discord guild using their OAuth token.
   * Assigns the course role if configured.
   */
  joinGuild: adminProcedure
    .input(z.object({ enrollmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [enrollment] = await ctx.database
        .select()
        .from(enrollments)
        .where(eq(enrollments.id, input.enrollmentId))

      if (!enrollment)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscripción no encontrada.',
        })

      const [course] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, enrollment.courseId))

      if (!course?.discordGuildId)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El curso no tiene un servidor de Discord configurado.',
        })

      const [studentUser] = await ctx.database
        .select()
        .from(users)
        .where(eq(users.id, enrollment.userId))

      if (!studentUser)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado.',
        })

      if (!studentUser.discordAccessToken)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'El alumno no ha otorgado permisos de Discord. Debe cerrar sesión y volver a entrar.',
        })

      const joinResponse = await addMemberToGuild(
        course.discordGuildId,
        studentUser.discordId,
        studentUser.discordAccessToken,
        enrollment.fullName,
        course.discordRoleId || undefined,
      )

      if (!joinResponse.success)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            joinResponse.error ||
            'Error al añadir al servidor. Revisa los permisos del bot.',
        })

      return { success: true }
    }),

  /**
   * Returns a synchronization report comparing approved enrollments against
   * current Discord guild members, including nickname and role status.
   */
  getSyncStatus: adminProcedure
    .input(z.object({ courseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [course] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))

      if (!course)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Curso no encontrado.',
        })

      if (!course.discordGuildId)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El curso no tiene un servidor de Discord configurado.',
        })

      const approvedEnrollments = await ctx.database
        .select({
          enrollment: enrollments,
          user: users,
          section: sections,
        })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.userId, users.id))
        .leftJoin(sections, eq(enrollments.sectionId, sections.id))
        .where(eq(enrollments.courseId, input.courseId))

      console.log(
        `[Discord Sync] Fetching members for guild ${course.discordGuildId}...`,
      )
      const guildMembers = await getGuildMembers(course.discordGuildId)
      console.log(
        `[Discord Sync] Found ${guildMembers.length} members in Discord.`,
      )

      const guildRoles = await getGuildRoles(course.discordGuildId)

      const guildMembersMap = new Map<string, DiscordGuildMember>(
        guildMembers.map((member) => [member.user.id, member]),
      )

      const synchronizationData = approvedEnrollments.map(
        ({ enrollment, user, section }) => {
          const guildMember = guildMembersMap.get(user.discordId)

          let hasParallelRole = false
          let needsParallelRole = false
          let parallelName = section?.name || null

          if (section?.name && guildMember) {
            const roleForSection = guildRoles.find(
              (role) => role.name === section.name,
            )

            if (roleForSection)
              hasParallelRole = guildMember.roles.includes(roleForSection.id)

            needsParallelRole = !hasParallelRole
          }

          return {
            enrollmentId: enrollment.id,
            fullName: enrollment.fullName,
            discordId: user.discordId,
            discordUsername: user.discordUsername,
            hasToken: !!user.discordAccessToken,
            inGuild: !!guildMember,
            currentNickname: guildMember?.nick || null,
            needsNicknameUpdate: guildMember
              ? guildMember.nick !== enrollment.fullName
              : false,
            hasRole:
              guildMember && course.discordRoleId
                ? guildMember.roles.includes(course.discordRoleId)
                : false,
            hasParallelRole,
            needsParallelRole,
            parallelName,
          }
        },
      )

      return {
        courseName: course.name,
        discordGuildId: course.discordGuildId,
        discordRoleId: course.discordRoleId,
        students: synchronizationData,
      }
    }),

  /**
   * Updates the Discord nickname of an enrolled student in the course's guild
   * to match their registered full name.
   */
  syncNickname: adminProcedure
    .input(z.object({ enrollmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [enrollment] = await ctx.database
        .select()
        .from(enrollments)
        .where(eq(enrollments.id, input.enrollmentId))

      if (!enrollment)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscripción no encontrada.',
        })

      const [course] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, enrollment.courseId))

      if (!course?.discordGuildId)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El curso no tiene un servidor de Discord configurado.',
        })

      const [studentUser] = await ctx.database
        .select()
        .from(users)
        .where(eq(users.id, enrollment.userId))

      if (!studentUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado.',
        })
      }

      const nicknameResponse = await updateMemberNickname(
        course.discordGuildId,
        studentUser.discordId,
        enrollment.fullName,
      )

      if (!nicknameResponse.success)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            nicknameResponse.error ||
            'Error al actualizar el apodo. Revisa los permisos del bot.',
        })

      return { success: true }
    }),

  /**
   * Syncs the parallel (section) role for an enrolled student.
   * Creates the role if it doesn't exist, and assigns it to the user.
   */
  syncParallelRole: adminProcedure
    .input(z.object({ enrollmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [enrollment] = await ctx.database
        .select()
        .from(enrollments)
        .where(eq(enrollments.id, input.enrollmentId))

      if (!enrollment)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inscripción no encontrada.',
        })

      if (!enrollment.sectionId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El alumno no tiene un paralelo asignado.',
        })
      }

      const [course] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, enrollment.courseId))

      if (!course?.discordGuildId)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El curso no tiene un servidor de Discord configurado.',
        })

      const [section] = await ctx.database
        .select()
        .from(sections)
        .where(eq(sections.id, enrollment.sectionId))

      if (!section) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Paralelo no encontrado.',
        })
      }

      const [studentUser] = await ctx.database
        .select()
        .from(users)
        .where(eq(users.id, enrollment.userId))

      if (!studentUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado.',
        })
      }

      const guildRoles = await getGuildRoles(course.discordGuildId)
      let sectionRole = guildRoles.find((r) => r.name === section.name)

      if (!sectionRole) {
        const createRes = await createGuildRole(
          course.discordGuildId,
          section.name,
        )
        if (!createRes.success || !createRes.role) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
              createRes.error ||
              'Error al crear el rol del paralelo en Discord',
          })
        }
        sectionRole = createRes.role
      }

      const addResponse = await addRoleToMember(
        course.discordGuildId,
        studentUser.discordId,
        sectionRole.id,
      )

      if (!addResponse.success)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            addResponse.error ||
            'Error al asignar el rol del paralelo. Revisa los permisos del bot.',
        })

      return { success: true }
    }),

  /**
   * Creates the base roles for all sections of a course in Discord, if they do not exist.
   */
  createParallelRolesBase: adminProcedure
    .input(z.object({ courseId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [course] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))

      if (!course)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Curso no encontrado.',
        })

      if (!course.discordGuildId)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El curso no tiene un servidor de Discord configurado.',
        })

      const courseSections = await ctx.database
        .select()
        .from(sections)
        .where(eq(sections.courseId, input.courseId))

      if (courseSections.length === 0) {
        return { success: true, count: 0 }
      }

      const guildRoles = await getGuildRoles(course.discordGuildId)
      let createdCount = 0

      for (const section of courseSections) {
        const exists = guildRoles.some((r) => r.name === section.name)
        if (!exists) {
          const createResponse = await createGuildRole(
            course.discordGuildId,
            section.name,
          )
          
          if (!createResponse.success) {
            console.error(`Error creating role for section ${section.name}`, createResponse.error)
          } else {
            createdCount++
          }
        }
      }

      return { success: true, count: createdCount }
    }),
})
