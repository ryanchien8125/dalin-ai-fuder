import { createSigner } from 'fast-jwt'
import { z } from 'zod'

const AuthSchema = z.object({
  code: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, body => AuthSchema.safeParse(body))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: '請輸入驗證碼'
    })
  }

  const { code } = result.data
  const config = useRuntimeConfig()

  if (code !== config.fortune.authCode) {
    throw createError({
      statusCode: 401,
      statusMessage: '驗證碼錯誤'
    })
  }

  // Parse expiresIn to milliseconds
  const parseExpiresIn = (str: string) => {
    const match = str.match(/^(\d+)([dhms])$/)
    if (!match) return 3 * 60 * 1000 // Default 3m
    const val = parseInt(match[1]!)
    const unit = match[2]!
    if (unit === 'd') return val * 24 * 60 * 60 * 1000
    if (unit === 'h') return val * 60 * 60 * 1000
    if (unit === 'm') return val * 60 * 1000
    if (unit === 's') return val * 1000
    return 3 * 60 * 1000
  }

  const expiresInMs = parseExpiresIn(config.fortune.expiresIn)

  const sign = createSigner({
    key: config.fortune.jwtSecret,
    expiresIn: expiresInMs
  })

  // Basic payload
  const token = sign({ role: 'fortune_user' })

  return {
    token,
    expiresIn: expiresInMs
  }
})
