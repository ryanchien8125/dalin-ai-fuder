import { pushToSocket } from '~~/server/utils/redis'

/**
 * Socket.IO 串流適配器 (SocketStreamAdapter)
 * 負責透過 Redis Pub/Sub 推送事件給 Socket.IO Server。
 */
export class SocketStreamAdapter {
  constructor(event, options) {
    this.event = event
    this.options = options
    this.sequence = 1
    this.isClosed = false
    this.transformer = null
    this.roomId = `user:conversation:${options.record.conversation.id}` // Use conversation room
  }

  setTransformer(fn) {
    this.transformer = fn
  }

  init(cleanupCallback) {
    // Socket.IO 模式下，HTTP 請求可能會很快結束，
    // 因此不能依賴 HTTP Socket 的 close 事件來做清理 (除非是為了異常中斷處理)
    // 但為了保險起見，我們還是可以監聽，只是清理邏輯可能要判斷是否真的需要中斷任務
    // 在目前的架構下，任務是在背景執行的 (waitUntil)，所以 HTTP req close 不代表任務結束。
    // 因此這裡我們不綁定 HTTP socket close => cleanup。
    // 只有當明確收到 "stop" 指令(未實作) 或 任務完成時才 cleanup。

    // 如果需要監聽客戶端斷線，需透過 Socket.IO 的 disconnect 事件 (這是在另一個 Service 處理)
    // 這裡暫時無法直接監聽 Socket.IO client disconnect。
    // 所以依靠 Workflow 執行結束後的 cleanup。
    
    console.log(`[SocketStreamAdapter] Initialized for room: ${this.roomId}`)
  }

  async push(payload) {
     if (this.isClosed) return
     
     // 1. Transform
     if (this.transformer) {
        const result = await this.transformer(payload)
        if (!result) return
        payload = result
     }

     // 2. ID
     if (!payload.id) {
        payload.id = this.sequence++
     }

     // 3. Emit to Redis
     
     // 解析 JSON Data
     let emitData = payload.data
     try {
         if (typeof emitData === 'string') {
             emitData = JSON.parse(emitData)
         }
     } catch (e) {
         // ignore
     }

     // 轉換 Event Name 以符合前端 useChatSocket 的預期 (message:ack, message:chunk)
     let emitEvent = payload.event
     if (payload.event === 'data') {
         emitEvent = 'message:chunk'
     } else if (payload.event === 'message') {
         if (emitData && emitData.messageId) {
             emitEvent = 'message:ack'
         }
     }

    await pushToSocket(this.roomId, {
        event: emitEvent,
        data: emitData,
        id: payload.id,
        requestId: this.options.requestId
    })
  }

  close() {
      if (this.isClosed) return
      this.isClosed = true
      // createEventStream close sends '[DONE]'? No, it just ends the response.
      // We might want to send a 'done' event?
      // But standard SSE doesn't have a specific explicit "close" frame other than stream end.
      // Implementation choice: do nothing, or emit 'done'.
      this.push({ event: 'done', data: '' }).catch(() => {})
  }
}
