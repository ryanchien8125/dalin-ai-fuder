import { createClient } from 'redis'
import { Emitter } from '@socket.io/redis-emitter'

const runtimeConfig = useRuntimeConfig()

// 建立一個全域的 Redis Publisher
const redisClient = createClient({
  socket: {
    host: runtimeConfig.socket.valkey.host,
    port: Number(runtimeConfig.socket.valkey.port),
  },
})

redisClient.on('error', (err) => console.error('Redis Client Error', err))
redisClient.connect()

const io = new Emitter(redisClient) // 這裡的 io 只有發送功能

export const pushToSocket = async (roomId: string, data: any) => {
  try {
    io.to(roomId).emit('message', { ...data })
  } catch (e) {
    console.error('Socket emit error:', e)
  }
}
