import { createVerifier } from 'fast-jwt'
import type { H3Event } from 'h3'

const runtimeConfig = useRuntimeConfig()

/**
 * 驗證前端傳來的 app_auth_access_token
 * @param event H3Event
 * @param appId 應用程式 ID
 * @returns 使用者資訊或 null
 */
export const validateAppAuthToken = async (event: H3Event, appId: string) => {
  const token = getHeader(event, 'x-app-auth-token')
  if (!token) return null

  try {
    // 1. JWT 格式與簽章驗證
    // Note: If keys are not set, this might fail. For local dev without keys, we might need to bypass.
    if (runtimeConfig.jwt?.signaturePublicKey) {
        const verifySync = createVerifier({
        algorithms: ['ES256'],
        key: runtimeConfig.jwt.signaturePublicKey,
        })
        const payload = verifySync(token)

        // 2. 檢查 App ID 是否匹配
        if (payload.appId !== appId) {
        throw new Error('App ID mismatch')
        }

        console.log('validateAppAuthToken', payload)
        
        // 3. Skip DB check for standalone version
        // Return payload or mock record
        return {
            ...payload,
            mode: 'production' // Mock mode
        }
    } else {
        // Fallback for local dev without JWT keys
        return { appId, mode: 'development' }
    }
  } catch (e: any) {
    console.error(`[AppAuth] Token validation failed: ${e.message}`)
    return null
  }
}

export default {
  validateAppAuthToken,
}
