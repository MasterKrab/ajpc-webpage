import { defineMiddleware } from 'astro:middleware'
import { validateSession } from '@lib/auth'
import { db } from '@db/index'
import { settings } from '@db/schema'
import { inArray } from 'drizzle-orm'

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url
  context.locals.user = null

  try {
    const user = await validateSession(context.cookies)
    context.locals.user = user
  } catch (error) {
    console.error('Session validation error:', error)
  }

  const user = context.locals.user
  const effectiveRole = user?.role || 'student'

  let maintenanceRoleStudent = false
  let maintenanceRoleDocente = false
  let maintenanceRoleAdmin = false

  try {
    const mSettings = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(
        inArray(settings.key, [
          'maintenance_role_student',
          'maintenance_role_docente',
          'maintenance_role_admin',
        ]),
      )

    for (const setting of mSettings) {
      if (setting.key === 'maintenance_role_student')
        maintenanceRoleStudent = setting.value === 'true'
      if (setting.key === 'maintenance_role_docente')
        maintenanceRoleDocente = setting.value === 'true'
      if (setting.key === 'maintenance_role_admin')
        maintenanceRoleAdmin = setting.value === 'true'
    }
  } catch (error) {
    // DB might be down or not available during build
    console.error('Failed to fetch maintenance settings:', error)
  }

  const isUnderMaintenance = [
    effectiveRole === 'student' && maintenanceRoleStudent,
    effectiveRole === 'docente' && maintenanceRoleDocente,
    effectiveRole === 'admin' && maintenanceRoleAdmin,
  ].some(Boolean)

  // sudo is never under maintenance, and we check that it's actually under maintenance before redirecting
  if (isUnderMaintenance && effectiveRole !== 'sudo') {
    const isBypassPath =
      pathname === '/maintenance' ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/_image') ||
      pathname.startsWith('/_astro') ||
      pathname.includes('favicon')

    if (!isBypassPath) return context.redirect('/maintenance')
  }

  if (user) {
    const hasIncompleteProfile = !user.name?.trim() || !user.email?.trim()

    if (hasIncompleteProfile) {
      const isSharedPath =
        pathname === '/' ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_image') ||
        pathname.startsWith('/_astro') ||
        pathname.includes('favicon')

      const isOnboardingFlow =
        pathname.startsWith('/dashboard/onboarding') ||
        pathname.startsWith('/api/user/profile')

      if (!isSharedPath && !isOnboardingFlow) {
        console.log(
          `[Middleware] Redirecting user ${user.id} to onboarding. Missing name/email.`,
        )
        return context.redirect('/dashboard/onboarding')
      }
    }
  }

  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/user') ||
    pathname.startsWith('/api/docente') ||
    pathname.startsWith('/inscripciones') ||
    pathname.startsWith('/api/inscripciones')
  ) {
    if (!user) return context.redirect('/login')
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!user) return context.redirect('/login')
    if (user.role === 'student') return context.redirect('/inscripciones')
  }

  return next()
})
