import { getPool } from '../config/db.js'
import { sendReceiptEmail, sendServiceQuotationEmail, sendServiceInvoiceEmail } from '../services/emailService.js'

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

  const cleanPrefix = String(prefix || 'SIS-SR').replace(/[-/.]+$/, '')
  return `${cleanPrefix}${sep}${activeMonth}${sep}${activeFy}${sep}${String(seqNum).padStart(padding, '0')}`
}

// Generate next formatted service number based on system settings
export async function getNextServiceNumber(req, res) {
  try {
    const targetDate = req.query.date || null
    const pool = getPool()
    
    // Get service settings
    const [settingRows] = await pool.query(`
      SELECT service_prefix, service_month, service_financial_year, service_starting_number, service_padding_digits, service_separator 
      FROM settings WHERE id = 1
    `)
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const prefix = (s.service_prefix !== undefined && s.service_prefix !== null && String(s.service_prefix).trim() !== '') ? String(s.service_prefix).trim() : 'SIS-SR'
    const month = s.service_month
    const fy = s.service_financial_year
    const startNum = parseInt(s.service_starting_number, 10) || 1
    const padding = parseInt(s.service_padding_digits, 10) || 4
    const sep = (s.service_separator !== undefined && s.service_separator !== null) ? s.service_separator : '/'

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

    // Extract sequence numbers from existing service_bills matching current prefix/month/fy
    const pattern = `${cleanPrefix}${sep}${activeMonth}${sep}${activeFy}%`
    const [rows] = await pool.query('SELECT service_number FROM service_bills WHERE service_number LIKE ?', [pattern])
    let maxSeq = 0
    for (const r of rows) {
      if (r.service_number) {
        const srvStr = r.service_number.trim()
        const match = srvStr.match(/(\d+)$/)
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
      nextServiceNumber: formattedNumber
    })
  } catch (error) {
    console.error('Error generating next service number:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate service number.'
    })
  }
}

// Create New Service Request Bill with Line Items
export async function createServiceBill(req, res) {
  try {
    const {
      service_number,
      receipt_number,
      service_date,
      service_type = 'NON_GST',
      copy_type = 'ORIGINAL',
      customer_name,
      customer_type = 'Individual',
      customer_phone,
      customer_email,
      customer_address,
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
      service_status = 'Received',
      notes = '',
      items = []
    } = req.body

    if (!service_number || !service_number.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Service Number is required.'
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
        message: 'At least one line item is required to create a service request.'
      })
    }

    const pool = getPool()

    // Check duplicate service number
    const [existing] = await pool.query('SELECT id FROM service_bills WHERE service_number = ?', [service_number.trim()])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Service number "${service_number}" already exists. Please choose a different number.`
      })
    }

    // Determine receipt_number if not provided
    let finalReceiptNumber = (receipt_number || '').trim()
    if (!finalReceiptNumber) {
      const [settingRows] = await pool.query(`
        SELECT 
          service_receipt_prefix, service_receipt_month, service_receipt_financial_year, service_receipt_starting_number, service_receipt_padding_digits, service_receipt_separator,
          receipt_prefix, receipt_month, receipt_financial_year, receipt_starting_number, receipt_padding_digits, receipt_separator 
        FROM settings WHERE id = 1
      `)
      const s = settingRows.length > 0 ? settingRows[0] : {}
      const hasServiceRec = (s.service_receipt_prefix !== undefined && s.service_receipt_prefix !== null && String(s.service_receipt_prefix).trim() !== '')
      const prefix = hasServiceRec 
        ? String(s.service_receipt_prefix).trim() 
        : ((s.receipt_prefix !== undefined && s.receipt_prefix !== null && String(s.receipt_prefix).trim() !== '') ? String(s.receipt_prefix).trim() : 'SIS-REC')
      const month = hasServiceRec ? s.service_receipt_month : s.receipt_month
      const fy = hasServiceRec 
        ? (s.service_receipt_financial_year && String(s.service_receipt_financial_year).trim() ? String(s.service_receipt_financial_year).trim() : '2026-27')
        : ((s.receipt_financial_year && String(s.receipt_financial_year).trim()) ? String(s.receipt_financial_year).trim() : '2026-27')
      const startNum = hasServiceRec
        ? (parseInt(s.service_receipt_starting_number, 10) || 1)
        : (parseInt(s.receipt_starting_number, 10) || 1)
      const padding = hasServiceRec
        ? (parseInt(s.service_receipt_padding_digits, 10) || 4)
        : (parseInt(s.receipt_padding_digits, 10) || 4)
      const sep = hasServiceRec
        ? ((s.service_receipt_separator !== undefined && s.service_receipt_separator !== null) ? s.service_receipt_separator : '/')
        : ((s.receipt_separator !== undefined && s.receipt_separator !== null) ? s.receipt_separator : '/')

      const effectiveDate = await getEffectiveIstDate(pool, service_date)
      const match = service_number.match(/(\d+)$/)
      const seq = match ? parseInt(match[1], 10) : startNum
      finalReceiptNumber = buildDynamicNumber(prefix, sep, month, fy, seq, padding, service_date, effectiveDate)
    }

    const sanitizedPaymentMode = (payment_mode === 'Select' || payment_mode === '' || !payment_mode) ? null : payment_mode

    // Snapshot company settings at time of service bill creation (Legal Audit Immutability)
    const [snapshotSettingRows] = await pool.query('SELECT * FROM settings WHERE id = 1')
    const currentSettings = snapshotSettingRows.length > 0 ? snapshotSettingRows[0] : {}
    let parsedTerms = []
    if (typeof currentSettings.terms_conditions === 'string') {
      try { parsedTerms = JSON.parse(currentSettings.terms_conditions) } catch { parsedTerms = [] }
    } else if (Array.isArray(currentSettings.terms_conditions)) {
      parsedTerms = currentSettings.terms_conditions
    }

    let parsedServiceTerms = []
    if (typeof currentSettings.service_terms === 'string') {
      try { parsedServiceTerms = JSON.parse(currentSettings.service_terms) } catch { parsedServiceTerms = [] }
    } else if (Array.isArray(currentSettings.service_terms)) {
      parsedServiceTerms = currentSettings.service_terms
    }
    let parsedServiceReceiptTerms = []
    if (typeof currentSettings.service_receipt_terms === 'string') {
      try { parsedServiceReceiptTerms = JSON.parse(currentSettings.service_receipt_terms) } catch { parsedServiceReceiptTerms = [] }
    } else if (Array.isArray(currentSettings.service_receipt_terms)) {
      parsedServiceReceiptTerms = currentSettings.service_receipt_terms
    }
    let parsedServiceQuotationTerms = []
    if (typeof currentSettings.service_quotation_terms === 'string') {
      try { parsedServiceQuotationTerms = JSON.parse(currentSettings.service_quotation_terms) } catch { parsedServiceQuotationTerms = [] }
    } else if (Array.isArray(currentSettings.service_quotation_terms)) {
      parsedServiceQuotationTerms = currentSettings.service_quotation_terms
    }

    const finalServiceTerms = parsedServiceTerms.length > 0 ? parsedServiceTerms : (parsedTerms.length > 0 ? parsedTerms : [])

    // Determine service quotation number based on service quotation numbering settings
    let finalQuotationNumber = (req.body.quotation_number || '').trim()
    if (!finalQuotationNumber) {
      const hasServiceQtn = (currentSettings.service_quotation_prefix !== undefined && currentSettings.service_quotation_prefix !== null && String(currentSettings.service_quotation_prefix).trim() !== '')
      const prefix = hasServiceQtn 
        ? String(currentSettings.service_quotation_prefix).trim() 
        : 'SIS-QTN-S'
      const month = currentSettings.service_quotation_month
      const fy = currentSettings.service_quotation_financial_year
      const startNum = parseInt(currentSettings.service_quotation_starting_number, 10) || 1
      const padding = parseInt(currentSettings.service_quotation_padding_digits, 10) || 4
      const sep = (currentSettings.service_quotation_separator !== undefined && currentSettings.service_quotation_separator !== null) ? currentSettings.service_quotation_separator : '/'

      const effectiveDate = await getEffectiveIstDate(pool, service_date)
      const match = service_number.match(/(\d+)$/)
      const seq = match ? parseInt(match[1], 10) : startNum
      finalQuotationNumber = buildDynamicNumber(prefix, sep, month, fy, seq, padding, service_date, effectiveDate)
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
      service_terms: finalServiceTerms,
      service_receipt_terms: parsedServiceReceiptTerms,
      service_quotation_terms: parsedServiceQuotationTerms,
      terms_conditions: finalServiceTerms,
      return_days: currentSettings.return_days !== undefined && currentSettings.return_days !== null ? currentSettings.return_days : 0,
      return_policy_clause: currentSettings.return_policy_clause || ''
    })

    // Insert into service_bills table
    const [billResult] = await pool.query(`
      INSERT INTO service_bills (
        service_number, quotation_number, receipt_number, service_date, service_type, copy_type,
        customer_name, customer_type, customer_phone, customer_email, customer_address, customer_gstin,
        place_of_supply, taxable_amount, cgst_rate, cgst_amount,
        sgst_rate, sgst_amount, igst_rate, igst_amount,
        total_tax, round_off, total_amount, amount_in_words,
        payment_mode, service_status, notes, company_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      service_number.trim(),
      finalQuotationNumber,
      finalReceiptNumber,
      service_date || new Date().toISOString().split('T')[0],
      service_type,
      copy_type,
      customer_name.trim(),
      customer_type || 'Individual',
      customer_phone ? customer_phone.trim() : null,
      customer_email ? customer_email.trim() : null,
      customer_address ? customer_address.trim() : null,
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
      service_status || 'Received',
      notes || '',
      companySnapshot
    ])

    const serviceBillId = billResult.insertId

    // Insert Service Items
    for (const item of items) {
      const serialsArray = Array.isArray(item.serial_numbers)
        ? item.serial_numbers.filter(s => s && s.trim())
        : (item.serial_number ? [item.serial_number.trim()] : [])
      const serialsStr = serialsArray.join(', ') || null
      const serialsJson = serialsArray.length > 0 ? JSON.stringify(serialsArray) : null

      await pool.query(`
        INSERT INTO service_bill_items (
          service_bill_id, material_id, item_name, product_name, brand_model,
          issue_description, serial_number, serial_numbers, has_serial,
          hsn_code, quantity, unit, rate, tax_rate, tax_amount, amount, return_policy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        serviceBillId,
        item.material_id ? parseInt(item.material_id, 10) : null,
        item.product_name || item.item_name || 'Service Product',
        item.product_name ? item.product_name.trim() : (item.item_name ? item.item_name.trim() : ''),
        item.brand_model ? item.brand_model.trim() : null,
        item.issue_description ? item.issue_description.trim() : null,
        serialsStr,
        serialsJson,
        item.has_serial ? 1 : 0,
        item.hsn_code ? item.hsn_code.trim() : null,
        parseFloat(item.quantity) || 1,
        item.unit || 'NOS',
        parseFloat(item.rate) || 0,
        parseFloat(item.tax_rate) || 18.00,
        parseFloat(item.tax_amount) || 0,
        parseFloat(item.amount) || 0,
        item.return_policy ? 1 : 0
      ])
    }

    return res.status(201).json({
      success: true,
      message: 'Service request created successfully!',
      serviceId: serviceBillId,
      service_number: service_number.trim(),
      receipt_number: finalReceiptNumber
    })
  } catch (error) {
    console.error('Error creating service bill:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save service request.'
    })
  }
}

// Update Existing Service Request Bill & Items
export async function updateServiceBill(req, res) {
  try {
    const { id } = req.params
    const {
      service_date,
      service_type = 'NON_GST',
      copy_type = 'ORIGINAL',
      customer_name,
      customer_type = 'Individual',
      customer_phone,
      customer_email,
      customer_address,
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
      service_status = 'Received',
      notes = '',
      items = []
    } = req.body

    const pool = getPool()

    const [existing] = await pool.query('SELECT id, service_number FROM service_bills WHERE id = ?', [id])
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service bill not found.'
      })
    }

    const sanitizedPaymentMode = (payment_mode === 'Select' || payment_mode === '' || !payment_mode) ? null : payment_mode

    // Update service_bills master
    await pool.query(`
      UPDATE service_bills SET
        service_date = ?,
        service_type = ?,
        copy_type = ?,
        customer_name = ?,
        customer_type = ?,
        customer_phone = ?,
        customer_email = ?,
        customer_address = ?,
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
        service_status = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      service_date || new Date().toISOString().split('T')[0],
      service_type,
      copy_type,
      customer_name ? customer_name.trim() : '',
      customer_type || 'Individual',
      customer_phone ? customer_phone.trim() : null,
      customer_email ? customer_email.trim() : null,
      customer_address ? customer_address.trim() : null,
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
      service_status || 'Received',
      notes || '',
      id
    ])

    // Replace items
    await pool.query('DELETE FROM service_bill_items WHERE service_bill_id = ?', [id])

    for (const item of items) {
      const serialsArray = Array.isArray(item.serial_numbers)
        ? item.serial_numbers.filter(s => s && s.trim())
        : (item.serial_number ? [item.serial_number.trim()] : [])
      const serialsStr = serialsArray.join(', ') || null
      const serialsJson = serialsArray.length > 0 ? JSON.stringify(serialsArray) : null

      await pool.query(`
        INSERT INTO service_bill_items (
          service_bill_id, material_id, item_name, product_name, brand_model,
          issue_description, serial_number, serial_numbers, has_serial,
          hsn_code, quantity, unit, rate, tax_rate, tax_amount, amount, return_policy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        item.material_id ? parseInt(item.material_id, 10) : null,
        item.product_name || item.item_name || 'Service Product',
        item.product_name ? item.product_name.trim() : (item.item_name ? item.item_name.trim() : ''),
        item.brand_model ? item.brand_model.trim() : null,
        item.issue_description ? item.issue_description.trim() : null,
        serialsStr,
        serialsJson,
        item.has_serial ? 1 : 0,
        item.hsn_code ? item.hsn_code.trim() : null,
        parseFloat(item.quantity) || 1,
        item.unit || 'NOS',
        parseFloat(item.rate) || 0,
        parseFloat(item.tax_rate) || 18.00,
        parseFloat(item.tax_amount) || 0,
        parseFloat(item.amount) || 0,
        item.return_policy ? 1 : 0
      ])
    }

    return res.status(200).json({
      success: true,
      message: 'Service request updated successfully!',
      serviceId: id
    })
  } catch (error) {
    console.error('Error updating service bill:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update service request.'
    })
  }
}

// Get All Service Bills with Line Items and KPI Metrics
export async function getServiceBills(req, res) {
  try {
    const pool = getPool()

    const [ [services], [allItems] ] = await Promise.all([
      pool.query(`
        SELECT 
          s.*,
          COUNT(si.id) as total_items
        FROM service_bills s
        LEFT JOIN service_bill_items si ON s.id = si.service_bill_id
        GROUP BY s.id
        ORDER BY s.id DESC
      `),
      pool.query(`
        SELECT * FROM service_bill_items ORDER BY id ASC
      `)
    ])

    const itemsByServiceId = {}
    allItems.forEach(item => {
      if (!itemsByServiceId[item.service_bill_id]) {
        itemsByServiceId[item.service_bill_id] = []
      }
      itemsByServiceId[item.service_bill_id].push(item)
    })

    const [settingRows] = await pool.query('SELECT * FROM settings WHERE id = 1')
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const prefix = (s.service_quotation_prefix !== undefined && s.service_quotation_prefix !== null && String(s.service_quotation_prefix).trim() !== '') ? String(s.service_quotation_prefix).trim() : 'SIS-QTN-S'
    const month = s.service_quotation_month
    const fy = s.service_quotation_financial_year
    const startNum = parseInt(s.service_quotation_starting_number, 10) || 1
    const padding = parseInt(s.service_quotation_padding_digits, 10) || 4
    const sep = (s.service_quotation_separator !== undefined && s.service_quotation_separator !== null) ? s.service_quotation_separator : '/'

    const servicesWithItems = services.map(srv => {
      let qNum = srv.quotation_number
      if (!qNum && srv.service_number) {
        const match = srv.service_number.match(/(\d+)$/)
        const seq = match ? parseInt(match[1], 10) : startNum
        qNum = buildDynamicNumber(prefix, sep, month, fy, seq, padding, srv.service_date, srv.created_at)
      }
      return {
        ...srv,
        quotation_number: qNum || srv.service_number,
        items: itemsByServiceId[srv.id] || []
      }
    })

    const totalValue = services.reduce((acc, s) => acc + (parseFloat(s.total_amount) || 0), 0)
    const completedCount = services.filter(s => s.service_status === 'Ready' || s.service_status === 'Delivered').length
    const pendingCount = services.filter(s => s.service_status !== 'Ready' && s.service_status !== 'Delivered').length
    const paidCount = services.filter(s => s.service_status === 'Payment Received' || s.service_status === 'Delivered').length

    return res.status(200).json({
      success: true,
      count: servicesWithItems.length,
      services: servicesWithItems,
      stats: {
        totalServices: services.length,
        totalValue,
        completedCount,
        pendingCount,
        paidCount
      }
    })
  } catch (error) {
    console.error('Error fetching service bills:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve service requests.'
    })
  }
}

// Get Single Service Bill with Items
export async function getServiceBillById(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [services] = await pool.query('SELECT * FROM service_bills WHERE id = ?', [id])
    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service bill not found.'
      })
    }

    const srv = services[0]
    let qNum = srv.quotation_number
    if (!qNum && srv.service_number) {
      const [settingRows] = await pool.query('SELECT * FROM settings WHERE id = 1')
      const s = settingRows.length > 0 ? settingRows[0] : {}
      const prefix = (s.service_quotation_prefix !== undefined && s.service_quotation_prefix !== null && String(s.service_quotation_prefix).trim() !== '') ? String(s.service_quotation_prefix).trim() : 'SIS-QTN-S'
      const month = s.service_quotation_month
      const fy = s.service_quotation_financial_year
      const startNum = parseInt(s.service_quotation_starting_number, 10) || 1
      const padding = parseInt(s.service_quotation_padding_digits, 10) || 4
      const sep = (s.service_quotation_separator !== undefined && s.service_quotation_separator !== null) ? s.service_quotation_separator : '/'
      const match = srv.service_number.match(/(\d+)$/)
      const seq = match ? parseInt(match[1], 10) : startNum
      qNum = buildDynamicNumber(prefix, sep, month, fy, seq, padding, srv.service_date, srv.created_at)
    }

    const [items] = await pool.query('SELECT * FROM service_bill_items WHERE service_bill_id = ? ORDER BY id ASC', [id])

    return res.status(200).json({
      success: true,
      service: {
        ...srv,
        quotation_number: qNum || srv.service_number,
        items
      }
    })
  } catch (error) {
    console.error('Error fetching service bill details:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch service bill details.'
    })
  }
}

// Update Service Status & Payment Mode Inline
export async function updateServiceStatus(req, res) {
  try {
    const { id } = req.params
    const { service_status, payment_mode, cancellation_reason } = req.body

    const pool = getPool()
    const updates = []
    const params = []

    if (service_status !== undefined) {
      updates.push('service_status = ?')
      params.push(service_status)

      if (service_status === 'Cancelled' || service_status === 'Cancel') {
        updates.push('cancelled_at = NOW()')
      }
    }

    if (cancellation_reason !== undefined) {
      updates.push('cancellation_reason = ?')
      params.push(cancellation_reason)
    }

    if (payment_mode !== undefined) {
      updates.push('payment_mode = ?')
      params.push(payment_mode === 'Select' || payment_mode === '' ? null : payment_mode)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update.'
      })
    }

    updates.push('updated_at = NOW()')
    params.push(id)

    const [result] = await pool.query(`UPDATE service_bills SET ${updates.join(', ')} WHERE id = ?`, params)

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service bill not found.'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Service updated successfully!'
    })
  } catch (error) {
    console.error('Error updating service:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update service.'
    })
  }
}

// Delete Service Bill
export async function deleteServiceBill(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [existing] = await pool.query('SELECT id, service_number FROM service_bills WHERE id = ?', [id])
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service bill not found.'
      })
    }

    await pool.query('DELETE FROM service_bills WHERE id = ?', [id])

    return res.status(200).json({
      success: true,
      message: `Service bill ${existing[0].service_number} deleted successfully.`
    })
  } catch (error) {
    console.error('Error deleting service bill:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete service bill.'
    })
  }
}

// Send Service Payment Receipt Email
export async function sendServiceReceiptEmail(req, res) {
  try {
    const { id } = req.params
    const { recipient_email, email, pdf_base64, pdfBase64 } = req.body || {}
    const pool = getPool()

    const [services] = await pool.query('SELECT * FROM service_bills WHERE id = ?', [id])
    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service bill not found.'
      })
    }

    const service = services[0]
    const targetEmail = (recipient_email || email || service.customer_email || '').trim()
    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required to dispatch receipt.'
      })
    }

    const [items] = await pool.query('SELECT * FROM service_bill_items WHERE service_bill_id = ? ORDER BY id ASC', [id])
    const [settingsRows] = await pool.query('SELECT * FROM settings WHERE id = 1 LIMIT 1')
    const settings = settingsRows.length > 0 ? settingsRows[0] : {}

    // Map service fields to bill structure for receipt email template
    const billPayload = {
      ...service,
      invoice_number: service.service_number,
      receipt_number: service.receipt_number || service.service_number,
      invoice_date: service.service_date,
      items
    }

    const emailResult = await sendReceiptEmail(billPayload, settings, targetEmail, pdf_base64 || pdfBase64)

    if (emailResult.success) {
      await pool.query('UPDATE service_bills SET receipt_email_sent = TRUE WHERE id = ?', [id])
      return res.status(200).json({
        success: true,
        message: `Service receipt email sent successfully to ${targetEmail}!`
      })
    } else {
      return res.status(500).json({
        success: false,
        message: emailResult.message || 'Failed to send service receipt email.'
      })
    }
  } catch (error) {
    console.error('Error sending service receipt email:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch service receipt email.'
    })
  }
}

// Send Service Quotation Email & Auto-Update Status to 'Quotations'
export async function sendServiceQuotationEmailController(req, res) {
  try {
    const { id } = req.params
    const { recipient_email, email, recipient, pdf_base64, pdfBase64 } = req.body || {}
    const targetEmail = recipient_email || email || recipient

    const result = await sendServiceQuotationEmail(id, targetEmail, pdf_base64 || pdfBase64)
    if (!result.success) {
      return res.status(500).json(result)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error dispatching service quotation email:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch service quotation email.'
    })
  }
}

// Send Service Invoice Email
export async function sendServiceInvoiceEmailController(req, res) {
  try {
    const { id } = req.params
    const { recipient_email, email, recipient, pdf_base64, pdfBase64 } = req.body || {}
    const targetEmail = recipient_email || email || recipient

    const result = await sendServiceInvoiceEmail(id, targetEmail, pdf_base64 || pdfBase64)
    if (!result.success) {
      return res.status(500).json(result)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error dispatching service invoice email:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch service invoice email.'
    })
  }
}

