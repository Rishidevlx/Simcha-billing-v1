import { getPool } from '../config/db.js'

// Get live stock inventory & KPI summary
export const getInventory = async (req, res) => {
  try {
    const pool = getPool()
    
    // 1. Fetch materials with joined category
    const [materials] = await pool.query(`
      SELECT 
        m.id,
        m.name,
        m.code,
        m.category_id,
        c.name AS category_name,
        m.brand,
        m.unit,
        m.description,
        m.selling_price,
        m.mrp,
        m.hsn_code,
        m.opening_stock,
        COALESCE(m.current_stock, m.opening_stock, 0) AS current_stock,
        COALESCE(m.reorder_level, 0) AS reorder_level,
        m.barcode,
        m.serial_tracking,
        m.status,
        m.created_at,
        m.updated_at
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.id ASC
    `)

    // 2. Calculate summary statistics
    let totalValuation = 0
    let totalUnits = 0
    let lowStockCount = 0
    let outOfStockCount = 0

    materials.forEach(m => {
      const stock = parseFloat(m.current_stock || 0)
      const price = parseFloat(m.selling_price || 0)
      const reorder = parseFloat(m.reorder_level || 0)

      totalUnits += stock
      totalValuation += (stock * price)

      if (stock <= 0) {
        outOfStockCount += 1
      } else if (reorder > 0 && stock <= reorder) {
        lowStockCount += 1
      }
    })

    return res.status(200).json({
      success: true,
      stats: {
        totalValuation,
        totalUnits,
        lowStockCount,
        outOfStockCount,
        totalMaterials: materials.length
      },
      summary: {
        total_stock_valuation: totalValuation,
        total_stock_units: totalUnits,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        total_sku_count: materials.length
      },
      data: materials,
      materials
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve stock inventory.'
    })
  }
}

// Get stock movement ledger (audit logs)
export const getLedger = async (req, res) => {
  try {
    const pool = getPool()
    const { material_id, movement_type, type, start_date, end_date } = req.query
    const filterMovement = movement_type || type

    let query = `
      SELECT 
        l.id,
        l.material_id,
        m.name AS material_name,
        m.code AS material_code,
        m.unit,
        c.name AS category_name,
        l.movement_type,
        l.reference_number,
        l.quantity_change,
        l.balance_stock,
        (l.balance_stock - l.quantity_change) AS stock_before,
        l.balance_stock AS stock_after,
        l.notes,
        l.created_at
      FROM stock_ledger l
      LEFT JOIN materials m ON l.material_id = m.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE 1=1
    `
    const params = []

    if (material_id && material_id !== 'ALL') {
      query += ' AND l.material_id = ?'
      params.push(material_id)
    }

    if (filterMovement && filterMovement !== 'ALL') {
      query += ' AND l.movement_type = ?'
      params.push(filterMovement)
    }

    if (start_date) {
      query += ' AND DATE(l.created_at) >= ?'
      params.push(start_date)
    }

    if (end_date) {
      query += ' AND DATE(l.created_at) <= ?'
      params.push(end_date)
    }

    query += ' ORDER BY l.id DESC LIMIT 500'

    const [ledger] = await pool.query(query, params)

    return res.status(200).json({
      success: true,
      count: ledger.length,
      data: ledger,
      ledger
    })
  } catch (error) {
    console.error('Error fetching stock ledger:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve stock audit ledger.'
    })
  }
}

// Manual stock adjustment
export const adjustStock = async (req, res) => {
  try {
    const { material_id, adjust_type, action, quantity, reason, notes } = req.body
    const op = (adjust_type || action || '').toUpperCase()

    if (!material_id) {
      return res.status(400).json({
        success: false,
        message: 'Material ID is required.'
      })
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid non-negative quantity is required.'
      })
    }

    const pool = getPool()
    const [matRows] = await pool.query('SELECT id, name, current_stock, opening_stock FROM materials WHERE id = ?', [material_id])
    if (matRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      })
    }

    const material = matRows[0]
    const currentStock = parseFloat(material.current_stock ?? material.opening_stock ?? 0)
    let newStock = currentStock
    let quantityChange = 0

    if (op === 'ADD') {
      newStock = currentStock + qty
      quantityChange = qty
    } else if (op === 'REDUCE') {
      newStock = Math.max(0, currentStock - qty)
      quantityChange = -(currentStock - newStock)
    } else if (op === 'SET') {
      newStock = Math.max(0, qty)
      quantityChange = newStock - currentStock
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid adjustment operation (must be ADD, REDUCE, or SET).'
      })
    }

    // 1. Update current_stock in materials
    await pool.query('UPDATE materials SET current_stock = ?, updated_at = NOW() WHERE id = ?', [newStock, material_id])

    // 2. Insert into stock_ledger
    const movementType = (reason && reason.toLowerCase().includes('damage')) ? 'DAMAGE_LOSS' : ((reason && reason.toLowerCase().includes('return')) ? 'RETURN' : 'MANUAL_ADJUSTMENT')
    const noteText = `[${reason || 'Manual Adjustment'}] ${notes ? notes.trim() : ''}`.trim()

    await pool.query(`
      INSERT INTO stock_ledger (
        material_id, movement_type, reference_number,
        quantity_change, balance_stock, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      material_id,
      movementType,
      'MANUAL-ADJ',
      quantityChange,
      newStock,
      noteText
    ])

    return res.status(200).json({
      success: true,
      message: `Stock updated for "${material.name}". New balance: ${newStock}`,
      new_stock: newStock,
      newStock
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to adjust stock.'
    })
  }
}

// Update reorder level
export const updateReorderLevel = async (req, res) => {
  try {
    const { material_id, reorder_level } = req.body

    if (!material_id) {
      return res.status(400).json({
        success: false,
        message: 'Material ID is required.'
      })
    }

    const reorder = Math.max(0, parseInt(reorder_level, 10) || 0)
    const pool = getPool()

    await pool.query('UPDATE materials SET reorder_level = ?, updated_at = NOW() WHERE id = ?', [reorder, material_id])

    return res.status(200).json({
      success: true,
      message: 'Reorder level updated successfully.',
      reorder_level: reorder
    })
  } catch (error) {
    console.error('Error updating reorder level:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update reorder level.'
    })
  }
}

// Update both Stock & Reorder Threshold (Quick Edit Action)
export const updateStockAndThreshold = async (req, res) => {
  try {
    const { material_id, current_stock, reorder_level, reason } = req.body

    if (!material_id) {
      return res.status(400).json({
        success: false,
        message: 'Material ID is required.'
      })
    }

    const pool = getPool()
    const [matRows] = await pool.query(
      'SELECT id, name, current_stock, opening_stock, reorder_level FROM materials WHERE id = ?',
      [material_id]
    )

    if (matRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      })
    }

    const mat = matRows[0]
    const oldStock = parseFloat(mat.current_stock ?? mat.opening_stock ?? 0)
    const newStock = current_stock !== undefined ? Math.max(0, parseFloat(current_stock) || 0) : oldStock
    const newReorder = reorder_level !== undefined ? Math.max(0, parseInt(reorder_level, 10) || 0) : parseInt(mat.reorder_level || 0, 10)
    const qtyChange = newStock - oldStock

    await pool.query(
      'UPDATE materials SET current_stock = ?, opening_stock = ?, reorder_level = ?, updated_at = NOW() WHERE id = ?',
      [newStock, newStock, newReorder, material_id]
    )

    if (qtyChange !== 0) {
      try {
        await pool.query(`
          INSERT INTO stock_ledger (
            material_id, movement_type, reference_number,
            quantity_change, balance_stock, notes
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          material_id,
          'MANUAL_ADJUSTMENT',
          'QUICK-EDIT',
          qtyChange,
          newStock,
          `[Quick Edit] ${reason || 'Stock & Threshold manual edit'}`
        ])
      } catch (ledgerErr) {
        console.warn('Ledger log failed (ignorable):', ledgerErr.message)
      }
    }

    return res.status(200).json({
      success: true,
      message: `Stock & Threshold updated for "${mat.name}".`,
      data: {
        id: material_id,
        current_stock: newStock,
        reorder_level: newReorder
      }
    })
  } catch (error) {
    console.error('Error updating stock & threshold:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update stock and threshold.'
    })
  }
}

// Get registered serial numbers for a material
export const getMaterialSerials = async (req, res) => {
  try {
    const { materialId } = req.params
    const { status } = req.query
    const pool = getPool()

    // 1. Get material details
    const [matRows] = await pool.query(
      'SELECT id, name, code, hsn_code, unit, current_stock, opening_stock, reorder_level, serial_tracking FROM materials WHERE id = ?',
      [materialId]
    )

    if (matRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      })
    }

    const material = matRows[0]

    // 2. Query inventory_serials
    let query = 'SELECT id, material_id, serial_number, status, created_at, updated_at FROM inventory_serials WHERE material_id = ?'
    const params = [materialId]

    if (status && status !== 'ALL') {
      query += ' AND status = ?'
      params.push(status)
    }

    query += ' ORDER BY id DESC'

    const [serials] = await pool.query(query, params)

    // Summary counts
    const [statsRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available_count,
        SUM(CASE WHEN status = 'Sold' THEN 1 ELSE 0 END) as sold_count,
        SUM(CASE WHEN status = 'Damaged' THEN 1 ELSE 0 END) as damaged_count
      FROM inventory_serials
      WHERE material_id = ?
    `, [materialId])

    const stats = statsRows[0] || { total_count: 0, available_count: 0, sold_count: 0, damaged_count: 0 }

    return res.status(200).json({
      success: true,
      material,
      serials,
      summary: {
        total_count: parseInt(stats.total_count || 0, 10),
        available_count: parseInt(stats.available_count || 0, 10),
        sold_count: parseInt(stats.sold_count || 0, 10),
        damaged_count: parseInt(stats.damaged_count || 0, 10)
      }
    })
  } catch (error) {
    console.error('Error fetching material serials:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve material serial numbers.'
    })
  }
}
