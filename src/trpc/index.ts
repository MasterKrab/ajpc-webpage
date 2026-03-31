import { router } from './trpc'
import { userRouter } from './routers/user'
import { enrollmentRouter } from './routers/enrollment'
import { adminCoursesRouter } from './routers/admin/courses'
import { adminSectionsRouter } from './routers/admin/sections'
import { adminEnrollmentsRouter } from './routers/admin/enrollments'
import { adminUsersRouter } from './routers/admin/users'
import { adminInvitesRouter } from './routers/admin/invites'
import { adminTemplatesRouter } from './routers/admin/templates'
import { adminSettingsRouter } from './routers/admin/settings'
import { adminNotificationsRouter } from './routers/admin/notifications'
import { adminMassEmailRouter } from './routers/admin/massEmail'
import { adminDiscordRouter } from './routers/admin/discord'
import { docenteSectionsRouter } from './routers/docente/sections'
import { docenteStudentsRouter } from './routers/docente/students'
import { docenteModulesRouter } from './routers/docente/modules'
import { docenteAttendanceRouter } from './routers/docente/attendance'
import { docenteObservationsRouter } from './routers/docente/observations'

/**
 * The root application router for tRPC.
 * All sub-routers are mounted here under their respective namespaces.
 */
export const appRouter = router({
  user: userRouter,
  enrollment: enrollmentRouter,

  admin: router({
    courses: adminCoursesRouter,
    sections: adminSectionsRouter,
    enrollments: adminEnrollmentsRouter,
    users: adminUsersRouter,
    invites: adminInvitesRouter,
    templates: adminTemplatesRouter,
    settings: adminSettingsRouter,
    notifications: adminNotificationsRouter,
    massEmail: adminMassEmailRouter,
    discord: adminDiscordRouter,
  }),

  docente: router({
    sections: docenteSectionsRouter,
    students: docenteStudentsRouter,
    modules: docenteModulesRouter,
    attendance: docenteAttendanceRouter,
    observations: docenteObservationsRouter,
  }),
})

/**
 * Export the AppRouter type for use in the client and server caller.
 * This is the single source of truth for end-to-end type safety.
 */
export type AppRouter = typeof appRouter
