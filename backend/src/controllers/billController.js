import { getPool } from '../config/db.js'
import { sendInvoiceEmail, sendReceiptEmail } from '../services/emailService.js'

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
      // fallback to IST calculation
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

function buildDynamicNumber(prefix, sep, monthSetting, fySetting, seqNum, padding, targetDate = null, effectiveDate = null) {
  const d = effectiveDate || (targetDate ? new Date(targetDate) : new Date())
  const now = isNaN(d.getTime()) ? new Date() : d
  const activeMonth = formatMonthValue(now, monthSetting)

  const currentYear = now.getFullYear()
  const autoFy = (now.getMonth() >= 3)
    ? `${currentYear}-${String(currentYear + 1).slice(-2)}`
    : `${currentYear - 1}-${String(currentYear).slice(-2)}`
  const fyStr = String(fySetting || '').trim()
  const activeFy = (fyStr && fyStr.toUpperCase() !== 'AUTO')
    ? fyStr
    : autoFy

  const cleanPrefix = String(prefix || 'SIS').replace(/[-/.]+$/, '')
  return `${cleanPrefix}${sep}${activeMonth}${sep}${activeFy}${sep}${String(seqNum).padStart(padding, '0')}`
}

export function ensureReceiptHasMonth(recNo, invDate) {
  if (!recNo) return recNo
  const m = String(recNo).trim().match(/^([A-Za-z0-9_-]+)([/\\-])(\d{4}-\d{2})([/\\-])(\d+)$/)
  if (m) {
    const prefix = m[1]
    const sep = m[2]
    const fy = m[3]
    const seq = m[5]
    const d = invDate ? new Date(invDate) : new Date()
    const validDate = isNaN(d.getTime()) ? new Date() : d
    const monthNum = String(validDate.getMonth() + 1).padStart(2, '0')
    return `${prefix}${sep}${monthNum}${sep}${fy}${sep}${seq}`
  }
  return recNo
}

// Generate next formatted invoice number based on system settings
export async function getNextInvoiceNumber(req, res) {
  try {
    const targetDate = req.query.date || null
    const pool = getPool()
    
    // Get invoice settings
    const [settingRows] = await pool.query(`
      SELECT invoice_prefix, invoice_month, invoice_financial_year, invoice_starting_number, invoice_padding_digits, invoice_separator 
      FROM settings WHERE id = 1
    `)
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const prefix = (s.invoice_prefix !== undefined && s.invoice_prefix !== null && String(s.invoice_prefix).trim() !== '') ? String(s.invoice_prefix).trim() : 'SIS'
    const month = s.invoice_month
    const fy = s.invoice_financial_year
    const startNum = parseInt(s.invoice_starting_number, 10) || 1
    const padding = parseInt(s.invoice_padding_digits, 10) || 4
    const sep = (s.invoice_separator !== undefined && s.invoice_separator !== null) ? s.invoice_separator : '/'

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

    // Extract sequence numbers from existing bills matching current prefix/month/fy
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
      nextInvoiceNumber: formattedNumber
    })
  } catch (error) {
    console.error('Error generating next invoice number:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate invoice number.'
    })
  }
}

// Generate next formatted receipt number based on system settings
export async function getNextReceiptNumber(req, res) {
  try {
    const targetDate = req.query.date || null
    const pool = getPool()
    
    // Get receipt settings
    const [settingRows] = await pool.query(`
      SELECT receipt_prefix, receipt_month, receipt_financial_year, receipt_starting_number, receipt_padding_digits, receipt_separator 
      FROM settings WHERE id = 1
    `)
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const prefix = (s.receipt_prefix !== undefined && s.receipt_prefix !== null && s.receipt_prefix.trim() !== '') ? s.receipt_prefix.trim() : 'SIS-REC'
    const month = s.receipt_month
    const fy = s.receipt_financial_year
    const startNum = parseInt(s.receipt_starting_number, 10) || 1
    const padding = parseInt(s.receipt_padding_digits, 10) || 4
    const sep = (s.receipt_separator !== undefined && s.receipt_separator !== null) ? s.receipt_separator : '/'

    const effectiveDate = await getEffectiveIstDate(pool, targetDate)
    const activeMonth = formatMonthValue(effectiveDate, month)

    const currentYear = effectiveDate.getFullYear()
    const autoFy = (effectiveDate.getMonth() >= 3)
      ? `${currentYear}-${String(currentYear + 1).slice(-2)}`
      : `${currentYear - 1}-${String(currentYear).slice(-2)}`
    const activeFy = (fy && fy.trim() && fy.trim().toUpperCase() !== 'AUTO')
      ? fy.trim()
      : autoFy

    const cleanPrefix = prefix.replace(/[-/.]+$/, '')

    // Extract sequence numbers from existing bills' receipt_number matching current prefix/month/fy
    const pattern = `${cleanPrefix}${sep}${activeMonth}${sep}${activeFy}%`
    const [rows] = await pool.query('SELECT receipt_number FROM bills WHERE receipt_number LIKE ?', [pattern])
    let maxSeq = 0
    for (const r of rows) {
      const recStr = (r.receipt_number || '').trim()
      if (recStr) {
        const match = recStr.match(/(\d+)$/)
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
      nextReceiptNumber: formattedNumber
    })
  } catch (error) {
    console.error('Error generating next receipt number:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate receipt number.'
    })
  }
}

// Create New Bill with Line Items
export async function createBill(req, res) {
  try {
    const {
      invoice_number,
      receipt_number,
      invoice_date,
      due_date = null,
      has_due_date = true,
      invoice_type = 'NON_GST',
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
      payment_mode = null,
      payment_status = 'Pending',
      notes = '',
      items = []
    } = req.body

    if (!invoice_number || !invoice_number.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invoice Number is required.'
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
        message: 'At least one line item is required to create a bill.'
      })
    }

    const pool = getPool()

    // Check duplicate invoice number
    const [existing] = await pool.query('SELECT id FROM bills WHERE invoice_number = ?', [invoice_number.trim()])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invoice number "${invoice_number}" already exists. Please choose a different number.`
      })
    }

    // Check if any serial number is already sold in inventory_serials
    for (const item of items) {
      const billedSerials = []
      if (Array.isArray(item.serial_numbers)) {
        item.serial_numbers.forEach(s => { if (s && String(s).trim()) billedSerials.push(String(s).trim()) })
      } else if (item.serial_number && String(item.serial_number).trim()) {
        String(item.serial_number).split(/[\n,]+/).forEach(s => { if (s && s.trim()) billedSerials.push(s.trim()) })
      }

      for (const sn of billedSerials) {
        const [soldRows] = await pool.query(
          'SELECT serial_number, status FROM inventory_serials WHERE LOWER(serial_number) = LOWER(?)',
          [sn]
        )
        if (soldRows.length > 0 && soldRows[0].status && soldRows[0].status.toLowerCase() !== 'available') {
          return res.status(400).json({
            success: false,
            message: `Serial number "${sn}" is already marked as "${soldRows[0].status}" in inventory and cannot be billed again.`
          })
        }
      }
    }

    // Determine receipt_number if not provided
    let finalReceiptNumber = (receipt_number || '').trim()
    if (!finalReceiptNumber) {
      const [settingRows] = await pool.query(`
        SELECT receipt_prefix, receipt_month, receipt_financial_year, receipt_starting_number, receipt_padding_digits, receipt_separator 
        FROM settings WHERE id = 1
      `)
      const s = settingRows.length > 0 ? settingRows[0] : {}
      const prefix = (s.receipt_prefix !== undefined && s.receipt_prefix !== null && String(s.receipt_prefix).trim() !== '') ? String(s.receipt_prefix).trim() : 'SIS-REC'
      const month = s.receipt_month
      const fy = (s.receipt_financial_year && String(s.receipt_financial_year).trim()) ? String(s.receipt_financial_year).trim() : '2026-27'
      const startNum = parseInt(s.receipt_starting_number, 10) || 1
      const padding = parseInt(s.receipt_padding_digits, 10) || 4
      const sep = (s.receipt_separator !== undefined && s.receipt_separator !== null) ? s.receipt_separator : '/'

      const effectiveDate = await getEffectiveIstDate(pool, invoice_date)
      // Extract numeric sequence from invoice_number if available
      const match = invoice_number.match(/(\d+)$/)
      const seq = match ? parseInt(match[1], 10) : startNum
      finalReceiptNumber = buildDynamicNumber(prefix, sep, month, fy, seq, padding, invoice_date, effectiveDate)
    }

    // Clean payment mode (null if Select or empty)
    const sanitizedPaymentMode = (payment_mode === 'Select' || payment_mode === '' || !payment_mode) ? null : payment_mode
    const finalDeliveryAddress = same_as_billing ? (customer_address ? customer_address.trim() : null) : (delivery_address ? delivery_address.trim() : null)

    // Snapshot company settings at time of bill creation (Legal Audit Immutability)
    const [snapshotSettingRows] = await pool.query('SELECT * FROM settings WHERE id = 1')
    const currentSettings = snapshotSettingRows.length > 0 ? snapshotSettingRows[0] : {}
    let parsedTerms = []
    if (typeof currentSettings.terms_conditions === 'string') {
      try { parsedTerms = JSON.parse(currentSettings.terms_conditions) } catch { parsedTerms = [] }
    } else if (Array.isArray(currentSettings.terms_conditions)) {
      parsedTerms = currentSettings.terms_conditions
    }

    let parsedInvoiceTerms = []
    if (typeof currentSettings.invoice_terms === 'string') {
      try { parsedInvoiceTerms = JSON.parse(currentSettings.invoice_terms) } catch { parsedInvoiceTerms = [] }
    } else if (Array.isArray(currentSettings.invoice_terms)) {
      parsedInvoiceTerms = currentSettings.invoice_terms
    }
    let parsedReceiptTerms = []
    if (typeof currentSettings.receipt_terms === 'string') {
      try { parsedReceiptTerms = JSON.parse(currentSettings.receipt_terms) } catch { parsedReceiptTerms = [] }
    } else if (Array.isArray(currentSettings.receipt_terms)) {
      parsedReceiptTerms = currentSettings.receipt_terms
    }
    const finalInvoiceTerms = parsedInvoiceTerms.length > 0 ? parsedInvoiceTerms : parsedTerms

    let parsedReturnTerms = []
    if (typeof currentSettings.return_terms === 'string') {
      try { parsedReturnTerms = JSON.parse(currentSettings.return_terms) } catch { parsedReturnTerms = [] }
    } else if (Array.isArray(currentSettings.return_terms)) {
      parsedReturnTerms = currentSettings.return_terms
    }

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
      invoice_terms: finalInvoiceTerms,
      receipt_terms: parsedReceiptTerms,
      return_terms: parsedReturnTerms,
      terms_conditions: finalInvoiceTerms,
      return_days: currentSettings.return_days !== undefined && currentSettings.return_days !== null ? currentSettings.return_days : 0,
      return_policy_clause: currentSettings.return_policy_clause || '',
      due_date_days: currentSettings.due_date_days !== undefined && currentSettings.due_date_days !== null ? currentSettings.due_date_days : 15
    })

    // Insert into bills table
    const [billResult] = await pool.query(`
      INSERT INTO bills (
        invoice_number, receipt_number, invoice_date, due_date, has_due_date, invoice_type, copy_type,
        customer_name, customer_type, customer_phone, customer_email, customer_address, delivery_address, same_as_billing, customer_gstin,
        place_of_supply, taxable_amount, cgst_rate, cgst_amount,
        sgst_rate, sgst_amount, igst_rate, igst_amount,
        total_tax, round_off, total_amount, amount_in_words,
        payment_mode, payment_status, notes, company_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice_number.trim(),
      finalReceiptNumber,
      invoice_date || new Date().toISOString().split('T')[0],
      has_due_date ? (due_date || null) : null,
      has_due_date ? 1 : 0,
      invoice_type,
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
      sanitizedPaymentMode,
      payment_status || 'Pending',
      notes || '',
      companySnapshot
    ])


    const billId = billResult.insertId

    // Insert Bill Items
    for (const item of items) {
      await pool.query(`
        INSERT INTO bill_items (
          bill_id, material_id, item_name, serial_number,
          hsn_code, quantity, unit, rate, has_discount, discount_percent, discount_amount, original_rate,
          tax_rate, tax_amount, amount, return_policy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        billId,
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

      // Deduct Materials current_stock (-) and record in stock_ledger
      const materialId = item.material_id ? parseInt(item.material_id, 10) : null
      if (materialId) {
        try {
          const qtyVal = parseFloat(item.quantity) || 1
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [materialId])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const newStock = Math.max(0, currentStock - qtyVal)

            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, materialId])

            await pool.query(`
              INSERT INTO stock_ledger (
                material_id, movement_type, reference_number,
                quantity_change, balance_stock, notes
              ) VALUES (?, 'OUTWARD_SALE', ?, ?, ?, ?)
            `, [
              materialId,
              invoice_number.trim(),
              -qtyVal,
              newStock,
              `Outward Sale #${invoice_number.trim()} (${customer_name.trim()})`
            ])
          }
        } catch (stockErr) {
          console.error('Error updating stock on outward bill:', stockErr)
        }
      }

      // Update Serial Numbers status to 'Sold' in inventory_serials
      const billedSerials = []
      if (Array.isArray(item.serial_numbers)) {
        item.serial_numbers.forEach(s => {
          if (s && String(s).trim()) billedSerials.push(String(s).trim())
        })
      } else if (item.serial_number && String(item.serial_number).trim()) {
        String(item.serial_number).split(',').forEach(s => {
          if (s && s.trim()) billedSerials.push(s.trim())
        })
      }

      if (materialId && billedSerials.length > 0) {
        for (const sn of billedSerials) {
          try {
            const [updateRes] = await pool.query(
              'UPDATE inventory_serials SET status = "Sold", updated_at = NOW() WHERE material_id = ? AND LOWER(serial_number) = LOWER(?)',
              [materialId, sn]
            )
            if (updateRes.affectedRows === 0) {
              await pool.query(
                'INSERT INTO inventory_serials (material_id, serial_number, status) VALUES (?, ?, "Sold") ON DUPLICATE KEY UPDATE status = "Sold", updated_at = NOW()',
                [materialId, sn]
              )
            }
          } catch (serialErr) {
            console.error('Error updating inventory serial to Sold:', serialErr)
          }
        }
      }
    }

    // Trigger Automated Email Dispatch in Background if configured (TEMPORARILY DISABLED AS REQUESTED)
    /*
    (async () => {
      try {
        const [configRows] = await pool.query('SELECT auto_email_on_create, smtp_user, smtp_pass FROM email_configs WHERE id = 1')
        if (configRows.length > 0 && configRows[0].auto_email_on_create && configRows[0].smtp_user && configRows[0].smtp_pass) {
          console.log(`📤 Auto-dispatching invoice PDF email for bill #${invoice_number}...`)
          await sendInvoiceEmail(billId)
        }
      } catch (e) {
        console.error('Auto-email background dispatch error:', e)
      }
    })()
    */

    return res.status(201).json({
      success: true,
      message: 'Bill created successfully!',
      billId,
      invoiceNumber: invoice_number
    })
  } catch (error) {
    console.error('Error creating bill:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create bill in database.'
    })
  }
}

// Get All Bills with line items and statistics
export async function getAllBills(req, res) {
  try {
    const pool = getPool()
    
    // High-performance lean query: Avoids loading entire bill_items table into server memory
    const [bills] = await pool.query(`
      SELECT 
        b.*,
        (SELECT COUNT(bi.id) FROM bill_items bi WHERE bi.bill_id = b.id) AS total_items
      FROM bills b
      ORDER BY b.id DESC
    `)

    const billsFormatted = bills.map(bill => ({
      ...bill,
      receipt_number: ensureReceiptHasMonth(bill.receipt_number, bill.invoice_date || bill.created_at),
      items: [] // Items are fetched on-demand via getBillById(id) when viewing/printing
    }))

    // Overall summary metrics
    const totalRevenue = bills.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)
    const paidCount = bills.filter(b => b.payment_status === 'Paid').length
    const pendingCount = bills.filter(b => b.payment_status === 'Pending').length

    return res.status(200).json({
      success: true,
      count: billsFormatted.length,
      bills: billsFormatted,
      stats: {
        totalBills: bills.length,
        totalRevenue,
        paidCount,
        pendingCount
      }
    })
  } catch (error) {
    console.error('Error fetching bills:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bills.'
    })
  }
}

// Get Single Bill with its line items
export async function getBillById(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [bills] = await pool.query('SELECT * FROM bills WHERE id = ? OR invoice_number = ?', [id, id])
    if (bills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      })
    }

    const bill = bills[0]
    const [items] = await pool.query(`
      SELECT 
        bi.*, 
        m.current_stock, 
        m.opening_stock, 
        m.category_id,
        m.serial_tracking, 
        m.has_discount AS mat_has_discount, 
        m.discount_percent AS mat_discount_percent, 
        m.selling_price AS mat_selling_price
      FROM bill_items bi
      LEFT JOIN materials m ON bi.material_id = m.id
      WHERE bi.bill_id = ?
      ORDER BY bi.id ASC
    `, [bill.id])

    return res.status(200).json({
      success: true,
      bill: {
        ...bill,
        receipt_number: ensureReceiptHasMonth(bill.receipt_number, bill.invoice_date || bill.created_at),
        items
      }
    })
  } catch (error) {
    console.error('Error fetching bill details:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bill details.'
    })
  }
}

// Delete Bill
export async function deleteBill(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [existing] = await pool.query('SELECT id, invoice_number FROM bills WHERE id = ?', [id])
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      })
    }

    const invoiceNo = existing[0].invoice_number

    // 1. Restore stock and serials for all items
    const [items] = await pool.query('SELECT material_id, quantity, serial_number FROM bill_items WHERE bill_id = ?', [id])
    for (const item of items) {
      if (item.material_id) {
        try {
          const qtyVal = parseFloat(item.quantity) || 1
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [item.material_id])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const newStock = currentStock + qtyVal

            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, item.material_id])

            await pool.query(`
              INSERT INTO stock_ledger (
                material_id, movement_type, reference_number,
                quantity_change, balance_stock, notes
              ) VALUES (?, 'OUTWARD_REVERSAL', ?, ?, ?, ?)
            `, [
              item.material_id,
              invoiceNo,
              qtyVal,
              newStock,
              `Deleted Invoice #${invoiceNo}`
            ])
          }
        } catch (restoreErr) {
          console.error('Error restoring stock on bill delete:', restoreErr)
        }

        // Restore serial numbers to Available
        if (item.serial_number && String(item.serial_number).trim()) {
          const serials = String(item.serial_number).split(',').map(s => s.trim()).filter(Boolean)
          for (const sn of serials) {
            try {
              await pool.query(
                'UPDATE inventory_serials SET status = "Available", updated_at = NOW() WHERE material_id = ? AND LOWER(serial_number) = LOWER(?)',
                [item.material_id, sn]
              )
            } catch (snErr) {
              console.error('Error freeing serial on bill delete:', snErr)
            }
          }
        }
      }
    }

    // 2. Delete bill (cascades items)
    await pool.query('DELETE FROM bills WHERE id = ?', [id])

    return res.status(200).json({
      success: true,
      message: `Bill #${invoiceNo} deleted successfully.`
    })
  } catch (error) {
    console.error('Error deleting bill:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete bill.'
    })
  }
}

// Update Bill Payment Mode and/or Status
export async function updateBillPayment(req, res) {
  try {
    const { id } = req.params
    const { payment_mode, payment_status, cancellation_reason } = req.body
    const pool = getPool()

    const [oldBillRows] = await pool.query('SELECT * FROM bills WHERE id = ?', [id])
    if (oldBillRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      })
    }

    const oldBill = oldBillRows[0]
    const oldStatus = oldBill.payment_status || 'Pending'

    const fields = []
    const values = []

    if (payment_mode !== undefined) {
      fields.push('payment_mode = ?')
      values.push(payment_mode)
    }
    if (payment_status !== undefined) {
      fields.push('payment_status = ?')
      values.push(payment_status)
      const isCancelling = String(payment_status).trim().toLowerCase() === 'cancelled' || String(payment_status).trim().toLowerCase() === 'cancel'
      if (isCancelling) {
        fields.push('cancelled_at = NOW()')
      } else {
        fields.push('cancelled_at = NULL')
      }
    }
    if (cancellation_reason !== undefined) {
      fields.push('cancellation_reason = ?')
      values.push(cancellation_reason)
    }
    fields.push('updated_at = NOW()')

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No payment fields provided for update.'
      })
    }

    values.push(id)
    const [result] = await pool.query(`UPDATE bills SET ${fields.join(', ')} WHERE id = ?`, values)

    // Handle Stock & Serial Number Restoration on Cancellation / Re-activation
    if (payment_status !== undefined && String(payment_status).trim().toLowerCase() !== String(oldStatus).trim().toLowerCase()) {
      const isNewCancelled = String(payment_status).trim().toLowerCase() === 'cancelled' || String(payment_status).trim().toLowerCase() === 'cancel'
      const isOldCancelled = String(oldStatus).trim().toLowerCase() === 'cancelled' || String(oldStatus).trim().toLowerCase() === 'cancel'

      if (isNewCancelled && !isOldCancelled) {
        // Bill is being Cancelled -> Restore Stock & Free Serials
        const [items] = await pool.query('SELECT material_id, quantity, serial_number FROM bill_items WHERE bill_id = ?', [id])
        for (const item of items) {
          const matId = item.material_id ? parseInt(item.material_id, 10) : null
          const qtyVal = parseFloat(item.quantity) || 1

          if (matId) {
            try {
              const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [matId])
              if (matRows.length > 0) {
                const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
                const newStock = currentStock + qtyVal
                await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, matId])

                await pool.query(`
                  INSERT INTO stock_ledger (
                    material_id, movement_type, reference_number,
                    quantity_change, balance_stock, notes
                  ) VALUES (?, 'OUTWARD_REVERSAL', ?, ?, ?, ?)
                `, [
                  matId,
                  oldBill.invoice_number,
                  qtyVal,
                  newStock,
                  `Cancelled Outward Bill #${oldBill.invoice_number} (${oldBill.customer_name})${cancellation_reason ? ` - Reason: ${cancellation_reason}` : ''}`
                ])
              }
            } catch (stockErr) {
              console.error('Error restoring stock on bill cancel:', stockErr)
            }

            // Restore Serials to Available
            if (item.serial_number && String(item.serial_number).trim()) {
              const serials = String(item.serial_number).split(',').map(s => s.trim()).filter(Boolean)
              for (const sn of serials) {
                try {
                  await pool.query(
                    'UPDATE inventory_serials SET status = "Available", updated_at = NOW() WHERE material_id = ? AND LOWER(serial_number) = LOWER(?)',
                    [matId, sn]
                  )
                } catch (snErr) {
                  console.error('Error freeing serial on bill cancel:', snErr)
                }
              }
            }
          }
        }
      } else if (!isNewCancelled && isOldCancelled) {
        // Bill is being Re-activated from Cancelled -> Deduct Stock & Re-mark Serials as Sold
        const [items] = await pool.query('SELECT material_id, quantity, serial_number FROM bill_items WHERE bill_id = ?', [id])
        for (const item of items) {
          const matId = item.material_id ? parseInt(item.material_id, 10) : null
          const qtyVal = parseFloat(item.quantity) || 1

          if (matId) {
            try {
              const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [matId])
              if (matRows.length > 0) {
                const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
                const newStock = Math.max(0, currentStock - qtyVal)
                await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, matId])

                await pool.query(`
                  INSERT INTO stock_ledger (
                    material_id, movement_type, reference_number,
                    quantity_change, balance_stock, notes
                  ) VALUES (?, 'OUTWARD_SALE', ?, ?, ?, ?)
                `, [
                  matId,
                  oldBill.invoice_number,
                  -qtyVal,
                  newStock,
                  `Re-activated Outward Bill #${oldBill.invoice_number} (${oldBill.customer_name})`
                ])
              }
            } catch (stockErr) {
              console.error('Error re-deducting stock on bill reactivate:', stockErr)
            }

            // Mark Serials as Sold
            if (item.serial_number && String(item.serial_number).trim()) {
              const serials = String(item.serial_number).split(',').map(s => s.trim()).filter(Boolean)
              for (const sn of serials) {
                try {
                  await pool.query(
                    'UPDATE inventory_serials SET status = "Sold", updated_at = NOW() WHERE material_id = ? AND LOWER(serial_number) = LOWER(?)',
                    [matId, sn]
                  )
                } catch (snErr) {
                  console.error('Error remarking serial to Sold:', snErr)
                }
              }
            }
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment information updated successfully.'
    })
  } catch (error) {
    console.error('Error updating bill payment:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment information.'
    })
  }
}

// Send Receipt Email to Customer
export async function sendBillReceiptEmail(req, res) {
  try {
    const { id } = req.params
    const { email, recipient: customRecip, pdf_base64, pdfBase64 } = req.body || {}

    const pool = getPool()
    const [bills] = await pool.query('SELECT * FROM bills WHERE id = ?', [id])
    if (bills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice bill record not found.'
      })
    }

    const bill = bills[0]
    const recipient = email || customRecip || bill.customer_email

    if (!recipient || !recipient.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer email address is required to dispatch the receipt.'
      })
    }

    const result = await sendReceiptEmail(id, recipient, pdf_base64 || pdfBase64)
    if (!result.success) {
      return res.status(500).json(result)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error sending receipt email:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch receipt email.'
    })
  }
}

// Update Existing Bill with Line Items and Stock Reconciliation
export async function updateBill(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [existing] = await pool.query('SELECT * FROM bills WHERE id = ?', [id])
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      })
    }

    const {
      invoice_number,
      receipt_number,
      invoice_date,
      due_date = null,
      has_due_date = true,
      invoice_type = 'NON_GST',
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
      payment_mode = null,
      payment_status = 'Pending',
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

    // 1. Restore previous stock for old items
    const [oldItems] = await pool.query('SELECT material_id, quantity FROM bill_items WHERE bill_id = ?', [id])
    for (const oldIt of oldItems) {
      if (oldIt.material_id) {
        try {
          const oldQty = parseFloat(oldIt.quantity) || 0
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [oldIt.material_id])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const restoredStock = currentStock + oldQty
            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [restoredStock, oldIt.material_id])
          }
        } catch (e) {
          console.error('Error restoring stock on bill edit:', e)
        }
      }
    }

    // Delete old items
    await pool.query('DELETE FROM bill_items WHERE bill_id = ?', [id])

    // 2. Update bills table
    const sanitizedPaymentMode = (payment_mode === 'Select' || payment_mode === '' || !payment_mode) ? null : payment_mode
    const finalDeliveryAddress = same_as_billing ? (customer_address ? customer_address.trim() : null) : (delivery_address ? delivery_address.trim() : null)

    await pool.query(`
      UPDATE bills SET
        invoice_number = ?,
        receipt_number = ?,
        invoice_date = ?,
        due_date = ?,
        has_due_date = ?,
        invoice_type = ?,
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
        payment_mode = ?,
        payment_status = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      (existing[0].invoice_number || invoice_number || '').trim(),
      (existing[0].receipt_number || receipt_number || null),
      invoice_date || existing[0].invoice_date,
      has_due_date ? (due_date || null) : null,
      has_due_date ? 1 : 0,
      invoice_type,
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
      sanitizedPaymentMode,
      payment_status || 'Pending',
      notes || '',
      id
    ])

    // 3. Insert updated items & deduct new stock
    for (const item of items) {
      await pool.query(`
        INSERT INTO bill_items (
          bill_id, material_id, item_name, serial_number,
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

      const materialId = item.material_id ? parseInt(item.material_id, 10) : null
      if (materialId) {
        try {
          const qtyVal = parseFloat(item.quantity) || 1
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [materialId])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const newStock = Math.max(0, currentStock - qtyVal)
            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, materialId])

            await pool.query(`
              INSERT INTO stock_ledger (
                material_id, movement_type, reference_number,
                quantity_change, balance_stock, notes
              ) VALUES (?, 'OUTWARD_SALE', ?, ?, ?, ?)
            `, [
              materialId,
              (invoice_number || existing[0].invoice_number).trim(),
              -qtyVal,
              newStock,
              `Updated Outward Sale #${(invoice_number || existing[0].invoice_number).trim()} (${customer_name.trim()})`
            ])
          }
        } catch (stockErr) {
          console.error('Error updating stock on outward bill edit:', stockErr)
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Bill updated successfully!',
      billId: id,
      invoiceNumber: invoice_number || existing[0].invoice_number
    })
  } catch (error) {
    console.error('Error updating bill:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update bill in database.'
    })
  }
}


