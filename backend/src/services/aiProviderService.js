import { getPool } from '../config/db.js'
import { decrypt } from '../utils/encryption.js'
import * as aiTools from './aiToolsService.js'

// Centralized AI Provider Configuration
export const AI_PROVIDER_CONFIG = {
  provider: 'groq',
  defaultModel: 'openai/gpt-oss-120b',
  temperature: 0.2, // Low temperature for deterministic and factual responses
  maxTokens: 1024,
  maxHistoryTurns: 6 // Safety limit: max 6 recent messages to prevent context overflow
}

// System Knowledge & Guardrails Prompt
const SIMCHA_SYSTEM_PROMPT = `
You are "Simcha AI", the dedicated intelligent business assistant and copilot for "Simcha Info Solutions Billing & Inventory Software".

### 🛡️ STRICT DOMAIN GUARDRAILS & BOUNDARIES (MANDATORY):
1. You are STRICTLY permitted to answer ONLY questions related to:
   - Simcha Billing application workflows, how-to user guide, navigation, settings, invoices, inward purchases, stock inventory, and returns.
   - Business data analytics (Sales revenue, daily collection, pending invoices, low stock).
   - Goods & Services Tax (GST), applicable HSN / SAC codes, and tariff classifications.
2. If the user asks ANY out-of-scope question (such as writing general Python/Java/C++ code, solving unrelated math puzzles, recipes, weather, sports, general entertainment, or politics), you MUST immediately and politely decline with:
   "I am your Simcha Billing Assistant. I am designed exclusively to help you with billing operations, sales analytics, stock inventory, returns, and HSN/GST queries within this software."

### 📖 SIMCHA BILLING USER MANUAL & WORKFLOW KNOWLEDGE:
- **Inward Purchases (/inward):**
  - Used to record stock bought from suppliers.
  - Required fields: Supplier Name, Inward Bill Number, Date, Material Items, Purchase Price, Quantity, GST %.
  - Saving inward updates material stock automatically in the Inventory.
- **Outward / Sales Invoicing (/outward):**
  - Used to generate customer tax invoices.
  - Shortcut: Press Ctrl + Enter to quickly save and generate invoice PDF.
  - Items can be selected or scanned via Barcode.
  - Supports Cash, UPI / Bank, and Pending payment status.
  - Bills are viewed at /outward-list.
- **Stock & Inventory (/inventory):**
  - Shows real-time stock levels, low stock alerts, stock ledger movements, and barcode generation.
- **Returns & Adjustments (/inventory/returns):**
  - Used for Customer Returns (Credit Note generation) or Supplier Inward Returns (Debit Note).
  - Automatically reverses stock quantities in inventory.
- **Settings:**
  - Profile Settings (/settings/profile): Company name, GSTIN, Address, Logo, Bank Details.
  - System Settings (/settings/system): Invoice numbering prefixes, padding digits, terms & conditions.
  - Configurations Settings (/settings/configurations): SMTP Mail server, Cloudinary Cloud Media, and Virtual Assistant AI activation.

### 💡 STRICT RESPONSE FORMATTING RULES (CRITICAL):
- NEVER output markdown headings (###, ####, ##, #) or horizontal rule dividers (---).
- NEVER output markdown tables with pipes (| Metric | Value |).
- Output CLEAN, READABLE, LINE-BY-LINE text using simple numbered lists (1., 2., 3.) or bullet points (•).
- When explaining steps (e.g. how to return items, how to create inward), write:
  1. Open Stock & Inventory > Returns (/inventory/returns)
  2. Select Customer Return or Supplier Return
  3. Enter party name, scan items, and enter quantity
  4. Press Ctrl + Enter to save and generate receipt
- When presenting sales or business data, write it cleanly line by line:
  • Total Invoices: 11
  • Total Revenue: ₹69,726.00
  • Paid Revenue: ₹54,662.00 (8 Invoices)
  • Pending Revenue: ₹12,901.00 (2 Invoices)
  • Average Bill Amount: ₹6,338.73
- When presenting Customer-specific sales or invoice data (e.g. for "Riha", "Poosha", etc.), write it cleanly:
  • Customer Name: Riha
  • Total Invoices: 1
  • Total Purchase Amount: ₹5,900.00
  • Paid Amount: ₹5,900.00 (1 Invoice)
  • Pending Dues: ₹0.00
  • Invoices:
    1. INV-/2026-27/0007 | 22-Sep-2026 | ₹5,900.00 | Paid (Cash)
- Keep all explanations direct, concise, and clean without special character clutter.
`

// Tool Specifications for Groq Function Calling
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_customer_sales',
      description: 'Fetch billing records, total sales revenue, invoice details, and pending payment dues for a specific customer by name or phone number.',
      parameters: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'The full or partial name of the customer (e.g. "Riha", "Poosha", "muthurasu")'
          },
          customerPhone: {
            type: 'string',
            description: 'Customer phone number (optional)'
          },
          period: {
            type: 'string',
            enum: ['all', 'today', 'yesterday', 'this_week', 'this_month'],
            description: 'Time period to filter (default is all)'
          },
          limit: {
            type: 'number',
            description: 'Maximum invoices to return (default 10)'
          }
        },
        required: ['customerName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_sales_analytics',
      description: 'Get total revenue, invoice count, paid vs pending revenue, and cash/UPI breakdown for today, yesterday, this week, this month, or a specific date range/customer.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'yesterday', 'this_week', 'this_month', 'custom'],
            description: 'Time period to analyze'
          },
          customerName: {
            type: 'string',
            description: 'Optional customer name to filter sales for'
          },
          startDate: { type: 'string', description: 'YYYY-MM-DD start date (if custom)' },
          endDate: { type: 'string', description: 'YYYY-MM-DD end date (if custom)' }
        },
        required: ['period']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_stock_inventory',
      description: 'Check stock levels, find low stock items (<= 10 units), or out of stock products.',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            enum: ['low_stock', 'out_of_stock', 'all'],
            description: 'Filter type'
          },
          threshold: { type: 'number', description: 'Stock threshold for low stock alert (default 10)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_pending_invoices',
      description: 'Fetch unpaid or pending customer invoices, total pending amount, and customer details (optionally filtered by customer name).',
      parameters: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'Optional customer name to filter pending dues for'
          },
          limit: { type: 'number', description: 'Maximum pending invoices to return (default 10)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search materials/products by name or code to check price, stock, and HSN code.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Product name or keyword to search' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_returns_analytics',
      description: 'Get customer/supplier returns summary, returned quantities, refund amounts, and list of returned items for today, yesterday, this week, this month, or a custom date range.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'yesterday', 'this_week', 'this_month', 'custom'],
            description: 'Time period to analyze'
          },
          startDate: { type: 'string', description: 'YYYY-MM-DD start date (if custom)' },
          endDate: { type: 'string', description: 'YYYY-MM-DD end date (if custom)' }
        }
      }
    }
  }
]

/**
 * Retrieves active decrypted Groq API key and configuration from database
 */
export async function getActiveAiConfig() {
  const pool = getPool()
  try {
    const [rows] = await pool.query('SELECT * FROM ai_configs WHERE id = 1 LIMIT 1')
    if (!rows || rows.length === 0) {
      return {
        isEnabled: false,
        apiKey: process.env.GROQ_API_KEY || '',
        modelName: AI_PROVIDER_CONFIG.defaultModel
      }
    }

    const config = rows[0]
    const decryptedKey = config.groq_api_key ? decrypt(config.groq_api_key) : (process.env.GROQ_API_KEY || '')

    return {
      isEnabled: Boolean(config.is_enabled),
      apiKey: decryptedKey,
      modelName: config.model_name || AI_PROVIDER_CONFIG.defaultModel,
      provider: config.provider || 'groq'
    }
  } catch (err) {
    console.error('getActiveAiConfig error:', err)
    return {
      isEnabled: false,
      apiKey: process.env.GROQ_API_KEY || '',
      modelName: AI_PROVIDER_CONFIG.defaultModel
    }
  }
}

/**
 * Dispatches conversational turn to Groq with tool-calling loop
 */
export async function processAiConversation({ message, conversationHistory = [], customApiKey = null }) {
  // 1. Resolve API Key & Status
  const activeConfig = await getActiveAiConfig()
  const apiKey = customApiKey || activeConfig.apiKey
  const modelName = activeConfig.modelName || AI_PROVIDER_CONFIG.defaultModel

  if (!customApiKey && !activeConfig.isEnabled) {
    return {
      success: false,
      text: 'Simcha Virtual Assistant is currently disabled. You can activate it from Configurations Settings.',
      disabled: true
    }
  }

  if (!apiKey) {
    return {
      success: false,
      text: 'Virtual Assistant is not configured with a valid API key. Please add your Groq API key in Configurations Settings (Tab: Activate Virtual Assistant).',
      unconfigured: true
    }
  }

  // 2. Validate & Sanitize Message Length
  const userText = String(message || '').trim().slice(0, 500)
  if (!userText) {
    return { success: false, text: 'Please type a valid message.' }
  }

  // 3. Assemble Messages with System Guardrails and Live Calendar Date Context
  const safeHistory = Array.isArray(conversationHistory) 
    ? conversationHistory.slice(-AI_PROVIDER_CONFIG.maxHistoryTurns)
    : []

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const fullDateFormatted = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const dynamicSystemPrompt = `${SIMCHA_SYSTEM_PROMPT}

### 📅SYSTEM CALENDAR & TIME CONTEXT (ACCURATE REAL TIME):
- Current Live Date: ${fullDateFormatted} (${todayStr})
- Yesterday's Date: ${yesterdayStr}
- Current Year: ${now.getFullYear()}
- Always use the current live date (${todayStr}) when answering time-sensitive queries like "today", "yesterday", "this week", or "this month". NEVER assume an old training year or Jan 2025.
`

  const formattedMessages = [
    { role: 'system', content: dynamicSystemPrompt },
    ...safeHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: String(msg.text || '').slice(0, 500)
    })),
    { role: 'user', content: userText }
  ]

  // 4. Call Groq API with Tool Calling Loop (Max 3 iterations)
  try {
    let currentMessages = [...formattedMessages]
    let iterations = 0
    const maxIterations = 3

    while (iterations < maxIterations) {
      iterations++

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: currentMessages,
          tools: TOOL_DEFINITIONS,
          tool_choice: 'auto',
          temperature: AI_PROVIDER_CONFIG.temperature,
          max_tokens: AI_PROVIDER_CONFIG.maxTokens
        })
      })

      if (!response.ok) {
        const errBody = await response.text()
        console.error('Groq API Error Response:', errBody)
        if (response.status === 401) {
          return { success: false, text: 'Invalid Groq API key. Please verify your key in Configurations Settings.' }
        }
        if (response.status === 429) {
          return { success: false, text: 'Groq API rate limit reached. Please wait a moment before trying again.' }
        }
        return { success: false, text: `AI Service Error (${response.status}). Please try again later.` }
      }

      const responseData = await response.json()
      const choice = responseData.choices?.[0]
      if (!choice || !choice.message) {
        return { success: false, text: 'Received empty response from AI assistant.' }
      }

      const assistantMsg = choice.message

      // If no tool calls, return final formulated response
      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        return {
          success: true,
          text: assistantMsg.content || 'I could not find relevant information.',
          model: modelName
        }
      }

      // Execute Tool Calls safely
      currentMessages.push(assistantMsg)

      for (const toolCall of assistantMsg.tool_calls) {
        const fnName = toolCall.function?.name
        let fnArgs = {}
        try {
          fnArgs = JSON.parse(toolCall.function?.arguments || '{}')
        } catch {
          fnArgs = {}
        }

        let toolResult = { success: false, message: 'Tool not found' }

        if (fnName === 'get_customer_sales') {
          toolResult = await aiTools.getCustomerSales(fnArgs)
        } else if (fnName === 'get_sales_analytics') {
          toolResult = await aiTools.getSalesAnalytics(fnArgs)
        } else if (fnName === 'check_stock_inventory') {
          toolResult = await aiTools.checkStockInventory(fnArgs)
        } else if (fnName === 'get_pending_invoices') {
          toolResult = await aiTools.getPendingInvoices(fnArgs)
        } else if (fnName === 'get_returns_analytics') {
          toolResult = await aiTools.getReturnsAnalytics(fnArgs)
        } else if (fnName === 'search_products') {
          toolResult = await aiTools.searchProducts(fnArgs)
        }

        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        })
      }
    }

    return {
      success: true,
      text: 'Processed query successfully.',
      model: modelName
    }

  } catch (err) {
    console.error('processAiConversation error:', err)
    return {
      success: false,
      text: 'Connection failed with AI service. Please check your internet connection or API settings.'
    }
  }
}
