import { getPool } from '../config/db.js'
import { encrypt, decrypt, maskApiKey } from '../utils/encryption.js'
import { processAiConversation } from '../services/aiProviderService.js'

/**
 * 1. Get AI Configuration (Safe: Masked Key Only)
 */
export async function getAiConfig(req, res) {
  const pool = getPool()
  try {
    const [rows] = await pool.query('SELECT * FROM ai_configs WHERE id = 1 LIMIT 1')
    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        config: {
          is_enabled: true,
          provider: 'groq',
          key_name: '',
          model_name: 'llama-3.3-70b-versatile',
          api_key_configured: false,
          masked_api_key: ''
        }
      })
    }

    const item = rows[0]
    const decryptedKey = item.groq_api_key ? decrypt(item.groq_api_key) : ''

    res.json({
      success: true,
      config: {
        is_enabled: Boolean(item.is_enabled),
        provider: item.provider || 'groq',
        key_name: item.key_name || '',
        model_name: item.model_name || 'llama-3.3-70b-versatile',
        api_key_configured: Boolean(decryptedKey),
        masked_api_key: maskApiKey(decryptedKey)
      }
    })
  } catch (err) {
    console.error('getAiConfig controller error:', err)
    res.status(500).json({ success: false, message: 'Failed to retrieve AI configuration.' })
  }
}

/**
 * 2. Update AI Configuration (Encrypts API key before storage)
 */
export async function updateAiConfig(req, res) {
  const pool = getPool()
  try {
    const { is_enabled, groq_api_key, key_name, model_name, provider } = req.body

    const [existingRows] = await pool.query('SELECT * FROM ai_configs WHERE id = 1 LIMIT 1')
    const current = existingRows[0] || {}

    let encryptedKey = current.groq_api_key || null

    // Only encrypt and update key if user typed a new key (not masked string)
    if (groq_api_key && typeof groq_api_key === 'string' && !groq_api_key.includes('•')) {
      const cleanKey = groq_api_key.trim()
      if (cleanKey.length > 0) {
        encryptedKey = encrypt(cleanKey)
      }
    }

    const enabled = is_enabled !== undefined ? Boolean(is_enabled) : true
    const model = model_name || 'llama-3.3-70b-versatile'
    const prov = provider || 'groq'
    const keyLabel = key_name !== undefined ? key_name : (current.key_name || '')

    await pool.query(`
      INSERT INTO ai_configs (id, provider, groq_api_key, key_name, model_name, is_enabled)
      VALUES (1, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        provider = VALUES(provider),
        groq_api_key = VALUES(groq_api_key),
        key_name = VALUES(key_name),
        model_name = VALUES(model_name),
        is_enabled = VALUES(is_enabled)
    `, [prov, encryptedKey, keyLabel, model, enabled])

    res.json({
      success: true,
      message: 'Virtual Assistant configurations saved securely.',
      config: {
        is_enabled: enabled,
        provider: prov,
        key_name: keyLabel,
        model_name: model,
        api_key_configured: Boolean(encryptedKey),
        masked_api_key: maskApiKey(encryptedKey ? decrypt(encryptedKey) : '')
      }
    })
  } catch (err) {
    console.error('updateAiConfig controller error:', err)
    res.status(500).json({ success: false, message: 'Failed to save AI configuration.' })
  }
}

/**
 * 3. Test AI Connection with Groq
 */
export async function testAiConnection(req, res) {
  const pool = getPool()
  try {
    let keyToTest = req.body.groq_api_key

    // If key not provided in body, use existing decrypted key from DB
    if (!keyToTest || keyToTest.includes('•')) {
      const [rows] = await pool.query('SELECT groq_api_key FROM ai_configs WHERE id = 1 LIMIT 1')
      if (rows && rows[0]?.groq_api_key) {
        keyToTest = decrypt(rows[0].groq_api_key)
      }
    }

    if (!keyToTest) {
      return res.status(400).json({
        success: false,
        message: 'No Groq API key provided. Please enter a valid API key to test.'
      })
    }

    // Lightweight verification request to Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyToTest.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: req.body.model_name || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Reply with the single word "READY"' }],
        max_tokens: 5
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(400).json({
        success: false,
        message: response.status === 401 ? 'Invalid Groq API key.' : `Groq API returned status ${response.status}`,
        details: errorText
      })
    }

    res.json({
      success: true,
      message: 'Groq API connection test successful! Assistant is ready.'
    })
  } catch (err) {
    console.error('testAiConnection error:', err)
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Groq AI service. Please check network connection.'
    })
  }
}

/**
 * 4. Chat with Virtual Assistant Copilot
 */
export async function chatWithAi(req, res) {
  try {
    const { message, conversationHistory } = req.body
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message content is required.' })
    }

    const result = await processAiConversation({
      message,
      conversationHistory
    })

    res.json(result)
  } catch (err) {
    console.error('chatWithAi controller error:', err)
    res.status(500).json({
      success: false,
      text: 'An error occurred while processing your request. Please try again.'
    })
  }
}
