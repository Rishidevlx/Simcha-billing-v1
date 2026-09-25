import crypto from 'crypto'

// Secret key for AES-256 encryption (derived via SHA-256 to ensure exact 32 bytes)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'simcha_billing_enterprise_ai_secret_key_2026_salt_987654'
const KEY = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest()
const IV_LENGTH = 16 // For AES-CBC

/**
 * Encrypts plain text string using AES-256-CBC
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted string format: "iv_hex:encrypted_hex"
 */
export function encrypt(text) {
  if (!text || typeof text !== 'string') return ''
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
  } catch (err) {
    console.error('Encryption error:', err)
    return ''
  }
}

/**
 * Decrypts encrypted string format "iv_hex:encrypted_hex"
 * @param {string} encryptedText - Encrypted ciphertext
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return ''
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) return ''
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    console.error('Decryption error:', err)
    return ''
  }
}

/**
 * Masks an API key for safe client presentation (e.g. gsk_••••••••••••9X72)
 * @param {string} key - Plain text or decrypted API key
 * @returns {string} - Masked representation
 */
export function maskApiKey(key) {
  if (!key || typeof key !== 'string' || key.length < 8) return ''
  const prefix = key.slice(0, 4)
  const suffix = key.slice(-4)
  return `${prefix}${'•'.repeat(Math.min(key.length - 8, 16))}${suffix}`
}
