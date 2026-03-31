import { z } from 'zod'
import { router, adminProcedure } from '../../trpc'
import { emailTemplates } from '@db/schema'
import { eq } from 'drizzle-orm'
import sanitizeHtml from 'sanitize-html'

const DEFAULT_EMAIL_TEMPLATES = [
  {
    id: 'approved',
    subject: '¡Inscripción aprobada! — AJPC',
    signature: 'Sistema de Notificaciones AJPC',
    body: `<p>Hola <strong>{{name}}</strong>,</p>
<p>¡Nos alegra informarte que tu inscripción al curso <strong>{{courseName}}</strong> ha sido <strong style="color: #1eca6c;">aprobada</strong>! 🎉</p>
{{feedback}}
<p>Pronto recibirás más información sobre el inicio de clases.</p>
<p>¡Bienvenido/a a la AJPC! 🚀</p>`,
  },
  {
    id: 'rejected',
    subject: 'Actualización de inscripción — AJPC',
    signature: 'Sistema de Notificaciones AJPC',
    body: `<p>Hola <strong>{{name}}</strong>,</p>
<p>Lamentamos informarte que tu inscripción al curso <strong>{{courseName}}</strong> no ha sido aprobada en esta oportunidad.</p>
{{feedback}}
<p>Te invitamos a seguirnos en <a href="https://www.instagram.com/ajprogcomp/" style="color: #116bb1;">@ajprogcomp</a> para estar al tanto de futuras convocatorias.</p>
<p>¡No te desanimes, siempre hay nuevas oportunidades! 💪</p>`,
  },
  {
    id: 'received',
    subject: '¡Inscripción recibida! — AJPC',
    signature: 'Sistema de Notificaciones AJPC',
    body: `<p>Hola <strong>{{name}}</strong>,</p>
<p>Hemos recibido tu inscripción al curso <strong>{{courseName}}</strong> en la Academia Juvenil de Programación Competitiva.</p>
<p>Tu solicitud se encuentra en estado <strong style="color: #f0ad4e;">pendiente de revisión</strong>. Te notificaremos cuando haya una actualización.</p>
<p>¡Gracias por tu interés en la programación competitiva! 💻</p>`,
  },
]

const sanitizeOptions: sanitizeHtml.IOptions = {
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
}

const templateUpdateInputSchema = z.object({
  id: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  signature: z.string().min(1),
})

export const adminTemplatesRouter = router({
  /**
   * Returns all email templates, auto-seeding defaults on first call.
   * Also runs migration fixes for outdated signature values.
   */
  list: adminProcedure.query(async ({ ctx }: { ctx: any }) => {
    let templateList = await ctx.database.select().from(emailTemplates)

    // Auto-seed if the table is empty
    if (templateList.length === 0) {
      for (const defaultTemplate of DEFAULT_EMAIL_TEMPLATES) {
        await ctx.database.insert(emailTemplates).values(defaultTemplate)
      }
      templateList = await ctx.database.select().from(emailTemplates)
    }

    // Migration: fix outdated placeholder signature values
    for (const template of templateList) {
      if (template.signature === 'signature' || !template.signature) {
        await ctx.database
          .update(emailTemplates)
          .set({ signature: 'Sistema de Notificaciones' })
          .where(eq(emailTemplates.id, template.id))
        template.signature = 'Sistema de Notificaciones'
      }
    }

    // Migration: add the received template if it was added after initial seeding
    const hasReceivedTemplate = templateList.some((template: any) => template.id === 'received')
    if (!hasReceivedTemplate) {
      const receivedDefault = DEFAULT_EMAIL_TEMPLATES.find((template: any) => template.id === 'received')!
      await ctx.database.insert(emailTemplates).values(receivedDefault)
      templateList.push({ ...receivedDefault, updatedAt: null })
    }

    return templateList
  }),

  /**
   * Updates an email template's subject, body (sanitized HTML), and signature.
   */
  update: adminProcedure
    .input(templateUpdateInputSchema)
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      const sanitizedBody = sanitizeHtml(input.body, sanitizeOptions)
      const sanitizedSignature = sanitizeHtml(input.signature, {
        allowedTags: [],
        allowedAttributes: {},
      })

      await ctx.database
        .update(emailTemplates)
        .set({
          subject: input.subject,
          body: sanitizedBody,
          signature: sanitizedSignature,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, input.id))

      return { success: true }
    }),
})
