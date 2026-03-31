import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { TRPCContext } from './context'

const trpcInstance = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

export const router = trpcInstance.router
export const publicProcedure = trpcInstance.procedure
export const createCallerFactory = trpcInstance.createCallerFactory

/**
 * Middleware that enforces the user is authenticated.
 * Throws UNAUTHORIZED if no user is in context.
 */
const enforceAuthenticated = trpcInstance.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Debes iniciar sesión para realizar esta acción.',
    })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

/**
 * Middleware that enforces the user is a teacher, admin, or sudo.
 */
const enforceTeacher = trpcInstance.middleware(({ ctx, next }) => {
  const user = ctx.user
  const teacherRoles = ['docente', 'admin', 'sudo'] as const
  if (!user || !teacherRoles.includes(user.role as (typeof teacherRoles)[number])) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'No tienes permisos para realizar esta acción.',
    })
  }
  return next({
    ctx: {
      ...ctx,
      user,
    },
  })
})

/**
 * Middleware that enforces the user is an admin or sudo.
 */
const enforceAdmin = trpcInstance.middleware(({ ctx, next }) => {
  const user = ctx.user
  const adminRoles = ['admin', 'sudo'] as const
  if (!user || !adminRoles.includes(user.role as (typeof adminRoles)[number])) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'No tienes permisos para realizar esta acción.',
    })
  }
  return next({
    ctx: {
      ...ctx,
      user,
    },
  })
})

/**
 * Middleware that enforces the user is sudo.
 */
const enforceSudo = trpcInstance.middleware(({ ctx, next }) => {
  const user = ctx.user
  if (!user || user.role !== 'sudo') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'No tienes permisos para realizar esta acción.',
    })
  }
  return next({
    ctx: {
      ...ctx,
      user,
    },
  })
})

export const protectedProcedure = trpcInstance.procedure.use(enforceAuthenticated)
export const teacherProcedure = trpcInstance.procedure.use(enforceTeacher)
export const adminProcedure = trpcInstance.procedure.use(enforceAdmin)
export const sudoProcedure = trpcInstance.procedure.use(enforceSudo)
