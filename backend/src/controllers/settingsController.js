import { getPool } from '../config/db.js'

// Get System Settings (Company info, Bank details, Terms, Tax rates, Theme)
export async function getSettings(req, res) {
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1 LIMIT 1')

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Settings not configured yet.'
      })
    }

    const settings = rows[0]
    
    // Parse terms_conditions if it's JSON or string
    let parsedTerms = []
    if (typeof settings.terms_conditions === 'string') {
      try {
        parsedTerms = JSON.parse(settings.terms_conditions)
      } catch (e) {
        parsedTerms = settings.terms_conditions.split('\n').filter(Boolean)
      }
    } else if (Array.isArray(settings.terms_conditions)) {
      parsedTerms = settings.terms_conditions
    }

    // Parse theme_config if it's JSON string
    let parsedTheme = null
    if (settings.theme_config) {
      if (typeof settings.theme_config === 'string') {
        try {
          parsedTheme = JSON.parse(settings.theme_config)
        } catch (e) {
          parsedTheme = null
        }
      } else if (typeof settings.theme_config === 'object') {
        parsedTheme = settings.theme_config
      }
    }

    return res.status(200).json({
      success: true,
      settings: {
        ...settings,
        terms_conditions: parsedTerms,
        theme_config: parsedTheme
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch settings from database.'
    })
  }
}

let isSettingsSchemaEnsured = false

async function ensureSettingsColumns(pool) {
  if (isSettingsSchemaEnsured) return

  const alterStatements = [
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS bank_image_url LONGTEXT NULL;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_url LONGTEXT NULL;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS return_days INT DEFAULT 7;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS return_policy_clause TEXT NULL;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS due_date_days INT DEFAULT 15;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS invoice_month VARCHAR(20) DEFAULT 'AUTO';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS invoice_financial_year VARCHAR(20) DEFAULT '2026-27';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS invoice_starting_number INT DEFAULT 1;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS invoice_padding_digits INT DEFAULT 4;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS invoice_separator VARCHAR(10) DEFAULT '/';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_prefix VARCHAR(50) DEFAULT 'SIS-REC';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_month VARCHAR(20) DEFAULT 'AUTO';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_financial_year VARCHAR(20) DEFAULT '2026-27';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_starting_number INT DEFAULT 1;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_padding_digits INT DEFAULT 4;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_separator VARCHAR(10) DEFAULT '/';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS service_prefix VARCHAR(50) DEFAULT 'SIS-SR';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS service_month VARCHAR(20) DEFAULT 'AUTO';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS service_financial_year VARCHAR(20) DEFAULT '2026-27';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS service_starting_number INT DEFAULT 1;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS service_padding_digits INT DEFAULT 4;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS service_separator VARCHAR(10) DEFAULT '/';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS return_prefix VARCHAR(50) DEFAULT 'SIS-RET';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS return_month VARCHAR(20) DEFAULT 'AUTO';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS return_financial_year VARCHAR(20) DEFAULT '2026-27';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS return_starting_number INT DEFAULT 1;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS return_padding_digits INT DEFAULT 4;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS return_separator VARCHAR(10) DEFAULT '/';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS credit_note_prefix VARCHAR(50) DEFAULT 'SIS-CN';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS credit_note_month VARCHAR(20) DEFAULT 'AUTO';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS credit_note_financial_year VARCHAR(20) DEFAULT '2026-27';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS credit_note_starting_number INT DEFAULT 1;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS credit_note_padding_digits INT DEFAULT 4;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS credit_note_separator VARCHAR(10) DEFAULT '/';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS quotation_prefix VARCHAR(50) DEFAULT 'SIS-QTN';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS quotation_month VARCHAR(20) DEFAULT 'AUTO';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS quotation_financial_year VARCHAR(20) DEFAULT '2026-27';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS quotation_starting_number INT DEFAULT 1;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS quotation_padding_digits INT DEFAULT 4;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS quotation_separator VARCHAR(10) DEFAULT '/';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS quotation_validity_days INT DEFAULT 15;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS primary_color VARCHAR(50) DEFAULT '#043486';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(50) DEFAULT '#0248BC';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50) DEFAULT '#3B82F6';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS sidebar_theme VARCHAR(50) DEFAULT 'dark';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS logo_url LONGTEXT NULL;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS favicon_url LONGTEXT NULL;",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS invoice_accent_color VARCHAR(50) DEFAULT '#043486';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS invoice_header_style VARCHAR(50) DEFAULT 'banner';",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS theme_config JSON NULL;"
  ]

  for (const sql of alterStatements) {
    try {
      await pool.query(sql)
    } catch {
      try {
        await pool.query(sql.replace('IF NOT EXISTS ', ''))
      } catch {}
    }
  }

  isSettingsSchemaEnsured = true
}

// Update System Settings (Supports section-specific or full updates)
export async function updateSettings(req, res) {
  try {
    const pool = getPool()
    await ensureSettingsColumns(pool)

    const allowedFields = [
      'company_name', 'address', 'phone', 'email', 'gstin',
      'bank_name', 'account_name', 'account_no', 'ifsc_code', 'branch',
      'bank_image_url', 'signature_url', 'terms_conditions',
      'return_days', 'return_policy_clause', 'due_date_days',
      'cgst_rate', 'sgst_rate', 'igst_rate',
      'invoice_prefix', 'invoice_month', 'invoice_financial_year', 'invoice_starting_number', 'invoice_padding_digits', 'invoice_separator',
      'receipt_prefix', 'receipt_month', 'receipt_financial_year', 'receipt_starting_number', 'receipt_padding_digits', 'receipt_separator',
      'service_prefix', 'service_month', 'service_financial_year', 'service_starting_number', 'service_padding_digits', 'service_separator',
      'return_prefix', 'return_month', 'return_financial_year', 'return_starting_number', 'return_padding_digits', 'return_separator',
      'credit_note_prefix', 'credit_note_month', 'credit_note_financial_year', 'credit_note_starting_number', 'credit_note_padding_digits', 'credit_note_separator',
      'quotation_prefix', 'quotation_month', 'quotation_financial_year', 'quotation_starting_number', 'quotation_padding_digits', 'quotation_separator', 'quotation_validity_days',
      'primary_color', 'secondary_color', 'accent_color', 'sidebar_theme',
      'logo_url', 'favicon_url', 'invoice_accent_color', 'invoice_header_style', 'theme_config'
    ]

    // Ensure row id = 1 exists in settings
    const [existing] = await pool.query('SELECT id FROM settings WHERE id = 1 LIMIT 1')
    if (existing.length === 0) {
      await pool.query('INSERT INTO settings (id) VALUES (1)')
    }

    const updates = []
    const values = []

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        let val = req.body[key]
        if (key === 'terms_conditions') {
          val = Array.isArray(val) ? JSON.stringify(val) : (typeof val === 'string' ? val : '[]')
        } else if (key === 'theme_config') {
          val = typeof val === 'object' && val !== null ? JSON.stringify(val) : val
        } else if (['return_days', 'due_date_days', 'quotation_validity_days', 'invoice_starting_number', 'invoice_padding_digits', 'receipt_starting_number', 'receipt_padding_digits', 'service_starting_number', 'service_padding_digits', 'return_starting_number', 'return_padding_digits', 'credit_note_starting_number', 'credit_note_padding_digits', 'quotation_starting_number', 'quotation_padding_digits'].includes(key)) {
          val = val !== null && val !== '' && !isNaN(val) ? parseInt(val, 10) : null
        } else if (['cgst_rate', 'sgst_rate', 'igst_rate'].includes(key)) {
          val = val !== null && val !== '' && !isNaN(val) ? parseFloat(val) : null
        }
        updates.push(`\`${key}\` = ?`)
        values.push(val)
      }
    }

    if (updates.length > 0) {
      values.push(1)
      await pool.query(`UPDATE settings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values)
    }

    return res.status(200).json({
      success: true,
      message: 'System settings updated successfully!'
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update settings.'
    })
  }
}

export async function getThemeSettings(req, res) {
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1 LIMIT 1')

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        theme: {
          primaryColor: '#043486',
          secondaryColor: '#0248BC',
          accentColor: '#3B82F6',
          sidebarTheme: 'dark',
          logoUrl: '',
          faviconUrl: '',
          invoiceAccentColor: '#043486',
          invoiceHeaderStyle: 'banner'
        }
      })
    }

    const row = rows[0]
    let parsedTheme = null
    if (row.theme_config) {
      try {
        parsedTheme = typeof row.theme_config === 'string' ? JSON.parse(row.theme_config) : row.theme_config
      } catch (e) {
        parsedTheme = null
      }
    }

    const theme = {
      primaryColor: row.primary_color || parsedTheme?.primaryColor || '#043486',
      secondaryColor: row.secondary_color || parsedTheme?.secondaryColor || '#0248BC',
      accentColor: row.accent_color || parsedTheme?.accentColor || '#3B82F6',
      sidebarTheme: row.sidebar_theme || parsedTheme?.sidebarTheme || 'dark',
      logoUrl: row.logo_url || parsedTheme?.logoUrl || '',
      faviconUrl: row.favicon_url || parsedTheme?.faviconUrl || '',
      invoiceAccentColor: row.invoice_accent_color || parsedTheme?.invoiceAccentColor || '#043486',
      invoiceHeaderStyle: row.invoice_header_style || parsedTheme?.invoiceHeaderStyle || 'banner',
      companyName: row.company_name || '',
      companyAddress: row.address || '',
      companyPhone: row.phone || '',
      companyEmail: row.email || '',
      companyGstin: row.gstin || '',
      ...(parsedTheme || {})
    }

    return res.status(200).json({
      success: true,
      theme,
      companyName: row.company_name || ''
    })
  } catch (error) {
    console.error('Error fetching theme settings:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch theme settings.'
    })
  }
}

// Update Theme Settings specifically
export async function updateThemeSettings(req, res) {
  try {
    const {
      primaryColor,
      secondaryColor,
      accentColor,
      sidebarTheme,
      logoUrl,
      faviconUrl,
      invoiceAccentColor,
      invoiceHeaderStyle,
      ...extraTheme
    } = req.body

    const pool = getPool()
    const themeConfig = JSON.stringify({
      primaryColor,
      secondaryColor,
      accentColor,
      sidebarTheme,
      logoUrl,
      faviconUrl,
      invoiceAccentColor,
      invoiceHeaderStyle,
      ...extraTheme
    })

    await pool.query(`
      UPDATE settings 
      SET 
        primary_color = COALESCE(?, primary_color),
        secondary_color = COALESCE(?, secondary_color),
        accent_color = COALESCE(?, accent_color),
        sidebar_theme = COALESCE(?, sidebar_theme),
        logo_url = ?,
        favicon_url = ?,
        invoice_accent_color = COALESCE(?, invoice_accent_color),
        invoice_header_style = COALESCE(?, invoice_header_style),
        theme_config = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [
      primaryColor || '#043486',
      secondaryColor || '#0248BC',
      accentColor || '#3B82F6',
      sidebarTheme || 'dark',
      logoUrl || null,
      faviconUrl || null,
      invoiceAccentColor || '#043486',
      invoiceHeaderStyle || 'banner',
      themeConfig
    ])

    return res.status(200).json({
      success: true,
      message: 'Theme settings updated successfully!',
      theme: {
        primaryColor,
        secondaryColor,
        accentColor,
        sidebarTheme,
        logoUrl,
        faviconUrl,
        invoiceAccentColor,
        invoiceHeaderStyle,
        ...extraTheme
      }
    })
  } catch (error) {
    console.error('Error updating theme settings:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update theme settings.'
    })
  }
}
