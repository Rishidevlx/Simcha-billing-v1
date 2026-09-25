import { getPool } from '../config/db.js'

// GET /api/roles
export const getRoles = async (req, res) => {
  try {
    const pool = getPool()
    const [roles] = await pool.query('SELECT * FROM roles ORDER BY created_at DESC')
    
    // Parse JSON fields
    const formattedRoles = roles.map(role => ({
      ...role,
      permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions,
      admin_access: typeof role.admin_access === 'string' ? JSON.parse(role.admin_access) : role.admin_access
    }))

    res.json({ success: true, roles: formattedRoles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch roles', error: error.message })
  }
}

// GET /api/roles/:id
export const getRoleById = async (req, res) => {
  try {
    const pool = getPool()
    const [roles] = await pool.query('SELECT * FROM roles WHERE id = ?', [req.params.id])
    
    if (roles.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' })
    }

    const role = {
      ...roles[0],
      permissions: typeof roles[0].permissions === 'string' ? JSON.parse(roles[0].permissions) : roles[0].permissions,
      admin_access: typeof roles[0].admin_access === 'string' ? JSON.parse(roles[0].admin_access) : roles[0].admin_access
    }

    res.json({ success: true, role })
  } catch (error) {
    console.error('Error fetching role:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch role details', error: error.message })
  }
}

// POST /api/roles
export const createRole = async (req, res) => {
  try {
    const { name, description, permissions, admin_access, status = 'Active' } = req.body

    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required' })
    }

    const pool = getPool()

    // Check if role name already exists
    const [existing] = await pool.query('SELECT id FROM roles WHERE name = ?', [name])
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Role name already exists' })
    }

    const [result] = await pool.query(
      'INSERT INTO roles (name, description, permissions, admin_access, status) VALUES (?, ?, ?, ?, ?)',
      [
        name,
        description || '',
        JSON.stringify(permissions || {}),
        JSON.stringify(admin_access || []),
        status
      ]
    )

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      roleId: result.insertId
    })
  } catch (error) {
    console.error('Error creating role:', error)
    res.status(500).json({ success: false, message: 'Failed to create role', error: error.message })
  }
}

// PUT /api/roles/:id
export const updateRole = async (req, res) => {
  try {
    const { name, description, permissions, admin_access, status } = req.body
    const roleId = req.params.id

    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required' })
    }

    const pool = getPool()

    // Fetch existing role
    const [existingRoleRows] = await pool.query('SELECT * FROM roles WHERE id = ?', [roleId])
    if (existingRoleRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' })
    }

    const existingRole = existingRoleRows[0]
    const isSystemAdmin = existingRole.name === 'Administrator'

    // Check if role name exists for other roles
    const [existing] = await pool.query('SELECT id FROM roles WHERE name = ? AND id != ?', [name, roleId])
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Role name already exists' })
    }

    // Protect Administrator: keep name and active status
    const finalName = isSystemAdmin ? 'Administrator' : name
    const finalStatus = isSystemAdmin ? 'Active' : (status || 'Active')

    await pool.query(
      'UPDATE roles SET name = ?, description = ?, permissions = ?, admin_access = ?, status = ? WHERE id = ?',
      [
        finalName,
        description || '',
        JSON.stringify(permissions || {}),
        JSON.stringify(admin_access || []),
        finalStatus,
        roleId
      ]
    )

    res.json({ success: true, message: 'Role updated successfully' })
  } catch (error) {
    console.error('Error updating role:', error)
    res.status(500).json({ success: false, message: 'Failed to update role', error: error.message })
  }
}

// PATCH /api/roles/:id/status
export const toggleRoleStatus = async (req, res) => {
  try {
    const roleId = req.params.id
    const pool = getPool()

    const [rows] = await pool.query('SELECT id, name, status FROM roles WHERE id = ?', [roleId])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Role not found' })
    }

    const role = rows[0]

    // Protect Administrator role
    if (role.name === 'Administrator') {
      return res.status(400).json({
        success: false,
        message: 'Administrator is a protected system role and cannot be deactivated.'
      })
    }

    const newStatus = role.status === 'Active' ? 'Inactive' : 'Active'

    await pool.query('UPDATE roles SET status = ? WHERE id = ?', [newStatus, roleId])

    res.json({
      success: true,
      message: `Role status changed to ${newStatus}`,
      status: newStatus
    })
  } catch (error) {
    console.error('Error toggling role status:', error)
    res.status(500).json({ success: false, message: 'Failed to toggle role status', error: error.message })
  }
}

// DELETE /api/roles/:id
export const deleteRole = async (req, res) => {
  try {
    const roleId = req.params.id
    const pool = getPool()

    // Prevent deleting Administrator role
    const [role] = await pool.query('SELECT name FROM roles WHERE id = ?', [roleId])
    if (role.length > 0 && role[0].name === 'Administrator') {
      return res.status(400).json({ success: false, message: 'Administrator is a protected system role and cannot be deleted.' })
    }

    // Check if any users are assigned to this role
    if (role.length > 0) {
      const [users] = await pool.query('SELECT id FROM users WHERE role = ?', [role[0].name])
      if (users.length > 0) {
        return res.status(400).json({ success: false, message: `Cannot delete role because ${users.length} user(s) are currently assigned to it.` })
      }
    }

    await pool.query('DELETE FROM roles WHERE id = ?', [roleId])

    res.json({ success: true, message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error deleting role:', error)
    res.status(500).json({ success: false, message: 'Failed to delete role', error: error.message })
  }
}
