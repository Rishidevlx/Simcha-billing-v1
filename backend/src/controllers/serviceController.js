import { getPool } from '../config/db.js'
import { sendReceiptEmail } from '../services/emailService.js'

// Generate next formatted service number based on system settings
export async function getNextServiceNumber(req, res) {
  try {
    const pool = getPool()
    
    // Get service settings
    const [settingRows] = await pool.query(`
      SELECT service_prefix, service_financial_year, service_starting_number, service_padding_digits, service_separator 
      FROM settings WHERE id = 1
    `)
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const prefix = (s.service_prefix !== undefined && s.service_prefix !== null && s.service_prefix.trim() !== '') ? s.service_prefix.trim() : 'SIS-SR'
    const fy = (s.service_financial_year && s.service_financial_year.trim()) ? s.service_financial_year.trim() : '2026-27'
    const startNum = parseInt(s.service_starting_number, 10) || 1
    const padding = parseInt(s.service_padding_digits, 10) || 4
    const sep = (s.service_separator !== undefined && s.service_separator !== null) ? s.service_separator : '/'

    // Extract sequence numbers from existing service_bills
    const [rows] = await pool.query('SELECT service_number FROM service_bills')
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
    const formattedNumber = `${prefix}${sep}${fy}${sep}${String(nextNum).padStart(padding, '0')}`

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
        SELECT receipt_prefix, receipt_financial_year, receipt_starting_number, receipt_padding_digits, receipt_separator 
        FROM settings WHERE id = 1
      `)
      const s = settingRows.length > 0 ? settingRows[0] : {}
      const prefix = (s.receipt_prefix !== undefined && s.receipt_prefix !== null && s.receipt_prefix.trim() !== '') ? s.receipt_prefix.trim() : 'SIS-REC'
      const fy = (s.receipt_financial_year && s.receipt_financial_year.trim()) ? s.receipt_financial_year.trim() : '2026-27'
      const startNum = parseInt(s.receipt_starting_number, 10) || 1
      const padding = parseInt(s.receipt_padding_digits, 10) || 4
      const sep = (s.receipt_separator !== undefined && s.receipt_separator !== null) ? s.receipt_separator : '/'

      const match = service_number.match(/(\d+)$/)
      const seq = match ? parseInt(match[1], 10) : startNum
      finalReceiptNumber = `${prefix}${sep}${fy}${sep}${String(seq).padStart(padding, '0')}`
    }

    const sanitizedPaymentMode = (payment_mode === 'Select' || payment_mode === '' || !payment_mode) ? null : payment_mode

    // Insert into service_bills table
    const [billResult] = await pool.query(`
      INSERT INTO service_bills (
        service_number, receipt_number, service_date, service_type, copy_type,
        customer_name, customer_type, customer_phone, customer_email, customer_address, customer_gstin,
        place_of_supply, taxable_amount, cgst_rate, cgst_amount,
        sgst_rate, sgst_amount, igst_rate, igst_amount,
        total_tax, round_off, total_amount, amount_in_words,
        payment_mode, service_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      service_number.trim(),
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
      notes || ''
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
        item.hsn_code ? item.hsn_code.trim() : '9987',
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
        item.hsn_code ? item.hsn_code.trim() : '9987',
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

    const [services] = await pool.query(`
      SELECT 
        s.*,
        COUNT(si.id) as total_items
      FROM service_bills s
      LEFT JOIN service_bill_items si ON s.id = si.service_bill_id
      GROUP BY s.id
      ORDER BY s.id DESC
    `)

    const [allItems] = await pool.query(`
      SELECT * FROM service_bill_items ORDER BY id ASC
    `)

    const itemsByServiceId = {}
    allItems.forEach(item => {
      if (!itemsByServiceId[item.service_bill_id]) {
        itemsByServiceId[item.service_bill_id] = []
      }
      itemsByServiceId[item.service_bill_id].push(item)
    })

    const servicesWithItems = services.map(srv => ({
      ...srv,
      items: itemsByServiceId[srv.id] || []
    }))

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

    const [items] = await pool.query('SELECT * FROM service_bill_items WHERE service_bill_id = ? ORDER BY id ASC', [id])

    return res.status(200).json({
      success: true,
      service: {
        ...services[0],
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
    const { service_status, payment_mode } = req.body

    const pool = getPool()
    const updates = []
    const params = []

    if (service_status !== undefined) {
      updates.push('service_status = ?')
      params.push(service_status)
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
    const { recipient_email } = req.body
    const pool = getPool()

    const [services] = await pool.query('SELECT * FROM service_bills WHERE id = ?', [id])
    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service bill not found.'
      })
    }

    const service = services[0]
    const targetEmail = (recipient_email || service.customer_email || '').trim()
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

    const emailResult = await sendReceiptEmail(billPayload, settings, targetEmail)

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
