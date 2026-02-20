import type { APIRoute } from 'astro'
import { db } from '@db/index'
import { users } from '@db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50),
  email: z.string().email({ message: 'Email inválido' }).max(100),
})

export const PATCH: APIRoute = async ({ locals, request }) => {
  const user = locals.user
  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = profileSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    await db
      .update(users)
      .set({
        name: parsed.data.name,
        email: parsed.data.email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return Response.json({ success: true, name: parsed.data.name })
  } catch (error) {
    return Response.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 },
    )
  }
}
