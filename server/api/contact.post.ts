
import { getDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, phone, email, message } = body

  if (!name || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and message are required'
    })
  }

  const db = getDb()
  
  try {
    const result = await db.query(
      `INSERT INTO contact_messages (name, phone, email, message, created_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [name, phone || '', email || '', message, Date.now()]
    )
    
    return {
      success: true,
      id: result.rows[0].id
    }
  } catch (error) {
    console.error('Failed to save contact message:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
