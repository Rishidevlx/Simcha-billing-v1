import { getPool } from '../config/db.js'
import { sendQuotationEmail } from '../services/emailService.js'

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export async function getEffectiveIstDate(pool, targetDate = null) {
  if (targetDate) {
    const d = new Date(targetDate)
    if (!isNaN(d.getTime())) return d
  }
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT NOW() AS db_now')
      if (rows.length > 0 && rows[0].db_now) {
        return new Date(rows[0].db_now)
      }
    } catch (e) {
      // fallback
    }
  }
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffset)
}

const MONTH_MAP = {
  'JAN': '01', 'JANUARY': '01',
  'FEB': '02', 'FEBRUARY': '02',
  'MAR': '03', 'MARCH': '03',
  'APR': '04', 'APRIL': '04',
  'MAY': '05',
  'JUN': '06', 'JUNE': '06',
  'JUL': '07', 'JULY': '07',
  'AUG': '08', 'AUGUST': '08',
  'SEP': '09', 'SEPTEMBER': '09',
  'OCT': '10', 'OCTOBER': '10',
  'NOV': '11', 'NOVEMBER': '11',
  'DEC': '12', 'DECEMBER': '12'
}

function formatMonthValue(d, monthSetting) {
  const autoMonth = String(d.getMonth() + 1).padStart(2, '0')
  const str = String(monthSetting || '').trim()
  if (!str || str.toUpperCase() === 'AUTO') {
    return autoMonth
  }
  const clean = str.toUpperCase()
  if (MONTH_MAP[clean]) {
    return MONTH_MAP[clean]
  }
  const num = parseInt(clean, 10)
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return String(num).padStart(2, '0')
  }
  return clean
}

// Generate next formatted quotation number based on system settings
export async function getNextQuotationNumber(req, res) {
  try {
    const targetDate = req.query.date || null
    const pool = getPool()
    
    // Get quotation numbering settings
    const [settingRows] = await pool.query(`
      SELECT quotation_prefix, quotation_month, quotation_financial_year, quotation_starting_number, quotation_padding_digits, quotation_separator 
      FROM settings WHERE id = 1
    `)
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const prefix = (s.quotation_prefix !== undefined && s.quotation_prefix !== null && String(s.quotation_prefix).trim() !== '') ? String(s.quotation_prefix).trim() : 'SIS-QTN'
    const month = s.quotation_month
    const fy = s.quotation_financial_year
    const startNum = parseInt(s.quotation_starting_number, 10) || 1
    const padding = parseInt(s.quotation_padding_digits, 10) || 4
    const sep = (s.quotation_separator !== undefined && s.quotation_separator !== null) ? s.quotation_separator : '/'

    const effectiveDate = await getEffectiveIstDate(pool, targetDate)
    const activeMonth = formatMonthValue(effectiveDate, month)

    const currentYear = effectiveDate.getFullYear()
    const autoFy = (effectiveDate.getMonth() >= 3)
      ? `${currentYear}-${String(currentYear + 1).slice(-2)}`
      : `${currentYear - 1}-${String(currentYear).slice(-2)}`
    const fyStr = String(fy || '').trim()
    const activeFy = (fyStr && fyStr.toUpperCase() !== 'AUTO')
      ? fyStr
      : autoFy

    const cleanPrefix = String(prefix).replace(/[-/.]+$/, '')

    // Match existing quotations
    const pattern = `${cleanPrefix}${sep}${activeMonth}${sep}${activeFy}%`
    const [rows] = await pool.query('SELECT quotation_number FROM quotations WHERE quotation_number LIKE ?', [pattern])
    let maxSeq = 0
    for (const r of rows) {
      if (r.quotation_number) {
        const qtnStr = r.quotation_number.trim()
        const match = qtnStr.match(/(\d+)$/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (!isNaN(num) && num < 100000) {
            if (num > maxSeq) {
              maxSeq = num
            }
          }
        }
      }
    }

    const nextNum = maxSeq >= startNum ? maxSeq + 1 : startNum
    const formattedNumber = `${cleanPrefix}${sep}${activeMonth}${sep}${activeFy}${sep}${String(nextNum).padStart(padding, '0')}`

    return res.status(200).json({
      success: true,
      nextQuotationNumber: formattedNumber
    })
  } catch (error) {
    console.error('Error generating next quotation number:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate quotation number.'
    })
  }
}

// Create New Quotation with Line Items (DO NOT deduct inventory stock)
export async function createQuotation(req, res) {
  try {
    const {
      quotation_number,
      quotation_date,
      valid_until = null,
      quotation_type = 'NON_GST',
      copy_type = 'ORIGINAL',
      customer_name,
      customer_type = 'Individual',
      customer_phone,
      customer_email,
      customer_address,
      delivery_address,
      same_as_billing = true,
      customer_gstin,
      place_of_supply = '33-Tamil Nadu',
      taxable_amount = 0,
      cgst_rate = 9.00,
      cgst_amount = 0,
      sgst_rate = 9.00,
      sgst_amount = 0,
      igst_rate = 18.00,
      igst_amount = 0,
      total_tax = 0,
      round_off = 0,
      total_amount = 0,
      amount_in_words = '',
      quotation_status = 'Draft',
      notes = '',
      items = []
    } = req.body

    if (!quotation_number || !quotation_number.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Quotation Number is required.'
      })
    }

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer Name is required.'
      })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one line item is required to create a quotation.'
      })
    }

    const pool = getPool()

    // Check duplicate quotation number
    const [existing] = await pool.query('SELECT id FROM quotations WHERE quotation_number = ?', [quotation_number.trim()])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Quotation number "${quotation_number}" already exists. Please choose a different number.`
      })
    }

    const finalDeliveryAddress = same_as_billing ? (customer_address ? customer_address.trim() : null) : (delivery_address ? delivery_address.trim() : null)

    // Snapshot company settings
    const [snapshotSettingRows] = await pool.query('SELECT * FROM settings WHERE id = 1')
    const currentSettings = snapshotSettingRows.length > 0 ? snapshotSettingRows[0] : {}
    let parsedTerms = []
    if (typeof currentSettings.terms_conditions === 'string') {
      try { parsedTerms = JSON.parse(currentSettings.terms_conditions) } catch { parsedTerms = [] }
    } else if (Array.isArray(currentSettings.terms_conditions)) {
      parsedTerms = currentSettings.terms_conditions
    }

    let parsedQuotationTerms = []
    if (typeof currentSettings.quotation_terms === 'string') {
      try { parsedQuotationTerms = JSON.parse(currentSettings.quotation_terms) } catch { parsedQuotationTerms = [] }
    } else if (Array.isArray(currentSettings.quotation_terms)) {
      parsedQuotationTerms = currentSettings.quotation_terms
    }
    const finalQuotationTerms = parsedQuotationTerms.length > 0 ? parsedQuotationTerms : parsedTerms

    const companySnapshot = JSON.stringify({
      company_name: currentSettings.company_name || 'SIMCHA INFO SOLUTIONS',
      address: currentSettings.address || '',
      phone: currentSettings.phone || '',
      email: currentSettings.email || '',
      gstin: currentSettings.gstin || '',
      bank_name: currentSettings.bank_name || '',
      account_name: currentSettings.account_name || currentSettings.company_name || '',
      account_no: currentSettings.account_no || '',
      ifsc_code: currentSettings.ifsc_code || '',
      branch: currentSettings.branch || '',
      bank_image_url: currentSettings.bank_image_url || '',
      signature_url: currentSettings.signature_url || '',
      quotation_terms: finalQuotationTerms,
      terms_conditions: finalQuotationTerms
    })

    // Calculate default valid_until if not provided (default quotation_validity_days)
    let finalValidUntil = valid_until || null
    if (!finalValidUntil) {
      const validityDays = parseInt(currentSettings.quotation_validity_days, 10) || 15
      const qDate = quotation_date ? new Date(quotation_date) : new Date()
      const vDate = new Date(qDate)
      vDate.setDate(vDate.getDate() + validityDays)
      finalValidUntil = vDate.toISOString().split('T')[0]
    }

    // Insert into quotations table
    const [quotationResult] = await pool.query(`
      INSERT INTO quotations (
        quotation_number, quotation_date, valid_until, quotation_type, copy_type,
        customer_name, customer_type, customer_phone, customer_email, customer_address, delivery_address, same_as_billing, customer_gstin,
        place_of_supply, taxable_amount, cgst_rate, cgst_amount,
        sgst_rate, sgst_amount, igst_rate, igst_amount,
        total_tax, round_off, total_amount, amount_in_words,
        quotation_status, notes, company_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      quotation_number.trim(),
      quotation_date || new Date().toISOString().split('T')[0],
      finalValidUntil,
      quotation_type,
      copy_type,
      customer_name.trim(),
      customer_type || 'Individual',
      customer_phone ? customer_phone.trim() : null,
      customer_email ? customer_email.trim() : null,
      customer_address ? customer_address.trim() : null,
      finalDeliveryAddress,
      same_as_billing ? 1 : 0,
      customer_gstin ? customer_gstin.trim() : null,
      place_of_supply || '33-Tamil Nadu',
      parseFloat(taxable_amount) || 0,
      parseFloat(cgst_rate) || 0,
      parseFloat(cgst_amount) || 0,
      parseFloat(sgst_rate) || 0,
      parseFloat(sgst_amount) || 0,
      parseFloat(igst_rate) || 0,
      parseFloat(igst_amount) || 0,
      parseFloat(total_tax) || 0,
      parseFloat(round_off) || 0,
      parseFloat(total_amount) || 0,
      amount_in_words || '',
      quotation_status || 'Draft',
      notes || '',
      companySnapshot
    ])

    const quotationId = quotationResult.insertId

    // Insert Quotation Items (NOTE: No stock deduction!)
    for (const item of items) {
      await pool.query(`
        INSERT INTO quotation_items (
          quotation_id, material_id, item_name, serial_number,
          hsn_code, quantity, unit, rate, has_discount, discount_percent, discount_amount, original_rate,
          tax_rate, tax_amount, amount, return_policy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        quotationId,
        item.material_id ? parseInt(item.material_id, 10) : null,
        item.item_name || item.name || 'Item',
        item.serial_number ? item.serial_number.trim() : null,
        item.hsn_code ? item.hsn_code.trim() : null,
        parseFloat(item.quantity) || 1,
        item.unit || 'NOS',
        parseFloat(item.rate) || 0,
        item.has_discount ? 1 : 0,
        parseFloat(item.discount_percent) || 0,
        parseFloat(item.discount_amount) || 0,
        parseFloat(item.original_rate) || (parseFloat(item.rate) || 0),
        parseFloat(item.tax_rate) || 18.00,
        parseFloat(item.tax_amount) || 0,
        parseFloat(item.amount) || 0,
        item.return_policy ? 1 : 0
      ])
    }

    // Trigger Automated Email Dispatch in Background if email configured & recipient present (TEMPORARILY DISABLED AS REQUESTED)
    /*
    (async () => {
      try {
        const [configRows] = await pool.query('SELECT auto_email_on_create, smtp_user, smtp_pass FROM email_configs WHERE id = 1')
        if (configRows.length > 0 && configRows[0].auto_email_on_create && configRows[0].smtp_user && configRows[0].smtp_pass) {
          console.log(`📤 Auto-dispatching quotation PDF email for #${quotation_number}...`)
          await sendQuotationEmail(quotationId)
        }
      } catch (e) {
        console.error('Auto-email quotation background dispatch error:', e)
      }
    })()
    */

    return res.status(201).json({
      success: true,
      message: 'Quotation created successfully!',
      quotationId,
      quotationNumber: quotation_number
    })
  } catch (error) {
    console.error('Error creating quotation:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create quotation in database.'
    })
  }
}

// Get All Quotations with items count and stats
export async function getAllQuotations(req, res) {
  try {
    const pool = getPool()
    
    const [ [quotations], [allItems] ] = await Promise.all([
      pool.query(`
        SELECT 
          q.*,
          COUNT(qi.id) AS total_items
        FROM quotations q
        LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
        GROUP BY q.id
        ORDER BY q.id DESC
      `),
      pool.query(`
        SELECT * FROM quotation_items ORDER BY id ASC
      `)
    ])

    const itemsByQuotationId = {}
    allItems.forEach(item => {
      if (!itemsByQuotationId[item.quotation_id]) {
        itemsByQuotationId[item.quotation_id] = []
      }
      itemsByQuotationId[item.quotation_id].push(item)
    })

    const quotationsWithItems = quotations.map(quotation => ({
      ...quotation,
      items: itemsByQuotationId[quotation.id] || []
    }))

    const totalValue = quotations.reduce((acc, q) => acc + (parseFloat(q.total_amount) || 0), 0)
    const draftCount = quotations.filter(q => q.quotation_status === 'Draft').length
    const sentCount = quotations.filter(q => q.quotation_status === 'Sent').length
    const approvedCount = quotations.filter(q => q.quotation_status === 'Approved').length
    const convertedCount = quotations.filter(q => q.quotation_status === 'Converted' || q.converted_bill_id).length

    return res.status(200).json({
      success: true,
      count: quotationsWithItems.length,
      quotations: quotationsWithItems,
      stats: {
        totalQuotations: quotations.length,
        totalValue,
        draftCount,
        sentCount,
        approvedCount,
        convertedCount
      }
    })
  } catch (error) {
    console.error('Error fetching quotations:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve quotations.'
    })
  }
}

// Get Single Quotation by ID
export async function getQuotationById(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [quotations] = await pool.query('SELECT * FROM quotations WHERE id = ?', [id])
    if (quotations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.'
      })
    }

    const [items] = await pool.query(`
      SELECT 
        qi.*, 
        m.current_stock, 
        m.opening_stock, 
        m.category_id,
        m.serial_tracking, 
        m.has_discount AS mat_has_discount, 
        m.discount_percent AS mat_discount_percent, 
        m.selling_price AS mat_selling_price
      FROM quotation_items qi
      LEFT JOIN materials m ON qi.material_id = m.id
      WHERE qi.quotation_id = ?
      ORDER BY qi.id ASC
    `, [id])

    return res.status(200).json({
      success: true,
      quotation: {
        ...quotations[0],
        items
      }
    })
  } catch (error) {
    console.error('Error fetching quotation details:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quotation details.'
    })
  }
}

// Update Quotation
export async function updateQuotation(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [existing] = await pool.query('SELECT * FROM quotations WHERE id = ?', [id])
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.'
      })
    }

    const {
      quotation_number,
      quotation_date,
      valid_until,
      quotation_type = 'NON_GST',
      copy_type = 'ORIGINAL',
      customer_name,
      customer_type = 'Individual',
      customer_phone,
      customer_email,
      customer_address,
      delivery_address,
      same_as_billing = true,
      customer_gstin,
      place_of_supply = '33-Tamil Nadu',
      taxable_amount = 0,
      cgst_rate = 9.00,
      cgst_amount = 0,
      sgst_rate = 9.00,
      sgst_amount = 0,
      igst_rate = 18.00,
      igst_amount = 0,
      total_tax = 0,
      round_off = 0,
      total_amount = 0,
      amount_in_words = '',
      quotation_status = 'Draft',
      notes = '',
      items = []
    } = req.body

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer Name is required.'
      })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one line item is required.'
      })
    }

    const finalDeliveryAddress = same_as_billing ? (customer_address ? customer_address.trim() : null) : (delivery_address ? delivery_address.trim() : null)

    // Update Quotations Table
    await pool.query(`
      UPDATE quotations SET
        quotation_number = ?,
        quotation_date = ?,
        valid_until = ?,
        quotation_type = ?,
        copy_type = ?,
        customer_name = ?,
        customer_type = ?,
        customer_phone = ?,
        customer_email = ?,
        customer_address = ?,
        delivery_address = ?,
        same_as_billing = ?,
        customer_gstin = ?,
        place_of_supply = ?,
        taxable_amount = ?,
        cgst_rate = ?,
        cgst_amount = ?,
        sgst_rate = ?,
        sgst_amount = ?,
        igst_rate = ?,
        igst_amount = ?,
        total_tax = ?,
        round_off = ?,
        total_amount = ?,
        amount_in_words = ?,
        quotation_status = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      quotation_number.trim(),
      quotation_date || new Date().toISOString().split('T')[0],
      valid_until || null,
      quotation_type,
      copy_type,
      customer_name.trim(),
      customer_type || 'Individual',
      customer_phone ? customer_phone.trim() : null,
      customer_email ? customer_email.trim() : null,
      customer_address ? customer_address.trim() : null,
      finalDeliveryAddress,
      same_as_billing ? 1 : 0,
      customer_gstin ? customer_gstin.trim() : null,
      place_of_supply || '33-Tamil Nadu',
      parseFloat(taxable_amount) || 0,
      parseFloat(cgst_rate) || 0,
      parseFloat(cgst_amount) || 0,
      parseFloat(sgst_rate) || 0,
      parseFloat(sgst_amount) || 0,
      parseFloat(igst_rate) || 0,
      parseFloat(igst_amount) || 0,
      parseFloat(total_tax) || 0,
      parseFloat(round_off) || 0,
      parseFloat(total_amount) || 0,
      amount_in_words || '',
      quotation_status || 'Draft',
      notes || '',
      id
    ])

    // Replace Quotation Items
    await pool.query('DELETE FROM quotation_items WHERE quotation_id = ?', [id])

    for (const item of items) {
      await pool.query(`
        INSERT INTO quotation_items (
          quotation_id, material_id, item_name, serial_number,
          hsn_code, quantity, unit, rate, has_discount, discount_percent, discount_amount, original_rate,
          tax_rate, tax_amount, amount, return_policy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        item.material_id ? parseInt(item.material_id, 10) : null,
        item.item_name || item.name || 'Item',
        item.serial_number ? item.serial_number.trim() : null,
        item.hsn_code ? item.hsn_code.trim() : null,
        parseFloat(item.quantity) || 1,
        item.unit || 'NOS',
        parseFloat(item.rate) || 0,
        item.has_discount ? 1 : 0,
        parseFloat(item.discount_percent) || 0,
        parseFloat(item.discount_amount) || 0,
        parseFloat(item.original_rate) || (parseFloat(item.rate) || 0),
        parseFloat(item.tax_rate) || 18.00,
        parseFloat(item.tax_amount) || 0,
        parseFloat(item.amount) || 0,
        item.return_policy ? 1 : 0
      ])
    }

    return res.status(200).json({
      success: true,
      message: 'Quotation updated successfully!'
    })
  } catch (error) {
    console.error('Error updating quotation:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update quotation.'
    })
  }
}

// Delete Quotation
export async function deleteQuotation(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [existing] = await pool.query('SELECT id, quotation_number FROM quotations WHERE id = ?', [id])
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.'
      })
    }

    const qtnNo = existing[0].quotation_number

    await pool.query('DELETE FROM quotations WHERE id = ?', [id])

    return res.status(200).json({
      success: true,
      message: `Quotation #${qtnNo} deleted successfully.`
    })
  } catch (error) {
    console.error('Error deleting quotation:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete quotation.'
    })
  }
}

// Update Quotation Status
export async function updateQuotationStatus(req, res) {
  try {
    const { id } = req.params
    const { quotation_status } = req.body
    const pool = getPool()

    if (!quotation_status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required.'
      })
    }

    const [result] = await pool.query('UPDATE quotations SET quotation_status = ?, updated_at = NOW() WHERE id = ?', [quotation_status, id])
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.'
      })
    }

    return res.status(200).json({
      success: true,
      message: `Quotation status updated to ${quotation_status}.`
    })
  } catch (error) {
    console.error('Error updating quotation status:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update quotation status.'
    })
  }
}

// Send Quotation Email manually via API endpoint
export async function sendQuotationEmailController(req, res) {
  try {
    const { id } = req.params
    const { email, recipient: customRecip, pdf_base64, pdfBase64 } = req.body || {}

    const pool = getPool()
    const [quotations] = await pool.query('SELECT * FROM quotations WHERE id = ?', [id])
    if (quotations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quotation record not found.'
      })
    }

    const quotation = quotations[0]
    const recipient = email || customRecip || quotation.customer_email

    if (!recipient || !recipient.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer email address is required to dispatch the quotation.'
      })
    }

    const result = await sendQuotationEmail(id, recipient, pdf_base64 || pdfBase64)
    if (!result.success) {
      return res.status(500).json(result)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error dispatching quotation email:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch quotation email.'
    })
  }
}

// Convert Quotation into Outward Bill (Tax Invoice)
export async function convertQuotationToInvoice(req, res) {
  try {
    const { id } = req.params
    const { invoice_number, payment_mode = null, payment_status = 'Pending' } = req.body || {}
    const pool = getPool()

    const [quotationRows] = await pool.query('SELECT * FROM quotations WHERE id = ?', [id])
    if (quotationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.'
      })
    }

    const quotation = quotationRows[0]

    if (quotation.converted_bill_id) {
      return res.status(400).json({
        success: false,
        message: `This quotation is already converted to Invoice #${quotation.converted_invoice_number}.`
      })
    }

    const [itemRows] = await pool.query('SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC', [id])
    if (itemRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot convert quotation with zero items.'
      })
    }

    // Check Inventory Stock for all items before converting
    const stockErrors = []
    for (const it of itemRows) {
      let matId = it.material_id
      if (!matId && it.item_name) {
        const [lookup] = await pool.query('SELECT id, name, current_stock, opening_stock, unit FROM materials WHERE name = ? LIMIT 1', [it.item_name.trim()])
        if (lookup.length > 0) {
          matId = lookup[0].id
        }
      }

      if (matId) {
        const [mRows] = await pool.query('SELECT id, name, current_stock, opening_stock, unit FROM materials WHERE id = ?', [matId])
        if (mRows.length > 0) {
          const availStock = parseFloat(mRows[0].current_stock ?? mRows[0].opening_stock ?? 0)
          const reqQty = parseFloat(it.quantity) || 1
          if (availStock < reqQty) {
            stockErrors.push({
              itemName: it.item_name || mRows[0].name,
              required: reqQty,
              available: availStock,
              shortage: reqQty - availStock,
              unit: it.unit || mRows[0].unit || 'NOS'
            })
          }
        }
      }
    }

    if (stockErrors.length > 0) {
      const errListStr = stockErrors.map(e => `• ${e.itemName}: Required ${e.required} ${e.unit}, Available ${e.available} ${e.unit} (Shortage: ${e.shortage} ${e.unit})`).join('\n')
      return res.status(400).json({
        success: false,
        isStockError: true,
        stockErrors,
        message: `Insufficient inventory stock to convert this quotation:\n\n${errListStr}\n\nPlease add an Inward Entry for the shortage before converting to an Outward Bill.`
      })
    }

    // Determine target invoice number
    let finalInvoiceNumber = (invoice_number || '').trim()
    if (!finalInvoiceNumber) {
      // Auto-generate invoice number
      const [settingRows] = await pool.query(`
        SELECT invoice_prefix, invoice_month, invoice_financial_year, invoice_starting_number, invoice_padding_digits, invoice_separator 
        FROM settings WHERE id = 1
      `)
      const s = settingRows.length > 0 ? settingRows[0] : {}
      const prefix = (s.invoice_prefix !== undefined && s.invoice_prefix !== null && s.invoice_prefix.trim() !== '') ? s.invoice_prefix.trim() : 'SIS'
      const month = s.invoice_month
      const fy = s.invoice_financial_year
      const startNum = parseInt(s.invoice_starting_number, 10) || 1
      const padding = parseInt(s.invoice_padding_digits, 10) || 4
      const sep = (s.invoice_separator !== undefined && s.invoice_separator !== null) ? s.invoice_separator : '/'

      const effectiveDate = await getEffectiveIstDate(pool)
      const activeMonth = formatMonthValue(effectiveDate, month)

      const currentYear = effectiveDate.getFullYear()
      const autoFy = (effectiveDate.getMonth() >= 3)
        ? `${currentYear}-${String(currentYear + 1).slice(-2)}`
        : `${currentYear - 1}-${String(currentYear).slice(-2)}`
      const activeFy = (fy && fy.trim() && fy.trim().toUpperCase() !== 'AUTO')
        ? fy.trim()
        : autoFy

      const cleanPrefix = prefix.replace(/[-/.]+$/, '')
      const pattern = `${cleanPrefix}${sep}${activeMonth}${sep}${activeFy}%`
      const [rows] = await pool.query('SELECT invoice_number FROM bills WHERE invoice_number LIKE ?', [pattern])
      let maxSeq = 0
      for (const r of rows) {
        if (r.invoice_number) {
          const invStr = r.invoice_number.trim()
          const match = invStr.match(/(\d+)$/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (!isNaN(num) && num < 100000) {
              if (num > maxSeq) maxSeq = num
            }
          }
        }
      }
      const nextNum = maxSeq >= startNum ? maxSeq + 1 : startNum
      finalInvoiceNumber = `${cleanPrefix}${sep}${activeMonth}${sep}${activeFy}${sep}${String(nextNum).padStart(padding, '0')}`
    }

    // Determine receipt number
    const [settingRows] = await pool.query(`
      SELECT receipt_prefix, receipt_month, receipt_financial_year, receipt_starting_number, receipt_padding_digits, receipt_separator 
      FROM settings WHERE id = 1
    `)
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const rPrefix = (s.receipt_prefix !== undefined && s.receipt_prefix !== null && String(s.receipt_prefix).trim() !== '') ? String(s.receipt_prefix).trim() : 'SIS-REC'
    const rMonth = s.receipt_month
    const rFy = (s.receipt_financial_year && String(s.receipt_financial_year).trim()) ? String(s.receipt_financial_year).trim() : '2026-27'
    const rStartNum = parseInt(s.receipt_starting_number, 10) || 1
    const rPadding = parseInt(s.receipt_padding_digits, 10) || 4
    const rSep = (s.receipt_separator !== undefined && s.receipt_separator !== null) ? s.receipt_separator : '/'

    const matchSeq = finalInvoiceNumber.match(/(\d+)$/)
    const seq = matchSeq ? parseInt(matchSeq[1], 10) : rStartNum
    const finalReceiptNumber = buildDynamicNumber(rPrefix, rSep, rMonth, rFy, seq, rPadding, todayStr, effectiveDate)

    // Build Invoice Company Snapshot with Invoice & Receipt terms (not quotation terms)
    const [snapSettingRows] = await pool.query('SELECT * FROM settings WHERE id = 1')
    const curSettings = snapSettingRows.length > 0 ? snapSettingRows[0] : {}
    let parsedInvTerms = []
    if (typeof curSettings.invoice_terms === 'string') {
      try { parsedInvTerms = JSON.parse(curSettings.invoice_terms) } catch { parsedInvTerms = [] }
    } else if (Array.isArray(curSettings.invoice_terms)) {
      parsedInvTerms = curSettings.invoice_terms
    }
    let parsedRecTerms = []
    if (typeof curSettings.receipt_terms === 'string') {
      try { parsedRecTerms = JSON.parse(curSettings.receipt_terms) } catch { parsedRecTerms = [] }
    } else if (Array.isArray(curSettings.receipt_terms)) {
      parsedRecTerms = curSettings.receipt_terms
    }
    const finalInvoiceTerms = parsedInvTerms.length > 0 
      ? parsedInvTerms 
      : (typeof curSettings.terms_conditions === 'string' ? (JSON.parse(curSettings.terms_conditions || '[]')) : (curSettings.terms_conditions || []))

    const invoiceCompanySnapshot = JSON.stringify({
      company_name: curSettings.company_name || 'SIMCHA INFO SOLUTIONS',
      address: curSettings.address || '',
      phone: curSettings.phone || '',
      email: curSettings.email || '',
      gstin: curSettings.gstin || '',
      bank_name: curSettings.bank_name || '',
      account_name: curSettings.account_name || curSettings.company_name || '',
      account_no: curSettings.account_no || '',
      ifsc_code: curSettings.ifsc_code || '',
      branch: curSettings.branch || '',
      bank_image_url: curSettings.bank_image_url || '',
      signature_url: curSettings.signature_url || '',
      invoice_terms: finalInvoiceTerms,
      receipt_terms: parsedRecTerms,
      terms_conditions: finalInvoiceTerms
    })

    // Insert into bills
    const [billResult] = await pool.query(`
      INSERT INTO bills (
        invoice_number, receipt_number, invoice_date, due_date, has_due_date, invoice_type, copy_type,
        customer_name, customer_type, customer_phone, customer_email, customer_address, delivery_address, same_as_billing, customer_gstin,
        place_of_supply, taxable_amount, cgst_rate, cgst_amount,
        sgst_rate, sgst_amount, igst_rate, igst_amount,
        total_tax, round_off, total_amount, amount_in_words,
        payment_mode, payment_status, notes, company_snapshot
      ) VALUES (?, ?, NOW(), NULL, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      finalInvoiceNumber,
      finalReceiptNumber,
      quotation.quotation_type || 'NON_GST',
      quotation.copy_type || 'ORIGINAL',
      quotation.customer_name,
      quotation.customer_type || 'Individual',
      quotation.customer_phone,
      quotation.customer_email,
      quotation.customer_address,
      quotation.delivery_address,
      quotation.same_as_billing,
      quotation.customer_gstin,
      quotation.place_of_supply || '33-Tamil Nadu',
      quotation.taxable_amount,
      quotation.cgst_rate,
      quotation.cgst_amount,
      quotation.sgst_rate,
      quotation.sgst_amount,
      quotation.igst_rate,
      quotation.igst_amount,
      quotation.total_tax,
      quotation.round_off,
      quotation.total_amount,
      quotation.amount_in_words,
      payment_mode,
      payment_status,
      `Converted from Quotation #${quotation.quotation_number}. ${quotation.notes || ''}`,
      invoiceCompanySnapshot
    ])

    const newBillId = billResult.insertId

    // Insert bill_items and deduct stock
    for (const it of itemRows) {
      await pool.query(`
        INSERT INTO bill_items (
          bill_id, material_id, item_name, serial_number,
          hsn_code, quantity, unit, rate, has_discount, discount_percent, discount_amount, original_rate,
          tax_rate, tax_amount, amount, return_policy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newBillId,
        it.material_id,
        it.item_name,
        it.serial_number,
        it.hsn_code,
        it.quantity,
        it.unit,
        it.rate,
        it.has_discount,
        it.discount_percent,
        it.discount_amount,
        it.original_rate,
        it.tax_rate,
        it.tax_amount,
        it.amount,
        it.return_policy
      ])

      // Update Serial Numbers status to 'Sold' in inventory_serials
      if (it.serial_number && it.serial_number.trim() && it.material_id) {
        const serialsList = it.serial_number
          .split(/[\n,]+/)
          .map(s => s.trim())
          .filter(Boolean)

        for (const sn of serialsList) {
          try {
            await pool.query(
              'UPDATE inventory_serials SET status = "Sold", updated_at = NOW() WHERE material_id = ? AND LOWER(serial_number) = LOWER(?)',
              [it.material_id, sn]
            )
          } catch (snErr) {
            console.error('Error updating inventory_serials status to Sold:', snErr)
          }
        }
      }

      // Deduct current stock
      if (it.material_id) {
        try {
          const qtyVal = parseFloat(it.quantity) || 1
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [it.material_id])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const newStock = Math.max(0, currentStock - qtyVal)

            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, it.material_id])

            await pool.query(`
              INSERT INTO stock_ledger (
                material_id, movement_type, reference_number,
                quantity_change, balance_stock, notes
              ) VALUES (?, 'OUTWARD_SALE', ?, ?, ?, ?)
            `, [
              it.material_id,
              finalInvoiceNumber,
              -qtyVal,
              newStock,
              `Converted from Quotation #${quotation.quotation_number} -> Invoice #${finalInvoiceNumber}`
            ])
          }
        } catch (stockErr) {
          console.error('Error updating stock on quotation conversion:', stockErr)
        }
      }
    }

    // Update Quotation record with converted status & references
    await pool.query(`
      UPDATE quotations SET 
        quotation_status = 'Converted', 
        converted_bill_id = ?, 
        converted_invoice_number = ?, 
        updated_at = NOW() 
      WHERE id = ?
    `, [newBillId, finalInvoiceNumber, id])

    return res.status(200).json({
      success: true,
      message: `Quotation #${quotation.quotation_number} successfully converted to Invoice #${finalInvoiceNumber}!`,
      billId: newBillId,
      invoiceNumber: finalInvoiceNumber,
      invoice_number: finalInvoiceNumber
    })
  } catch (error) {
    console.error('Error converting quotation to invoice:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert quotation to invoice.'
    })
  }
}
