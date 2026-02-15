// composables/useChatSocket.ts
import { io } from 'socket.io-client'

export const useChatSocket = () => {
  const socket = ref()
  // IDLE, CONNECTING, CONNECTED, DISCONNECTED, FAILED
  const status = ref('IDLE')
  const socketOptions = ref<any>({})

  const connect = () => {
    if (socket.value) {
      status.value = 'CONNECTING'
      socket.value.connect()
    }
  }

  const initSocket = async (options: any) => {
    socketOptions.value = options
    try {
      if (socket.value) {
        socket.value.disconnect()
        socket.value.removeAllListeners()
        socket.value = null
      }

      // 1. 先向 Nuxt 拿入場券 (已改用 getToken Callback)
      // const { token } = await $fetch('/api/auth/socket-token')

      // 2. 連線 Socket Server
      // 注意：GCP Cloud Run 會自動處理 SSL 憑證
      // 只要網址是 https://...，Socket.io 就會自動走 WSS 協議
      const socketUrl = process.env['SOCKET_SERVER_HOST']

      status.value = 'CONNECTING'

      socket.value = io(socketUrl, {
        transports: ['websocket'],
        forceNew: true, // 強制建立新連線，確保重連參數生效
        reconnection: true,
        reconnectionAttempts: 5, // 最多重試 5 次，避免無限重連
        reconnectionDelay: 1000, // 初始延遲 1 秒
        reconnectionDelayMax: 5000, // 最大延遲 5 秒 (指數遞增)
        timeout: 20000, // 連線超時設定
        auth: (cb) => {
          // 每次連線或重連時，呼叫 getToken 取得最新的 Token
          if (options.getToken) {
             options.getToken().then((token: any) => {
              cb({ token })
            }).catch((err: any) => {
              console.error('無法取得 Socket Token', err)
              // 如果無法取得 Token，可能需要視為認證失敗，這裡暫時不回傳 token
               cb({ token: null })
            })
          } else {
             cb({ token: options.auth?.token })
          }
        },
      })

      socket.value.on('connect_error', (err: any) => {
        console.error('連線認證失敗:', err.message)
      })

      socket.value.on('connect', () => {
        console.log('安全連線成功')
        status.value = 'CONNECTED'
      })

      socket.value.on('disconnect', (reason: any) => {
        console.warn('Socket 斷線:', reason)
        status.value = 'DISCONNECTED'
        if (reason === 'io server disconnect') {
          // 如果是 Server 主動斷線，通常不自動重連，或需手動處理
        }
      })

      // 使用 Manager (socket.io) 層級的事件監聽，確保重連狀態能正確觸發
      socket.value.io.on('reconnect_attempt', (attempt: any) => {
        console.log(`嘗試重新連線 #${attempt}`)
        status.value = 'CONNECTING'
      })

      socket.value.io.on('reconnect_error', (err: any) => {
        console.error('重新連線發生錯誤:', err.message)
      })

      socket.value.io.on('reconnect_failed', () => {
        console.error('重新連線失敗，請檢查網路狀況')
        status.value = 'FAILED'
      })
    } catch (e) {
      console.error('Socket 初始化錯誤', e)
      status.value = 'FAILED'
    }
  }

  const switchUserConversation = async (conversationId: string) => {
    const appConfigStore = useAppConfigStore()
    
    if (socket.value && status.value === 'CONNECTED') {
      try {
        console.log('Requesting switch token for:', conversationId)
        
        // 1. Get Switch Token from API
        const { token } = await $fetch<any>('/api/v1/service/socket/switch-token', {
           method: 'POST',
           headers: {
             'x-app-chat-user-token': appConfigStore.getChatUserToken() || ''
           },
           body: { conversationId }
        })

        // 2. Emit join with token
        console.log('Switching conversation with token...')
        socket.value.emit('user:conversation:join', { token })
        
      } catch (e) {
        console.error('Failed to switch conversation:', e)
      }
    } else {
       console.warn('Socket not connected, cannot switch conversation')
    }
  }

  return { initSocket, socket, status, connect, switchUserConversation }
}
