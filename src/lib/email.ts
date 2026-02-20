import { google } from 'googleapis'
export { wrapTemplate } from '@lib/email-shared'


interface ServiceAccountKey {
  client_email: string
  private_key: string
}

let gmailClient: ReturnType<typeof google.gmail> | null = null

const getGmailClient = () => {
  if (gmailClient) return gmailClient

  const keyJson = import.meta.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const senderEmail = import.meta.env.GOOGLE_SENDER_EMAIL

  if (!keyJson || !senderEmail) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SENDER_EMAIL must be set')
  }

  const key: ServiceAccountKey = JSON.parse(keyJson)

  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: senderEmail,
  })

  gmailClient = google.gmail({ version: 'v1', auth })
  return gmailClient
}

const buildRawEmail = (to: string, subject: string, html: string): string => {
  const senderEmail = import.meta.env.GOOGLE_SENDER_EMAIL
  const senderName = import.meta.env.GOOGLE_SENDER_NAME || 'AJPC'

  const email = [
    `From: ${senderName} <${senderEmail}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n')

  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const gmail = getGmailClient()
    const raw = buildRawEmail(to, subject, html)

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    })
  } catch (error) {
    console.error('Error sending email:', error)
  }
}
