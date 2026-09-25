import { getPool } from '../config/db.js'

// GET /api/departments
export const getDepartments = async (req, res) => {
  try {
    const pool = getPool()
    const [departments] = await pool.query(
      'SELECT id, name, description, status, created_at, updated_at FROM departments ORDER BY created_at DESC'
    )
    res.json({ success: true, departments })
  } catch (error) {
    console.error('Error fetching departments:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch departments', error: error.message })
  }
}

// GET /api/departments/:id
export const getDepartmentById = async (req, res) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query(
      'SELECT id, name, description, status, created_at, updated_at FROM departments WHERE id = ?',
      [req.params.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' })
    }
    res.json({ success: true, department: rows[0] })
  } catch (error) {
    console.error('Error fetching department:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch department', error: error.message })
  }
}

// POST /api/departments
export const createDepartment = async (req, res) => {
  try {
    const { name, description = '', status = 'Active' } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' })
    }

    const pool = getPool()

    // Check duplicate
    const [existing] = await pool.query('SELECT id FROM departments WHERE name = ?', [name.trim()])
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Department name already exists' })
    }

    const [result] = await pool.query(
      'INSERT INTO departments (name, description, status) VALUES (?, ?, ?)',
      [name.trim(), description.trim(), status || 'Active']
    )

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      departmentId: result.insertId
    })
  } catch (error) {
    console.error('Error creating department:', error)
    res.status(500).json({ success: false, message: 'Failed to create department', error: error.message })
  }
}

// PUT /api/departments/:id
export const updateDepartment = async (req, res) => {
  try {
    const { name, description = '', status = 'Active' } = req.body
    const deptId = req.params.id

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' })
    }

    const pool = getPool()

    // Check duplicate with another id
    const [existing] = await pool.query('SELECT id FROM departments WHERE name = ? AND id != ?', [name.trim(), deptId])
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Department name already in use by another department' })
    }

    await pool.query(
      'UPDATE departments SET name = ?, description = ?, status = ? WHERE id = ?',
      [name.trim(), description.trim(), status || 'Active', deptId]
    )

    res.json({ success: true, message: 'Department updated successfully' })
  } catch (error) {
    console.error('Error updating department:', error)
    res.status(500).json({ success: false, message: 'Failed to update department', error: error.message })
  }
}

// DELETE /api/departments/:id
export const deleteDepartment = async (req, res) => {
  try {
    const deptId = req.params.id
    const pool = getPool()

    await pool.query('DELETE FROM departments WHERE id = ?', [deptId])
    res.json({ success: true, message: 'Department deleted successfully' })
  } catch (error) {
    console.error('Error deleting department:', error)
    res.status(500).json({ success: false, message: 'Failed to delete department', error: error.message })
  }
}
