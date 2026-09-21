import { getPool } from '../config/db.js'
import { sendInvoiceEmail, sendReceiptEmail } from '../services/emailService.js'

// Generate next formatted invoice number based on system settings
export async function getNextInvoiceNumber(req, res) {
  try {
    const pool = getPool()
    
    // Get invoice settings
    const [settingRows] = await pool.query(`
      SELECT invoice_prefix, invoice_financial_year, invoice_starting_number, invoice_padding_digits, invoice_separator 
      FROM settings WHERE id = 1
    `)
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const prefix = (s.invoice_prefix !== undefined && s.invoice_prefix !== null && s.invoice_prefix.trim() !== '') ? s.invoice_prefix.trim() : 'SIS'
    const fy = (s.invoice_financial_year && s.invoice_financial_year.trim()) ? s.invoice_financial_year.trim() : '2026-27'
    const startNum = parseInt(s.invoice_starting_number, 10) || 1
    const padding = parseInt(s.invoice_padding_digits, 10) || 4
    const sep = (s.invoice_separator !== undefined && s.invoice_separator !== null) ? s.invoice_separator : '/'

    // Extract sequence numbers from existing bills
    const [rows] = await pool.query('SELECT invoice_number FROM bills')
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
    const formattedNumber = `${prefix}${sep}${fy}${sep}${String(nextNum).padStart(padding, '0')}`

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
    const pool = getPool()
    
    // Get receipt settings
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

    // Extract sequence numbers from existing bills' receipt_number
    const [rows] = await pool.query('SELECT receipt_number, invoice_number FROM bills')
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
    const formattedNumber = `${prefix}${sep}${fy}${sep}${String(nextNum).padStart(padding, '0')}`

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

      // Extract numeric sequence from invoice_number if available
      const match = invoice_number.match(/(\d+)$/)
      const seq = match ? parseInt(match[1], 10) : startNum
      finalReceiptNumber = `${prefix}${sep}${fy}${sep}${String(seq).padStart(padding, '0')}`
    }

    // Clean payment mode (null if Select or empty)
    const sanitizedPaymentMode = (payment_mode === 'Select' || payment_mode === '' || !payment_mode) ? null : payment_mode

    const finalDeliveryAddress = same_as_billing ? (customer_address ? customer_address.trim() : null) : (delivery_address ? delivery_address.trim() : null)

    // Insert into bills table
    const [billResult] = await pool.query(`
      INSERT INTO bills (
        invoice_number, receipt_number, invoice_date, due_date, has_due_date, invoice_type, copy_type,
        customer_name, customer_type, customer_phone, customer_email, customer_address, delivery_address, same_as_billing, customer_gstin,
        place_of_supply, taxable_amount, cgst_rate, cgst_amount,
        sgst_rate, sgst_amount, igst_rate, igst_amount,
        total_tax, round_off, total_amount, amount_in_words,
        payment_mode, payment_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      notes || ''
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

    // Trigger Automated Email Dispatch in Background if configured
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
    
    // Fetch all bills chronologically latest first
    const [bills] = await pool.query(`
      SELECT 
        b.*,
        COUNT(bi.id) AS total_items
      FROM bills b
      LEFT JOIN bill_items bi ON b.id = bi.bill_id
      GROUP BY b.id
      ORDER BY b.id DESC
    `)

    // Fetch all line items for exported bills
    const [allItems] = await pool.query(`
      SELECT * FROM bill_items ORDER BY id ASC
    `)

    const itemsByBillId = {}
    allItems.forEach(item => {
      if (!itemsByBillId[item.bill_id]) {
        itemsByBillId[item.bill_id] = []
      }
      itemsByBillId[item.bill_id].push(item)
    })

    const billsWithItems = bills.map(bill => ({
      ...bill,
      items: itemsByBillId[bill.id] || []
    }))

    // Overall summary metrics
    const totalRevenue = bills.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)
    const paidCount = bills.filter(b => b.payment_status === 'Paid').length
    const pendingCount = bills.filter(b => b.payment_status === 'Pending').length

    return res.status(200).json({
      success: true,
      count: billsWithItems.length,
      bills: billsWithItems,
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

    const [bills] = await pool.query('SELECT * FROM bills WHERE id = ?', [id])
    if (bills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      })
    }

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
    `, [id])

    return res.status(200).json({
      success: true,
      bill: {
        ...bills[0],
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

    // 1. Restore stock for all items
    const [items] = await pool.query('SELECT material_id, quantity FROM bill_items WHERE bill_id = ?', [id])
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
    const { payment_mode, payment_status } = req.body
    const pool = getPool()

    const fields = []
    const values = []

    if (payment_mode !== undefined) {
      fields.push('payment_mode = ?')
      values.push(payment_mode)
    }
    if (payment_status !== undefined) {
      fields.push('payment_status = ?')
      values.push(payment_status)
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No payment fields provided for update.'
      })
    }

    values.push(id)
    const [result] = await pool.query(`UPDATE bills SET ${fields.join(', ')} WHERE id = ?`, values)

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found.'
      })
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
    const { email } = req.body || {}

    const pool = getPool()
    const [bills] = await pool.query('SELECT * FROM bills WHERE id = ?', [id])
    if (bills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice bill record not found.'
      })
    }

    const bill = bills[0]
    const recipient = email || bill.customer_email

    if (!recipient || !recipient.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer email address is required to dispatch the receipt.'
      })
    }

    const result = await sendReceiptEmail(id, recipient)
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
      (invoice_number || existing[0].invoice_number).trim(),
      receipt_number || existing[0].receipt_number,
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


