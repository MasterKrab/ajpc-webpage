import type { APIRoute } from 'astro'
import { db } from '@db/index'
import { users, settings } from '@db/schema'
import { eq } from 'drizzle-orm'
import { deleteSession, isSudo } from '@lib/auth'

export const DELETE: APIRoute = async ({ locals, cookies }) => {
  const user = locals.user
  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  // For security, a sudo user cannot delete their own account from here
  if (isSudo(user)) {
    return Response.json(
      {
        error:
          'Los usuarios Sudo no pueden eliminar su propia cuenta desde el panel.',
      },
      { status: 403 },
    )
  }

  const [accountDeletionSetting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'allow_account_deletion'))

  if (accountDeletionSetting?.value !== 'true') {
    return Response.json(
      { error: 'La eliminación de cuentas está desactivada actualmente.' },
      { status: 403 },
    )
  }

  try {
    await db.delete(users).where(eq(users.id, user.id))

    deleteSession(cookies)

    return Response.json({ success: true })
  } catch (err) {
    console.error('Error al intentar eliminar la cuenta del usuario:', err)
    return Response.json(
      { error: 'Ha ocurrido un error inesperado al eliminar tu cuenta.' },
      { status: 500 },
    )
  }
}
