import type { APIRoute } from 'astro'
import { db } from '@db/index'
import { settings } from '@db/schema'
import { isAdmin } from '@lib/auth'

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user
  if (!user || !isAdmin(user)) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const allSettings = await db.select().from(settings)
    // Convert array to object for easier frontend consumption
    const settingsMap = allSettings.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value
        return acc
      },
      {} as Record<string, string>,
    )
    return new Response(JSON.stringify(settingsMap), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user || !isAdmin(user)) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const body = await request.json()
    const updates = Object.entries(body)

    for (const [key, value] of updates) {
      await db
        .insert(settings)
        .values({
          key,
          value: String(value),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            value: String(value),
            updatedAt: new Date(),
          },
        })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
