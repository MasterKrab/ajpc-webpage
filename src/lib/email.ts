import { SignJWT } from 'jose'
export { wrapTemplate } from '@lib/email-shared'

interface ServiceAccountKey {
  client_email: string
  private_key: string
}

let cachedAccessToken: string | null = null
let tokenExpirationTime: number = 0

const getAccessToken = async (): Promise<string> => {
  if (cachedAccessToken && Date.now() < tokenExpirationTime) {
    return cachedAccessToken
  }

  const keyJson = import.meta.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const senderEmail = import.meta.env.GOOGLE_SENDER_EMAIL

  if (!keyJson || !senderEmail) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SENDER_EMAIL must be set',
    )
  }

  const key: ServiceAccountKey = JSON.parse(keyJson)

  // Construct Google Auth JWT manually via jose to avoid googleapis SDK
  const importedPrivateKey = await importPKCS8(key.private_key, 'RS256')

  const jwt = await new SignJWT({
    iss: key.client_email,
    sub: senderEmail,
    scope: 'https://www.googleapis.com/auth/gmail.send',
    aud: 'https://oauth2.googleapis.com/token',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(importedPrivateKey)

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to obtain access token: ${response.status} ${errorText}`,
    )
  }

  const data = await response.json()
  cachedAccessToken = data.access_token
  // Refresh token 5 minutes before it actually expires
  tokenExpirationTime = Date.now() + (data.expires_in - 300) * 1000

  return cachedAccessToken
}

async function importPKCS8(pem: string, alg: string) {
  // fetch the part of the PEM string between header and footer
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  const pemContents = pem
    .substring(
      pem.indexOf(pemHeader) + pemHeader.length,
      pem.indexOf(pemFooter),
    )
    .replace(/\s/g, '')

  const binaryDer = new Uint8Array(Buffer.from(pemContents, 'base64'))

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    true,
    ['sign'],
  )
}

const buildRawEmail = (to: string, subject: string, html: string): string => {
  const senderEmail = import.meta.env.GOOGLE_SENDER_EMAIL
  const senderName = import.meta.env.GOOGLE_SENDER_NAME || 'AJPC'

  const encodedSubject = Buffer.from(subject).toString('base64')

  const email = [
    `From: ${senderName} <${senderEmail}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${encodedSubject}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n')

  const encodedEmail = Buffer.from(email).toString('base64')

  return encodedEmail.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const accessToken = await getAccessToken()
    if (!accessToken) throw new Error('Could not construct access token')
    const raw = buildRawEmail(to, subject, html)

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gmail API error: ${response.status} ${errorText}`)
    }
  } catch (error) {
    console.error('Error sending email:', error)
  }
}
