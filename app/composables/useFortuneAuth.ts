export const useFortuneAuth = () => {
  const { t } = useI18n()
  const token = useCookie('fortune_token', {
    maxAge: 60 * 60 * 24 * 7 // Cookie lives longer (7 days), we verify logic content
  })
  
  const config = useRuntimeConfig()
  const isAuthEnabled = computed(() => (config.public as any).fortune?.authEnabled)
  
  // Singleton state (shared across components)
  const isAuthenticated = useState('fortune_is_authenticated', () => false)
  const showAuthModal = useState('fortune_show_auth_modal', () => false)
  const authError = useState('fortune_auth_error', () => '')
  
  let expirationTimer: NodeJS.Timeout | null = null

  const scheduleExpiration = (ms: number) => {
    if (expirationTimer) clearTimeout(expirationTimer)
    if (ms <= 0) {
      handleExpiration()
      return
    }
    console.log(`[FortuneAuth] Scheduling expiration in ${ms}ms`)
    expirationTimer = setTimeout(() => {
      handleExpiration()
    }, ms)
  }

  const handleExpiration = () => {
    isAuthenticated.value = false
    token.value = null
    showAuthModal.value = true
    authError.value = t('fortune.auth.error.expired')
  }

  // Auto-cleanup timer when component unmounts
  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (expirationTimer) clearTimeout(expirationTimer)
    })
  }

  const checkAuth = async () => {
    if (!isAuthEnabled.value) {
      isAuthenticated.value = true
      return true
    }

    if (!token.value) {
      isAuthenticated.value = false
      return false
    }

    try {
      const res = await $fetch<{ valid: boolean, payload: any }>('/api/fortune/verify', {
        method: 'POST',
        body: { token: token.value }
      })
      
      isAuthenticated.value = true
      
      // Calculate remaining time
      if (res.payload?.exp) {
        const remainingMs = (res.payload.exp * 1000) - Date.now()
        scheduleExpiration(remainingMs)
      }
      
      return true
    } catch (e) {
      // Quiet fail on check, just auth false
      isAuthenticated.value = false
      token.value = null
      return false
    }
  }

  const login = async (code: string) => {
    authError.value = ''
    try {
      const res = await $fetch<{ token: string, expiresIn: number }>('/api/fortune/auth', {
        method: 'POST',
        body: { code }
      })
      
      token.value = res.token
      isAuthenticated.value = true
      showAuthModal.value = false
      
      if (res.expiresIn) {
        scheduleExpiration(res.expiresIn)
      }
    } catch (e: any) {
      authError.value = e.data?.statusMessage || t('fortune.auth.error.failed')
      throw e
    }
  }
  
  const logout = () => {
    token.value = null
    isAuthenticated.value = false
    if (expirationTimer) clearTimeout(expirationTimer)
  }

  return {
    isAuthenticated,
    showAuthModal,
    authError,
    isAuthEnabled,
    checkAuth,
    login,
    logout
  }
}
