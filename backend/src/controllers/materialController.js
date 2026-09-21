import { getPool } from '../config/db.js'

// Get all materials with joined Category Name (ordered chronologically ASC)
export const getMaterials = async (req, res) => {
  try {
    const pool = getPool()
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
        m.tax_inclusive,
        m.has_discount,
        m.discount_percent,
        m.opening_stock,
        COALESCE(m.current_stock, m.opening_stock, 0) AS current_stock,
        m.reorder_level,
        m.barcode,
        m.warranty,
        m.serial_tracking,
        m.return_policy,
        m.status,
        m.created_at,
        m.updated_at
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.id ASC
    `)

    res.status(200).json({
      success: true,
      count: materials.length,
      materials
    })
  } catch (error) {
    console.error('Error fetching materials:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve materials from database.'
    })
  }
}

// Get single material by ID
export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    const [materials] = await pool.query(`
      SELECT 
        m.*,
        c.name AS category_name
      FROM materials m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = ?
    `, [id])

    if (materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      })
    }

    res.status(200).json({
      success: true,
      material: materials[0]
    })
  } catch (error) {
    console.error('Error fetching material by id:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve material.'
    })
  }
}

// Create new material
export const createMaterial = async (req, res) => {
  try {
    const {
      name,
      code,
      category_id,
      brand,
      unit = 'Nos',
      description,
      selling_price = 0,
      mrp = 0,
      hsn_code,
      tax_inclusive = false,
      has_discount = false,
      discount_percent = 0,
      opening_stock = 0,
      reorder_level = 0,
      barcode,
      warranty,
      serial_tracking = false,
      return_policy = false,
      status = 'Active'
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Material Name is required.'
      })
    }

    const pool = getPool()
    const [result] = await pool.query(`
      INSERT INTO materials (
        name, code, category_id, brand, unit, description, 
        selling_price, mrp, hsn_code, tax_inclusive, has_discount, discount_percent,
        opening_stock, reorder_level, barcode, warranty, 
        serial_tracking, return_policy, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      code ? code.trim() : null,
      category_id ? parseInt(category_id, 10) : null,
      brand ? brand.trim() : null,
      unit || 'Nos',
      description ? description.trim() : null,
      parseFloat(selling_price) || 0,
      parseFloat(mrp) || 0,
      hsn_code ? hsn_code.trim() : null,
      Boolean(tax_inclusive),
      Boolean(has_discount),
      parseFloat(discount_percent) || 0,
      parseInt(opening_stock, 10) || 0,
      parseInt(reorder_level, 10) || 0,
      barcode ? barcode.trim() : null,
      warranty ? warranty.trim() : null,
      Boolean(serial_tracking),
      Boolean(return_policy),
      status === 'Inactive' ? 'Inactive' : 'Active'
    ])

    res.status(201).json({
      success: true,
      message: 'Material created successfully.',
      materialId: result.insertId
    })
  } catch (error) {
    console.error('Error creating material:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create material.'
    })
  }
}

// Update existing material
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      code,
      category_id,
      brand,
      unit = 'Nos',
      description,
      selling_price = 0,
      mrp = 0,
      hsn_code,
      tax_inclusive = false,
      has_discount = false,
      discount_percent = 0,
      opening_stock = 0,
      reorder_level = 0,
      barcode,
      warranty,
      serial_tracking = false,
      return_policy = false,
      status = 'Active'
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Material Name is required.'
      })
    }

    const pool = getPool()
    const [result] = await pool.query(`
      UPDATE materials SET
        name = ?,
        code = ?,
        category_id = ?,
        brand = ?,
        unit = ?,
        description = ?,
        selling_price = ?,
        mrp = ?,
        hsn_code = ?,
        tax_inclusive = ?,
        has_discount = ?,
        discount_percent = ?,
        opening_stock = ?,
        reorder_level = ?,
        barcode = ?,
        warranty = ?,
        serial_tracking = ?,
        return_policy = ?,
        status = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      name.trim(),
      code ? code.trim() : null,
      category_id ? parseInt(category_id, 10) : null,
      brand ? brand.trim() : null,
      unit || 'Nos',
      description ? description.trim() : null,
      parseFloat(selling_price) || 0,
      parseFloat(mrp) || 0,
      hsn_code ? hsn_code.trim() : null,
      Boolean(tax_inclusive),
      Boolean(has_discount),
      parseFloat(discount_percent) || 0,
      parseInt(opening_stock, 10) || 0,
      parseInt(reorder_level, 10) || 0,
      barcode ? barcode.trim() : null,
      warranty ? warranty.trim() : null,
      Boolean(serial_tracking),
      Boolean(return_policy),
      status === 'Inactive' ? 'Inactive' : 'Active',
      id
    ])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Material updated successfully.'
    })
  } catch (error) {
    console.error('Error updating material:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update material.'
    })
  }
}

// Delete single material
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    const [result] = await pool.query('DELETE FROM materials WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Material deleted successfully.'
    })
  } catch (error) {
    console.error('Error deleting material:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete material.'
    })
  }
}

// Bulk delete materials
export const bulkDeleteMaterials = async (req, res) => {
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No material IDs provided for deletion.'
      })
    }

    const pool = getPool()
    const [result] = await pool.query('DELETE FROM materials WHERE id IN (?)', [ids])

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.affectedRows} materials.`,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Error bulk deleting materials:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete selected materials.'
    })
  }
}

// Verify Serial Number against Database
export const verifySerialNumber = async (req, res) => {
  try {
    const { serialNumber } = req.params
    const { materialId } = req.query

    if (!serialNumber || !serialNumber.trim()) {
      return res.status(400).json({
        success: false,
        found: false,
        message: 'Serial number is required.'
      })
    }

    const pool = getPool()
    const cleanSerial = serialNumber.trim()

    // 1. Check inventory_serials
    const [invRows] = await pool.query(
      'SELECT s.*, m.name as material_name FROM inventory_serials s LEFT JOIN materials m ON s.material_id = m.id WHERE LOWER(s.serial_number) = LOWER(?)',
      [cleanSerial]
    )

    if (invRows.length > 0) {
      const match = invRows[0]
      return res.status(200).json({
        success: true,
        found: true,
        status: match.status,
        material_id: match.material_id,
        material_name: match.material_name,
        message: match.status === 'Available' ? 'Verified in stock' : `Serial is ${match.status}`
      })
    }

    // 2. Check materials barcode or code
    const [matRows] = await pool.query(
      'SELECT id, name, barcode, code FROM materials WHERE LOWER(barcode) = LOWER(?) OR LOWER(code) = LOWER(?)',
      [cleanSerial, cleanSerial]
    )

    if (matRows.length > 0) {
      const mat = matRows[0]
      return res.status(200).json({
        success: true,
        found: true,
        status: 'Available',
        material_id: mat.id,
        material_name: mat.name,
        message: 'Verified with product code/barcode'
      })
    }

    // 3. Check bill_items historical serials
    const [billItemRows] = await pool.query(
      'SELECT bi.*, m.name as material_name FROM bill_items bi LEFT JOIN materials m ON bi.material_id = m.id WHERE LOWER(bi.serial_number) = LOWER(?) LIMIT 1',
      [cleanSerial]
    )

    if (billItemRows.length > 0) {
      return res.status(200).json({
        success: true,
        found: true,
        status: 'Sold',
        material_id: billItemRows[0].material_id,
        material_name: billItemRows[0].material_name,
        message: 'Serial previously billed/sold'
      })
    }

    // Not found
    return res.status(200).json({
      success: true,
      found: false,
      message: 'Serial number not found in database'
    })
  } catch (error) {
    console.error('Error verifying serial number:', error)
    res.status(500).json({
      success: false,
      found: false,
      message: 'Failed to verify serial number.'
    })
  }
}


