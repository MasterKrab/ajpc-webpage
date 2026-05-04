import crypto from 'node:crypto'
import { OAuth2Client } from 'arctic'

const API_KEY = import.meta.env.CODEFORCES_API_KEY
const SECRET = import.meta.env.CODEFORCES_SECRET_KEY

const CLIENT_ID = import.meta.env.CODEFORCES_CLIENT_ID
const CLIENT_SECRET = import.meta.env.CODEFORCES_CLIENT_SECRET
const REDIRECT_URI = import.meta.env.CODEFORCES_REDIRECT_URI

export const codeforcesOAuth = new OAuth2Client(
  CLIENT_ID ?? '',
  CLIENT_SECRET ?? '',
  REDIRECT_URI ?? '',
)

export const CODEFORCES_AUTHORIZE_URL = 'https://codeforces.com/oauth/authorize'
export const CODEFORCES_TOKEN_URL = 'https://codeforces.com/oauth/token'

export interface CodeforcesContest {
  id: number
  name: string
  type: string
  phase: string
  frozen: boolean
  durationSeconds: number
  startTimeSeconds: number
  relativeTimeSeconds: number
}

export interface CodeforcesSubmission {
  id: number
  contestId?: number
  creationTimeSeconds: number
  relativeTimeSeconds: number
  problem: {
    contestId?: number
    index: string
    name: string
    type: string
    points?: number
    rating?: number
    tags: string[]
  }
  author: {
    contestId?: number
    members: Array<{ handle: string }>
    participantType: string
    ghost: boolean
    startTimeSeconds?: number
  }
  programmingLanguage: string
  verdict?: string
  testset: string
  passedTestCount: number
  timeConsumedMillis: number
  memoryConsumedBytes: number
  points?: number
}

export const codeforcesRequest = async (
  method: string,
  params: Record<string, string | number> = {},
) => {
  if (!API_KEY || !SECRET) {
    throw new Error('Codeforces API keys not configured')
  }

  const time = Math.floor(Date.now() / 1000)
  const allParams: Record<string, string | number> = {
    ...params,
    apiKey: API_KEY,
    time,
  }

  // Sort parameters lexicographically by key, then by value
  const sortedParams = Object.entries(allParams).sort((a, b) => {
    if (a[0] !== b[0]) return a[0].localeCompare(b[0])
    return String(a[1]).localeCompare(String(b[1]))
  })

  const queryString = sortedParams
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  // Generate 6-character random prefix for apiSig using cryptographically secure method
  const rand = crypto.randomBytes(3).toString('hex')

  // Create hash source: rand/methodName?queryString#secret
  const hashSource = `${rand}/${method}?${queryString}#${SECRET}`
  const hash = crypto.createHash('sha512').update(hashSource).digest('hex')
  const apiSig = rand + hash

  const url = `https://codeforces.com/api/${method}?${queryString}&apiSig=${apiSig}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AJPC-Webpage/1.0',
    },
  })

  const text = await response.text()

  try {
    const data = JSON.parse(text)
    if (data.status === 'FAILED') {
      throw new Error(data.comment || 'Codeforces API error')
    }
    return data.result
  } catch (error: any) {
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      if (response.status === 404) {
        throw new Error(
          `Error 404: No se encontró el método o el recurso. Asegúrate de que el ID del grupo sea correcto y que la cuenta de la API Key sea Manager del grupo.`,
        )
      }
      throw new Error(
        `Codeforces devolvió HTML (Status ${response.status}). Verifica tus credenciales.`,
      )
    }

    throw new Error(
      error.message || 'Error al procesar respuesta de Codeforces',
    )
  }
}
