import { getPool } from '../config/db.js'

// Get System Settings (Company info, Bank details, Terms, Tax rates)
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

    return res.status(200).json({
      success: true,
      settings: {
        ...settings,
        terms_conditions: parsedTerms
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

// Update System Settings
export async function updateSettings(req, res) {
  try {
    const {
      company_name,
      address,
      phone,
      email,
      gstin,
      bank_name,
      account_name,
      account_no,
      ifsc_code,
      branch,
      bank_image_url,
      signature_url,
      terms_conditions,
      cgst_rate,
      sgst_rate,
      igst_rate,
      invoice_prefix,
      invoice_financial_year,
      invoice_starting_number,
      invoice_padding_digits,
      invoice_separator,
      receipt_prefix,
      receipt_financial_year,
      receipt_starting_number,
      receipt_padding_digits,
      receipt_separator,
      service_prefix,
      service_financial_year,
      service_starting_number,
      service_padding_digits,
      service_separator,
      return_days,
      due_date_days
    } = req.body

    const pool = getPool()

    const formattedTerms = Array.isArray(terms_conditions) 
      ? JSON.stringify(terms_conditions) 
      : (typeof terms_conditions === 'string' ? terms_conditions : '[]')

    await pool.query(`
      INSERT INTO settings (
        id, company_name, address, phone, email, gstin,
        bank_name, account_name, account_no, ifsc_code, branch, bank_image_url, signature_url,
        terms_conditions, return_days, due_date_days, cgst_rate, sgst_rate, igst_rate,
        invoice_prefix, invoice_financial_year, invoice_starting_number, invoice_padding_digits, invoice_separator,
        receipt_prefix, receipt_financial_year, receipt_starting_number, receipt_padding_digits, receipt_separator,
        service_prefix, service_financial_year, service_starting_number, service_padding_digits, service_separator
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        address = VALUES(address),
        phone = VALUES(phone),
        email = VALUES(email),
        gstin = VALUES(gstin),
        bank_name = VALUES(bank_name),
        account_name = VALUES(account_name),
        account_no = VALUES(account_no),
        ifsc_code = VALUES(ifsc_code),
        branch = VALUES(branch),
        bank_image_url = VALUES(bank_image_url),
        signature_url = VALUES(signature_url),
        terms_conditions = VALUES(terms_conditions),
        return_days = VALUES(return_days),
        due_date_days = VALUES(due_date_days),
        cgst_rate = VALUES(cgst_rate),
        sgst_rate = VALUES(sgst_rate),
        igst_rate = VALUES(igst_rate),
        invoice_prefix = VALUES(invoice_prefix),
        invoice_financial_year = VALUES(invoice_financial_year),
        invoice_starting_number = VALUES(invoice_starting_number),
        invoice_padding_digits = VALUES(invoice_padding_digits),
        invoice_separator = VALUES(invoice_separator),
        receipt_prefix = VALUES(receipt_prefix),
        receipt_financial_year = VALUES(receipt_financial_year),
        receipt_starting_number = VALUES(receipt_starting_number),
        receipt_padding_digits = VALUES(receipt_padding_digits),
        receipt_separator = VALUES(receipt_separator),
        service_prefix = VALUES(service_prefix),
        service_financial_year = VALUES(service_financial_year),
        service_starting_number = VALUES(service_starting_number),
        service_padding_digits = VALUES(service_padding_digits),
        service_separator = VALUES(service_separator),
        updated_at = CURRENT_TIMESTAMP
    `, [
      company_name || 'SIMCHA INFO SOLUTIONS',
      address || '',
      phone || '',
      email || '',
      gstin || '',
      bank_name || '',
      account_name || '',
      account_no || '',
      ifsc_code || '',
      branch || '',
      bank_image_url || null,
      signature_url || null,
      formattedTerms,
      return_days !== undefined && return_days !== null ? parseInt(return_days, 10) : 7,
      due_date_days !== undefined && due_date_days !== null ? parseInt(due_date_days, 10) : 15,
      parseFloat(cgst_rate) || 9.00,
      parseFloat(sgst_rate) || 9.00,
      parseFloat(igst_rate) || 18.00,
      invoice_prefix !== undefined ? invoice_prefix : 'SIS',
      invoice_financial_year || '2026-27',
      parseInt(invoice_starting_number, 10) || 1,
      parseInt(invoice_padding_digits, 10) || 4,
      invoice_separator || '/',
      receipt_prefix !== undefined ? receipt_prefix : 'SIS-REC',
      receipt_financial_year || '2026-27',
      parseInt(receipt_starting_number, 10) || 1,
      parseInt(receipt_padding_digits, 10) || 4,
      receipt_separator || '/',
      service_prefix !== undefined ? service_prefix : 'SIS-SR',
      service_financial_year || '2026-27',
      parseInt(service_starting_number, 10) || 1,
      parseInt(service_padding_digits, 10) || 4,
      service_separator || '/'
    ])

    return res.status(200).json({
      success: true,
      message: 'System settings updated successfully!'
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update settings.'
    })
  }
}
