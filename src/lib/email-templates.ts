import { wrapTemplate } from './email-shared'


const wrap = (title: string, body: string) => 
  wrapTemplate(`
    <h2 style="color: #116bb1; margin-top: 0;">${title}</h2>
    ${body}
  `)


export const enrollmentConfirmation = (name: string, courseName: string) =>
  wrap(
    '¡Inscripción recibida! 🎉',
    `
    <p>Hola <strong>${name}</strong>,</p>
    <p>Hemos recibido tu inscripción al curso <strong>${courseName}</strong> en la Academia Juvenil de Programación Competitiva.</p>
    <p>Tu solicitud se encuentra en estado <strong style="color: #f0ad4e;">pendiente de revisión</strong>. Te notificaremos cuando haya una actualización.</p>
    <p>¡Gracias por tu interés en la programación competitiva! 💻</p>
  `,
  )

export const enrollmentApproved = (
  name: string,
  courseName: string,
  feedback?: string,
) =>
  wrap(
    '¡Inscripción aprobada! ✅',
    `
    <p>Hola <strong>${name}</strong>,</p>
    <p>¡Nos alegra informarte que tu inscripción al curso <strong>${courseName}</strong> ha sido <strong style="color: #1eca6c;">aprobada</strong>! 🎉</p>
    ${feedback ? `<p><strong>Comentarios:</strong> ${feedback}</p>` : ''}
    <p>Pronto recibirás más información sobre el inicio de clases.</p>
    <p>¡Bienvenido/a a la AJPC! 🚀</p>
  `,
  )

export const enrollmentRejected = (
  name: string,
  courseName: string,
  feedback?: string,
) =>
  wrap(
    'Actualización de inscripción',
    `
    <p>Hola <strong>${name}</strong>,</p>
    <p>Lamentamos informarte que tu inscripción al curso <strong>${courseName}</strong> no ha sido aprobada en esta oportunidad.</p>
    ${feedback ? `<p><strong>Motivo:</strong> ${feedback}</p>` : ''}
    <p>Te invitamos a seguirnos en <a href="https://www.instagram.com/ajprogcomp/" style="color: #116bb1;">@ajprogcomp</a> para estar al tanto de futuras convocatorias.</p>
    <p>¡No te desanimes, siempre hay nuevas oportunidades! 💪</p>
  `,
  )
