import type { APIRoute } from 'astro'
import { isAdmin, isSudo } from '@lib/auth'
import { db } from '@db/index'
import { inviteCodes, users } from '@db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  let query = db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt))
  
  // If not sudo, only see own invites
  if (!isSudo(user)) {
    // @ts-ignore - drizzle query builder typing can be tricky with filters
    query = query.where(eq(inviteCodes.createdBy, user.id))
  }

  const result = await query
  return Response.json(result)
}

const createInviteSchema = z.object({
  role: z.enum(['student', 'docente', 'admin']),
})

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user!
  
  if (!isAdmin(user)) 
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  

  const body = await request.json()
  const parsed = createInviteSchema.safeParse(body)
  
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { role } = parsed.data

  // Permission check: only sudo can create admin invites
  if (role === 'admin' && !isSudo(user)) {
    return Response.json({ error: 'Solo sudo puede crear admins' }, { status: 403 })
  }

  const code = randomBytes(8).toString('hex')

  await db.insert(inviteCodes).values({
    code,
    role,
    createdBy: user.id,
  })

  return Response.json({ code, role })
}

export const DELETE: APIRoute = async ({ locals, request }) => {
  const user = locals.user!

  if (!isAdmin(user)) 
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  

  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return Response.json({ error: 'Falta el código' }, { status: 400 })
  }

  // Permission check:
  // If sudo, can delete any invite
  // If not sudo, can only delete own invites
  
  const [invite] = await db
    .select()
    .from(inviteCodes)
    .where(eq(inviteCodes.code, code))

  if (!invite) 
    return Response.json({ error: 'Invitación no encontrada' }, { status: 404 })
  

  if (!isSudo(user) && invite.createdBy !== user.id)
    return Response.json({ error: 'No autorizado para eliminar esta invitación' }, { status: 403 })


  await db.delete(inviteCodes).where(eq(inviteCodes.code, code))

  return new Response(null, { status: 204 })
}
