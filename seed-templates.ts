import { db } from './src/db/index.js'
import { emailTemplates } from './src/db/schema.js'

async function seed() {
  console.log('Seeding email templates...')
  
  const templates = [
    {
      id: 'approved',
      subject: '¡Inscripción aprobada! — AJPC',
      body: `<p>Hola <strong>{{name}}</strong>,</p>
<p>¡Nos alegra informarte que tu inscripción al curso <strong>{{courseName}}</strong> ha sido <strong style="color: #1eca6c;">aprobada</strong>! 🎉</p>
{{feedback}}
<p>Pronto recibirás más información sobre el inicio de clases.</p>
<p>¡Bienvenido/a a la AJPC! 🚀</p>`
    },
    {
      id: 'rejected',
      subject: 'Actualización de inscripción — AJPC',
      body: `<p>Hola <strong>{{name}}</strong>,</p>
<p>Lamentamos informarte que tu inscripción al curso <strong>{{courseName}}</strong> no ha sido aprobada en esta oportunidad.</p>
{{feedback}}
<p>Te invitamos a seguirnos en <a href="https://www.instagram.com/ajprogcomp/" style="color: #116bb1;">@ajprogcomp</a> para estar al tanto de futuras convocatorias.</p>
<p>¡No te desanimes, siempre hay nuevas oportunidades! 💪</p>`
    }
  ]

  for (const t of templates) {
    await db.insert(emailTemplates).values(t).onConflictDoUpdate({
      target: emailTemplates.id,
      set: { subject: t.subject, body: t.body }
    })
  }

  console.log('Done!')
}

seed().catch(console.error)
