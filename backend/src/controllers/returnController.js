import { getPool } from '../config/db.js'

// Generate next formatted Return Number based on system settings
export async function getNextReturnNumber(req, res) {
  try {
    const pool = getPool()

    // 1. Get numbering settings
    const [settingRows] = await pool.query('SELECT * FROM settings WHERE id = 1')
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const prefix = (s.return_prefix !== undefined && s.return_prefix !== null && s.return_prefix.trim() !== '') ? s.return_prefix.trim() : 'SIS-RET'
    const fy = (s.return_financial_year && s.return_financial_year.trim()) ? s.return_financial_year.trim() : '2026-27'
    const startNum = parseInt(s.return_starting_number, 10) || 1
    const padding = parseInt(s.return_padding_digits, 10) || 4
    const sep = (s.return_separator !== undefined && s.return_separator !== null) ? s.return_separator : '/'

    // 2. Extract sequence numbers from existing returns_registry
    const [rows] = await pool.query('SELECT return_number FROM returns_registry')
    let maxSeq = 0
    for (const r of rows) {
      if (r.return_number) {
        const retStr = r.return_number.trim()
        const match = retStr.match(/(\d+)$/)
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
      nextReturnNumber: formattedNumber
    })
  } catch (error) {
    console.error('Error generating next return number:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate return number.'
    })
  }
}

// Get All Returns with KPI metrics
export async function getAllReturns(req, res) {
  try {
    const pool = getPool()
    const { status, decision, reason, search } = req.query

    let query = `
      SELECT 
        r.*,
        m.code AS material_code,
        m.brand AS material_brand
      FROM returns_registry r
      LEFT JOIN materials m ON r.material_id = m.id
      WHERE 1=1
    `
    const params = []

    if (status && status !== 'ALL') {
      query += ' AND r.qc_status = ?'
      params.push(status)
    }

    if (decision && decision !== 'ALL') {
      query += ' AND r.qc_decision = ?'
      params.push(decision)
    }

    if (reason && reason !== 'ALL') {
      query += ' AND r.reason = ?'
      params.push(reason)
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`
      query += ' AND (r.return_number LIKE ? OR r.bill_number LIKE ? OR r.customer_name LIKE ? OR r.customer_phone LIKE ? OR r.item_name LIKE ?)'
      params.push(q, q, q, q, q)
    }

    query += ' ORDER BY r.id DESC'

    const [returns] = await pool.query(query, params)

    // Calculate overall KPI metrics
    const [allRows] = await pool.query('SELECT id, qc_status, qc_decision, refund_amount FROM returns_registry')
    const totalCount = allRows.length
    const pendingCount = allRows.filter(r => r.qc_status === 'Pending QC').length
    const restockedCount = allRows.filter(r => r.qc_decision === 'STOCK').length
    const replacedCount = allRows.filter(r => r.qc_decision === 'REPLACE').length
    const refundedCount = allRows.filter(r => r.qc_decision === 'REFUND').length
    const totalRefundAmount = allRows.reduce((acc, r) => acc + (parseFloat(r.refund_amount) || 0), 0)

    return res.status(200).json({
      success: true,
      stats: {
        total: totalCount,
        pending: pendingCount,
        restocked: restockedCount,
        replaced: replacedCount,
        refunded: refundedCount,
        totalRefundAmount
      },
      data: returns,
      returns
    })
  } catch (error) {
    console.error('Error retrieving returns:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve returns registry.'
    })
  }
}

// Get single Return record by ID
export async function getReturnById(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [rows] = await pool.query(`
      SELECT 
        r.*,
        m.code AS material_code,
        m.brand AS material_brand,
        m.current_stock
      FROM returns_registry r
      LEFT JOIN materials m ON r.material_id = m.id
      WHERE r.id = ?
    `, [id])

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Return record not found.'
      })
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
      returnRecord: rows[0]
    })
  } catch (error) {
    console.error('Error retrieving return record:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch return record.'
    })
  }
}

// Create Return Entry (Single or Batch for multiple items from an invoice)
export async function createReturn(req, res) {
  try {
    const pool = getPool()
    const payload = req.body

    // Support single item or batch array of return items
    const returnItems = Array.isArray(payload.items) ? payload.items : [payload]

    if (returnItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one return item must be provided.'
      })
    }

    const createdReturns = []

    // Fetch numbering setup
    const [settingRows] = await pool.query('SELECT * FROM settings WHERE id = 1')
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const prefix = (s.return_prefix !== undefined && s.return_prefix !== null && s.return_prefix.trim() !== '') ? s.return_prefix.trim() : 'SIS-RET'
    const fy = (s.return_financial_year && s.return_financial_year.trim()) ? s.return_financial_year.trim() : '2026-27'
    const startNum = parseInt(s.return_starting_number, 10) || 1
    const padding = parseInt(s.return_padding_digits, 10) || 4
    const sep = (s.return_separator !== undefined && s.return_separator !== null) ? s.return_separator : '/'

    // Get current max sequence number
    const [rows] = await pool.query('SELECT return_number FROM returns_registry')
    let currentMaxSeq = 0
    for (const r of rows) {
      if (r.return_number) {
        const retStr = r.return_number.trim()
        const match = retStr.match(/(\d+)$/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (!isNaN(num) && num < 100000 && num > currentMaxSeq) {
            currentMaxSeq = num
          }
        }
      }
    }

    let nextSequence = currentMaxSeq >= startNum ? currentMaxSeq + 1 : startNum

    for (const item of returnItems) {
      if (!item.customer_name || !item.customer_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Customer Name is required for return entry.'
        })
      }

      if (!item.item_name || !item.item_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Item / Product Name is required.'
        })
      }

      const returnNumber = item.return_number && item.return_number.trim()
        ? item.return_number.trim()
        : `${prefix}${sep}${fy}${sep}${String(nextSequence++).padStart(padding, '0')}`

      const returnDate = item.return_date || new Date().toISOString().split('T')[0]
      const billId = item.bill_id ? parseInt(item.bill_id, 10) : null
      const billNumber = (item.bill_number || '').trim()
      const customerName = (item.customer_name || '').trim()
      const customerPhone = item.customer_phone ? String(item.customer_phone).trim() : null
      const customerEmail = item.customer_email ? String(item.customer_email).trim() : null
      const materialId = item.material_id ? parseInt(item.material_id, 10) : null
      const itemName = item.item_name.trim()
      const serialNumber = item.serial_number ? String(item.serial_number).trim() : null
      const quantity = parseFloat(item.quantity) || 1
      const unit = item.unit || 'Nos'
      const unitPrice = parseFloat(item.unit_price) || 0
      const totalAmount = parseFloat(item.total_amount) || (unitPrice * quantity)
      const reason = item.reason || 'Defective Product'
      const customReason = item.custom_reason ? String(item.custom_reason).trim() : null

      const [resInsert] = await pool.query(`
        INSERT INTO returns_registry (
          return_number, return_date, bill_id, bill_number, customer_name, customer_phone, customer_email,
          material_id, item_name, serial_number, quantity, unit, unit_price, total_amount,
          reason, custom_reason, qc_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending QC')
      `, [
        returnNumber, returnDate, billId, billNumber, customerName, customerPhone, customerEmail,
        materialId, itemName, serialNumber, quantity, unit, unitPrice, totalAmount,
        reason, customReason
      ])

      createdReturns.push({
        id: resInsert.insertId,
        return_number: returnNumber,
        item_name: itemName,
        quantity,
        total_amount: totalAmount
      })
    }

    return res.status(201).json({
      success: true,
      message: `Successfully created ${createdReturns.length} return entry record(s). Proceeding to QC Inspection.`,
      count: createdReturns.length,
      createdReturns
    })
  } catch (error) {
    console.error('Error creating return entry:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create return record.'
    })
  }
}

// Process QC Inspection Decision (STOCK | REPLACE | REFUND)
export async function processQcDecision(req, res) {
  try {
    const { id } = req.params
    const {
      qc_decision,
      qc_condition = 'Good',
      qc_notes = '',
      resolution_ref = '',
      refund_amount = 0,
      replacement_serial = null
    } = req.body

    if (!qc_decision || !['STOCK', 'REPLACE', 'REFUND', 'REJECT'].includes(qc_decision)) {
      return res.status(400).json({
        success: false,
        message: 'Valid QC Decision (STOCK, REPLACE, REFUND, or REJECT) is required.'
      })
    }

    const pool = getPool()
    const [retRows] = await pool.query('SELECT * FROM returns_registry WHERE id = ?', [id])
    if (retRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Return record not found.'
      })
    }

    const retItem = retRows[0]
    let finalResolutionRef = resolution_ref ? resolution_ref.trim() : ''

    // Fetch Credit Note numbering settings
    const [settingRows] = await pool.query('SELECT * FROM settings WHERE id = 1')
    const s = settingRows.length > 0 ? settingRows[0] : {}
    const cnPrefix = s.credit_note_prefix || 'SIS-CN'
    const cnFy = s.credit_note_financial_year || '2026-27'
    const cnStart = parseInt(s.credit_note_starting_number, 10) || 1
    const cnPad = parseInt(s.credit_note_padding_digits, 10) || 4
    const cnSep = s.credit_note_separator || '/'

    if (!finalResolutionRef) {
      const stamp = Date.now().toString().slice(-4)
      if (qc_decision === 'STOCK') {
        finalResolutionRef = `RESTOCK-${stamp}`
      } else if (qc_decision === 'REPLACE') {
        finalResolutionRef = `DISP-${stamp}`
      } else if (qc_decision === 'REFUND') {
        // Sequential Credit note numbering
        const [cnRows] = await pool.query('SELECT resolution_ref FROM returns_registry WHERE resolution_ref LIKE ?', [`${cnPrefix}%`])
        let maxCnSeq = 0
        for (const cr of cnRows) {
          const match = cr.resolution_ref.match(/(\d+)$/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (!isNaN(num) && num > maxCnSeq) maxCnSeq = num
          }
        }
        const nextCnNum = maxCnSeq >= cnStart ? maxCnSeq + 1 : cnStart
        finalResolutionRef = `${cnPrefix}${cnSep}${cnFy}${cnSep}${String(nextCnNum).padStart(cnPad, '0')}`
      } else if (qc_decision === 'REJECT') {
        finalResolutionRef = `REJ-${stamp}`
      }
    }

    const isRejected = qc_decision === 'REJECT'
    const finalQcStatus = isRejected ? 'Rejected' : 'Completed'
    const isPass = qc_condition === 'PASS' || qc_condition === 'Good'

    // 1. Update returns_registry
    await pool.query(`
      UPDATE returns_registry SET
        qc_status = ?,
        qc_decision = ?,
        qc_condition = ?,
        qc_notes = ?,
        resolution_ref = ?,
        refund_amount = ?,
        replacement_serial = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      finalQcStatus,
      qc_decision,
      isPass ? 'PASS' : (qc_condition === 'DAMAGED' || qc_condition === 'Damaged' ? 'DAMAGED' : 'FAIL'),
      qc_notes ? qc_notes.trim() : (isRejected ? 'QC inspection rejected.' : `QC inspection completed (${isPass ? 'PASS' : 'FAIL'}).`),
      finalResolutionRef,
      qc_decision === 'REFUND' ? (parseFloat(refund_amount) || retItem.total_amount || 0) : 0,
      replacement_serial ? String(replacement_serial).trim() : null,
      id
    ])

    const materialId = retItem.material_id ? parseInt(retItem.material_id, 10) : null
    const returnQty = parseFloat(retItem.quantity) || 1

    // 2. Automated Stock Adjustments based on QC PASS/FAIL & Resolution:
    if (materialId) {
      // Step A: If QC PASSED, restock the returned good product back to inventory (+qty)
      if (isPass && !isRejected) {
        try {
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [materialId])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const newStock = currentStock + returnQty

            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, materialId])

            await pool.query(`
              INSERT INTO stock_ledger (
                material_id, movement_type, reference_number,
                quantity_change, balance_stock, notes
              ) VALUES (?, 'RETURN', ?, ?, ?, ?)
            `, [
              materialId,
              finalResolutionRef,
              returnQty,
              newStock,
              `QC Pass Returned Product Restocked (${retItem.return_number})`
            ])
          }

          if (retItem.serial_number) {
            await pool.query(
              'UPDATE inventory_serials SET status = "Available", updated_at = NOW() WHERE material_id = ? AND LOWER(serial_number) = LOWER(?)',
              [materialId, retItem.serial_number.trim()]
            )
          }
        } catch (passErr) {
          console.error('Error adding pass item to stock:', passErr)
        }
      } else if (!isPass && retItem.serial_number) {
        // If QC FAILED, mark old serial as 'Damaged'
        try {
          await pool.query(
            'UPDATE inventory_serials SET status = "Damaged", updated_at = NOW() WHERE material_id = ? AND LOWER(serial_number) = LOWER(?)',
            [materialId, retItem.serial_number.trim()]
          )
        } catch (failErr) {
          console.error('Error marking defective serial as Damaged:', failErr)
        }
      }

      // Step B: If Resolution is REPLACE, deduct the fresh replacement unit (-qty) & mark new serial Sold
      if (qc_decision === 'REPLACE') {
        try {
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [materialId])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const newStock = Math.max(0, currentStock - returnQty)

            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, materialId])

            await pool.query(`
              INSERT INTO stock_ledger (
                material_id, movement_type, reference_number,
                quantity_change, balance_stock, notes
              ) VALUES (?, 'OUTWARD_SALE', ?, ?, ?, ?)
            `, [
              materialId,
              finalResolutionRef,
              -returnQty,
              newStock,
              `Replacement Dispatch for Return #${retItem.return_number} (SN: ${replacement_serial || 'N/A'})`
            ])
          }

          if (replacement_serial && replacement_serial.trim()) {
            await pool.query(
              'UPDATE inventory_serials SET status = "Sold", updated_at = NOW() WHERE material_id = ? AND LOWER(serial_number) = LOWER(?)',
              [materialId, replacement_serial.trim()]
            )
          }
        } catch (replaceErr) {
          console.error('Error deducting replacement unit stock:', replaceErr)
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `QC Decision recorded as ${qc_decision}. Resolution Ref: ${finalResolutionRef}`,
      resolutionRef: finalResolutionRef
    })
  } catch (error) {
    console.error('Error processing QC decision:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to record QC decision.'
    })
  }
}

// Delete return entry
export async function deleteReturn(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    await pool.query('DELETE FROM returns_registry WHERE id = ?', [id])

    return res.status(200).json({
      success: true,
      message: 'Return record deleted successfully.'
    })
  } catch (error) {
    console.error('Error deleting return record:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete return record.'
    })
  }
}
