import type { APIRoute } from 'astro'
import { isAdmin } from '@lib/auth'
import { db } from '@db/index'
import { emailTemplates } from '@db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import sanitizeHtml from 'sanitize-html'

const DEFAULT_TEMPLATES = [
  {
    id: 'approved',
    subject: '¡Inscripción aprobada! — AJPC',
    signature: 'Sistema de Notificaciones AJPC',
    body: `<p>Hola <strong>{{name}}</strong>,</p>
<p>¡Nos alegra informarte que tu inscripción al curso <strong>{{courseName}}</strong> ha sido <strong style="color: #1eca6c;">aprobada</strong>! 🎉</p>
{{feedback}}
<p>Pronto recibirás más información sobre el inicio de clases.</p>
<p>¡Bienvenido/a a la AJPC! 🚀</p>`
  },
  {
    id: 'rejected',
    subject: 'Actualización de inscripción — AJPC',
    signature: 'Sistema de Notificaciones AJPC',
    body: `<p>Hola <strong>{{name}}</strong>,</p>
<p>Lamentamos informarte que tu inscripción al curso <strong>{{courseName}}</strong> no ha sido aprobada en esta oportunidad.</p>
{{feedback}}
<p>Te invitamos a seguirnos en <a href="https://www.instagram.com/ajprogcomp/" style="color: #116bb1;">@ajprogcomp</a> para estar al tanto de futuras convocatorias.</p>
<p>¡No te desanimes, siempre hay nuevas oportunidades! 💪</p>`
  },
  {
    id: 'received',
    subject: '¡Inscripción recibida! — AJPC',
    signature: 'Sistema de Notificaciones AJPC',
    body: `<p>Hola <strong>{{name}}</strong>,</p>
<p>Hemos recibido tu inscripción al curso <strong>{{courseName}}</strong> en la Academia Juvenil de Programación Competitiva.</p>
<p>Tu solicitud se encuentra en estado <strong style="color: #f0ad4e;">pendiente de revisión</strong>. Te notificaremos cuando haya una actualización.</p>
<p>¡Gracias por tu interés en la programación competitiva! 💻</p>`
  }
]

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  let templates = await db.select().from(emailTemplates)

  // Auto-seed if empty
  if (templates.length === 0) {
    for (const template of DEFAULT_TEMPLATES) 
      await db.insert(emailTemplates).values(template)
    
    templates = await db.select().from(emailTemplates)
  }

  for (const template of templates) {
    if (template.signature === 'signature' || !template.signature) {
      await db.update(emailTemplates).set({ signature: 'Sistema de Notificaciones' }).where(eq(emailTemplates.id, template.id))
      template.signature = 'Sistema de Notificaciones'
    }
  }

  if (!templates.find(template => template.id === 'received')) {
    const receivedDefault = DEFAULT_TEMPLATES.find(template => template.id === 'received')!
    await db.insert(emailTemplates).values(receivedDefault)
    templates.push({ ...receivedDefault, updatedAt: null })
  }

  return Response.json(templates)
}

const templateSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  signature: z.string().min(1),
})

export const PATCH: APIRoute = async ({ locals, request, url }) => {
  const user = locals.user!
  if (!isAdmin(user)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const id = url.searchParams.get('id')
  if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

  const body = await request.json()
  const parsed = templateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { subject, body: htmlBody, signature } = parsed.data

  const cleanBody = sanitizeHtml(htmlBody, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'h1',
      'h2',
      'h3',
      'u',
      'span',
      'div',
      'style',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['style', 'class', 'id', 'width', 'height'],
      a: ['href', 'name', 'target'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    },
  })

  const cleanSignature = sanitizeHtml(signature, {
    allowedTags: [], // Strip all tags for signature to be safe, or allow basic formatting
    allowedAttributes: {},
  })

  await db
    .update(emailTemplates)
    .set({
      subject,
      body: cleanBody,
      signature: cleanSignature,
      updatedAt: new Date(),
    })
    .where(eq(emailTemplates.id, id))

  return Response.json({ success: true })
}
