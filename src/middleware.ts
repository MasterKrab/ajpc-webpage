import { defineMiddleware } from 'astro:middleware'
import { validateSession } from '@lib/auth'

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null

  try {
    const user = await validateSession(context.cookies)
    context.locals.user = user
  } catch {
    // DB not available during prerendering — skip session validation
  }

  const { pathname } = context.url
  const user = context.locals.user

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
