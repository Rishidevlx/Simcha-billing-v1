import { getPool } from '../config/db.js'

// Generate next sequential Inward number (e.g. INW-2026-01)
export async function getNextInwardNumber(req, res) {
  try {
    const pool = getPool()
    const currentYear = new Date().getFullYear()
    const prefix = `INW-${currentYear}-`

    const [rows] = await pool.query('SELECT inward_number FROM inward_bills')
    let maxSeq = 0

    for (const r of rows) {
      if (r.inward_number) {
        const invStr = r.inward_number.trim()
        const parts = invStr.split('-')
        const lastPart = parts[parts.length - 1]
        const num = parseInt(lastPart, 10)
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num
        }
      }
    }

    const nextNum = maxSeq + 1
    const formattedNumber = `${prefix}${String(nextNum).padStart(2, '0')}`

    return res.status(200).json({
      success: true,
      nextInwardNumber: formattedNumber
    })
  } catch (error) {
    console.error('Error generating next inward number:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate inward number.'
    })
  }
}

// Create New Inward Bill & insert serials into inventory
export async function createInwardBill(req, res) {
  try {
    const {
      inward_number,
      inward_date,
      supplier_name,
      supplier_phone,
      supplier_email,
      supplier_location = '33 - Tamil Nadu',
      supplier_gstin,
      taxable_amount = 0,
      cgst_rate = 9.00,
      cgst_amount = 0,
      sgst_rate = 9.00,
      sgst_amount = 0,
      igst_rate = 18.00,
      igst_amount = 0,
      total_tax = 0,
      total_amount = 0,
      total_quantity = 0,
      hardcopy_url,
      items = []
    } = req.body

    if (!supplier_name || !supplier_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Supplier Name is required.'
      })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one line item is required for inward entry.'
      })
    }

    const pool = getPool()
    let finalInwardNumber = inward_number ? inward_number.trim() : ''

    // If inward_number not supplied, generate one automatically
    if (!finalInwardNumber) {
      const currentYear = new Date().getFullYear()
      const prefix = `INW-${currentYear}-`
      const [rows] = await pool.query('SELECT inward_number FROM inward_bills')
      let maxSeq = 0
      for (const r of rows) {
        if (r.inward_number) {
          const parts = r.inward_number.trim().split('-')
          const num = parseInt(parts[parts.length - 1], 10)
          if (!isNaN(num) && num > maxSeq) maxSeq = num
        }
      }
      finalInwardNumber = `${prefix}${String(maxSeq + 1).padStart(2, '0')}`
    } else {
      // Check duplicate inward number
      const [existing] = await pool.query('SELECT id FROM inward_bills WHERE inward_number = ?', [finalInwardNumber])
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Inward number "${finalInwardNumber}" already exists.`
        })
      }
    }

    // Strict Unique Serial Numbers Validation
    const seenPayloadSerials = new Set()
    for (const item of items) {
      if (item.has_serial && Array.isArray(item.serial_numbers)) {
        for (const rawSn of item.serial_numbers) {
          const sn = String(rawSn || '').trim()
          if (sn) {
            const lower = sn.toLowerCase()
            // 1. Check duplicate within current form
            if (seenPayloadSerials.has(lower)) {
              return res.status(400).json({
                success: false,
                message: `Duplicate serial number "${sn}" entered multiple times in this inward entry.`
              })
            }
            seenPayloadSerials.add(lower)

            // 2. Check if serial already exists in inventory_serials
            const [existingSerials] = await pool.query(
              'SELECT id, material_id, serial_number, status FROM inventory_serials WHERE LOWER(serial_number) = LOWER(?)',
              [sn]
            )
            if (existingSerials.length > 0) {
              const existingRecord = existingSerials[0]
              return res.status(400).json({
                success: false,
                message: `Serial number "${sn}" already exists in inventory (Status: ${existingRecord.status}). Serial numbers must be unique.`
              })
            }
          }
        }
      }
    }

    // Insert into inward_bills table
    const [inwardResult] = await pool.query(`
      INSERT INTO inward_bills (
        inward_number, inward_date, supplier_name, supplier_phone,
        supplier_email, supplier_location, supplier_gstin,
        taxable_amount, cgst_rate, cgst_amount, sgst_rate, sgst_amount,
        igst_rate, igst_amount, total_tax, total_amount,
        total_quantity, total_items, hardcopy_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      finalInwardNumber,
      inward_date || new Date().toISOString().split('T')[0],
      supplier_name.trim(),
      supplier_phone ? supplier_phone.trim() : null,
      supplier_email ? supplier_email.trim() : null,
      supplier_location || '33 - Tamil Nadu',
      supplier_gstin ? supplier_gstin.trim() : null,
      parseFloat(taxable_amount) || 0,
      parseFloat(cgst_rate) || 0,
      parseFloat(cgst_amount) || 0,
      parseFloat(sgst_rate) || 0,
      parseFloat(sgst_amount) || 0,
      parseFloat(igst_rate) || 0,
      parseFloat(igst_amount) || 0,
      parseFloat(total_tax) || 0,
      parseFloat(total_amount) || 0,
      parseFloat(total_quantity) || 0,
      items.length,
      hardcopy_url || null
    ])

    const inwardId = inwardResult.insertId

    // Insert Inward Items and register serial numbers into inventory_serials
    for (const item of items) {
      const serials = Array.isArray(item.serial_numbers) 
        ? item.serial_numbers.filter(s => s && s.trim() !== '') 
        : []
      
      const serialJson = serials.length > 0 ? JSON.stringify(serials) : null
      const materialId = item.material_id ? parseInt(item.material_id, 10) : null

      await pool.query(`
        INSERT INTO inward_bill_items (
          inward_id, material_id, item_name, description,
          hsn_code, quantity, unit, rate, amount,
          has_serial, serial_numbers
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        inwardId,
        materialId,
        item.item_name || 'Item',
        item.description || null,
        item.hsn_code ? item.hsn_code.trim() : null,
        parseFloat(item.quantity) || 1,
        item.unit || 'NOS',
        parseFloat(item.rate) || 0,
        parseFloat(item.amount) || 0,
        item.has_serial ? 1 : 0,
        serialJson
      ])

      // Update Materials current_stock (+) and record in stock_ledger
      if (materialId) {
        try {
          const qtyVal = parseFloat(item.quantity) || 1
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [materialId])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const newStock = currentStock + qtyVal

            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, materialId])

            await pool.query(`
              INSERT INTO stock_ledger (
                material_id, movement_type, reference_number,
                quantity_change, balance_stock, notes
              ) VALUES (?, 'INWARD_PURCHASE', ?, ?, ?, ?)
            `, [
              materialId,
              finalInwardNumber,
              qtyVal,
              newStock,
              `Inward Purchase #${finalInwardNumber} (${supplier_name.trim()})`
            ])
          }
        } catch (stockErr) {
          console.error('Error updating stock on inward:', stockErr)
        }
      }

      // If material_id is present and has serials, register them in inventory_serials so Outward can use/verify them
      if (materialId && serials.length > 0) {
        for (const sn of serials) {
          try {
            await pool.query(
              'INSERT INTO inventory_serials (material_id, serial_number, status) VALUES (?, ?, "Available") ON DUPLICATE KEY UPDATE status = "Available"',
              [materialId, sn.trim()]
            )
          } catch (serialErr) {
            console.error('Error inserting inventory serial:', serialErr)
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Inward entry saved successfully!',
      inwardId,
      inwardNumber: finalInwardNumber
    })
  } catch (error) {
    console.error('Error creating inward bill:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create inward bill in database: ' + error.message
    })
  }
}

// Get All Inward Bills for Reports
export async function getAllInwardBills(req, res) {
  try {
    const pool = getPool()

    const [inwards] = await pool.query(`
      SELECT 
        ib.*,
        COUNT(ibi.id) AS line_items_count
      FROM inward_bills ib
      LEFT JOIN inward_bill_items ibi ON ib.id = ibi.inward_id
      GROUP BY ib.id
      ORDER BY ib.id DESC
    `)

    const [allItems] = await pool.query(`
      SELECT * FROM inward_bill_items ORDER BY id ASC
    `)

    const itemsByInwardId = {}
    allItems.forEach(item => {
      if (!itemsByInwardId[item.inward_id]) {
        itemsByInwardId[item.inward_id] = []
      }
      let parsedSerials = []
      try {
        parsedSerials = item.serial_numbers ? JSON.parse(item.serial_numbers) : []
      } catch (e) {
        parsedSerials = []
      }
      itemsByInwardId[item.inward_id].push({
        ...item,
        serial_numbers_list: parsedSerials
      })
    })

    const inwardsWithItems = inwards.map(inward => ({
      ...inward,
      items: itemsByInwardId[inward.id] || []
    }))

    const totalAmount = inwards.reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0)
    const totalItems = inwards.reduce((acc, b) => acc + (parseFloat(b.total_quantity) || b.total_items || 0), 0)

    return res.status(200).json({
      success: true,
      count: inwardsWithItems.length,
      inwards: inwardsWithItems,
      stats: {
        totalInwards: inwards.length,
        totalAmount,
        totalItems
      }
    })
  } catch (error) {
    console.error('Error fetching inward bills:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve inward bills.'
    })
  }
}

// Get Inward Bill by ID
export async function getInwardBillById(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [inwards] = await pool.query('SELECT * FROM inward_bills WHERE id = ?', [id])
    if (inwards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inward entry not found.'
      })
    }

    const inward = inwards[0]
    const [items] = await pool.query('SELECT * FROM inward_bill_items WHERE inward_id = ? ORDER BY id ASC', [id])

    const formattedItems = items.map(item => {
      let parsedSerials = []
      try {
        parsedSerials = item.serial_numbers ? JSON.parse(item.serial_numbers) : []
      } catch (e) {
        parsedSerials = []
      }
      return {
        ...item,
        serial_numbers_list: parsedSerials
      }
    })

    return res.status(200).json({
      success: true,
      inward: {
        ...inward,
        items: formattedItems
      }
    })
  } catch (error) {
    console.error('Error fetching inward bill by id:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve inward bill details.'
    })
  }
}

// Delete Inward Bill
export async function deleteInwardBill(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [existing] = await pool.query('SELECT id, inward_number FROM inward_bills WHERE id = ?', [id])
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inward entry not found.'
      })
    }

    const inwardNo = existing[0].inward_number

    // 1. Rollback stock for all items
    const [items] = await pool.query('SELECT material_id, quantity FROM inward_bill_items WHERE inward_id = ?', [id])
    for (const item of items) {
      if (item.material_id) {
        try {
          const qtyVal = parseFloat(item.quantity) || 1
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [item.material_id])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const newStock = Math.max(0, currentStock - qtyVal)

            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, item.material_id])

            await pool.query(`
              INSERT INTO stock_ledger (
                material_id, movement_type, reference_number,
                quantity_change, balance_stock, notes
              ) VALUES (?, 'INWARD_REVERSAL', ?, ?, ?, ?)
            `, [
              item.material_id,
              inwardNo,
              -qtyVal,
              newStock,
              `Deleted Inward Entry #${inwardNo}`
            ])
          }
        } catch (revertErr) {
          console.error('Error reverting stock on inward delete:', revertErr)
        }
      }
    }

    // 2. Delete the inward bill (cascades items)
    await pool.query('DELETE FROM inward_bills WHERE id = ?', [id])

    return res.status(200).json({
      success: true,
      message: `Inward record #${inwardNo} deleted successfully.`
    })
  } catch (error) {
    console.error('Error deleting inward bill:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete inward bill.'
    })
  }
}

// Update Inward Bill
export async function updateInwardBill(req, res) {
  try {
    const { id } = req.params
    const {
      inward_date,
      supplier_name,
      supplier_phone,
      supplier_email,
      supplier_location = '33 - Tamil Nadu',
      supplier_gstin,
      taxable_amount = 0,
      cgst_rate = 9.00,
      cgst_amount = 0,
      sgst_rate = 9.00,
      sgst_amount = 0,
      igst_rate = 18.00,
      igst_amount = 0,
      total_tax = 0,
      total_amount = 0,
      total_quantity = 0,
      hardcopy_url,
      items = []
    } = req.body

    const pool = getPool()

    const [existing] = await pool.query('SELECT id, inward_number FROM inward_bills WHERE id = ?', [id])
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inward entry not found.'
      })
    }

    const inwardNo = existing[0].inward_number

    if (!supplier_name || !supplier_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Supplier Name is required.'
      })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one line item is required for inward entry.'
      })
    }

    // 1. Revert previous stock movements for this inward entry
    const [oldItems] = await pool.query('SELECT material_id, quantity, serial_numbers FROM inward_bill_items WHERE inward_id = ?', [id])
    for (const oldItem of oldItems) {
      if (oldItem.material_id) {
        try {
          const qtyVal = parseFloat(oldItem.quantity) || 1
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [oldItem.material_id])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const newStock = Math.max(0, currentStock - qtyVal)
            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, oldItem.material_id])
          }
        } catch (revertErr) {
          console.error('Error reverting stock on inward edit:', revertErr)
        }
      }
    }

    // 2. Update inward_bills header
    await pool.query(`
      UPDATE inward_bills SET
        inward_date = ?, supplier_name = ?, supplier_phone = ?,
        supplier_email = ?, supplier_location = ?, supplier_gstin = ?,
        taxable_amount = ?, cgst_rate = ?, cgst_amount = ?,
        sgst_rate = ?, sgst_amount = ?, igst_rate = ?, igst_amount = ?,
        total_tax = ?, total_amount = ?, total_quantity = ?,
        total_items = ?, hardcopy_url = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      inward_date || new Date().toISOString().split('T')[0],
      supplier_name.trim(),
      supplier_phone ? supplier_phone.trim() : null,
      supplier_email ? supplier_email.trim() : null,
      supplier_location || '33 - Tamil Nadu',
      supplier_gstin ? supplier_gstin.trim() : null,
      parseFloat(taxable_amount) || 0,
      parseFloat(cgst_rate) || 0,
      parseFloat(cgst_amount) || 0,
      parseFloat(sgst_rate) || 0,
      parseFloat(sgst_amount) || 0,
      parseFloat(igst_rate) || 0,
      parseFloat(igst_amount) || 0,
      parseFloat(total_tax) || 0,
      parseFloat(total_amount) || 0,
      parseFloat(total_quantity) || 0,
      items.length,
      hardcopy_url || null,
      id
    ])

    // 3. Delete old items
    await pool.query('DELETE FROM inward_bill_items WHERE inward_id = ?', [id])

    // 4. Insert updated items & apply new stock additions
    for (const item of items) {
      const serials = Array.isArray(item.serial_numbers) 
        ? item.serial_numbers.filter(s => s && s.trim() !== '') 
        : []
      
      const serialJson = serials.length > 0 ? JSON.stringify(serials) : null
      const materialId = item.material_id ? parseInt(item.material_id, 10) : null

      await pool.query(`
        INSERT INTO inward_bill_items (
          inward_id, material_id, item_name, description,
          hsn_code, quantity, unit, rate, amount,
          has_serial, serial_numbers
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        materialId,
        item.item_name || 'Item',
        item.description || null,
        item.hsn_code ? item.hsn_code.trim() : null,
        parseFloat(item.quantity) || 1,
        item.unit || 'NOS',
        parseFloat(item.rate) || 0,
        parseFloat(item.amount) || 0,
        item.has_serial ? 1 : 0,
        serialJson
      ])

      if (materialId) {
        try {
          const qtyVal = parseFloat(item.quantity) || 1
          const [matRows] = await pool.query('SELECT current_stock, opening_stock FROM materials WHERE id = ?', [materialId])
          if (matRows.length > 0) {
            const currentStock = parseFloat(matRows[0].current_stock ?? matRows[0].opening_stock ?? 0)
            const newStock = currentStock + qtyVal
            await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, materialId])

            await pool.query(`
              INSERT INTO stock_ledger (
                material_id, movement_type, reference_number,
                quantity_change, balance_stock, notes
              ) VALUES (?, 'INWARD_PURCHASE', ?, ?, ?, ?)
            `, [
              materialId,
              inwardNo,
              qtyVal,
              newStock,
              `Updated Inward Purchase #${inwardNo} (${supplier_name.trim()})`
            ])
          }
        } catch (stockErr) {
          console.error('Error updating stock on inward update:', stockErr)
        }
      }

      if (materialId && serials.length > 0) {
        for (const sn of serials) {
          try {
            await pool.query(
              'INSERT INTO inventory_serials (material_id, serial_number, status) VALUES (?, ?, "Available") ON DUPLICATE KEY UPDATE status = "Available"',
              [materialId, sn.trim()]
            )
          } catch (serialErr) {
            console.error('Error inserting inventory serial:', serialErr)
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Inward entry #${inwardNo} updated successfully!`,
      inwardId: id,
      inwardNumber: inwardNo
    })
  } catch (error) {
    console.error('Error updating inward bill:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update inward bill: ' + error.message
    })
  }
}
