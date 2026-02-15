import crypto from 'crypto'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * 從指定字元集隨機選擇字元
 * @param {number} length - 要產生幾個字元
 * @param {string} charset - 可選字元集（預設為 a-zA-Z0-9）
 * @returns {string}
 */
export const generateApiKey = (length = 32, charset = ALPHABET) => {
  const bytes = crypto.randomBytes(length)
  const chars = Array.from(bytes, byte => charset[byte % charset.length])
  return chars.join('')
}

export const generateToken = (length = 128, charset = ALPHABET) => {
  const bytes = crypto.randomBytes(length)
  const chars = Array.from(bytes, byte => charset[byte % charset.length])
  return chars.join('')
}
