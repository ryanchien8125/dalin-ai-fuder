import { createVerifier } from 'fast-jwt'
import { z } from 'zod'

const VerifySchema = z.object({
  token: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, body => VerifySchema.safeParse(body))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token required'
    })
  }

  const config = useRuntimeConfig()
  const verify = createVerifier({ key: config.fortune.jwtSecret })

  try {
    const payload = verify(result.data.token)
    return {
      valid: true,
      payload
    }
  } catch (e) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token expired or invalid'
    })
  }
})
