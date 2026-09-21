import { getPool } from '../config/db.js'

// Get All Categories (Chronological 1, 2, 3...)
export async function getAllCategories(req, res) {
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY id ASC')
    return res.status(200).json({
      success: true,
      categories: rows
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories.'
    })
  }
}

// Create Category
export async function createCategory(req, res) {
  try {
    const { name, status = 'Active' } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.'
      })
    }

    const pool = getPool()
    
    // Check if category name already exists
    const [existing] = await pool.query('SELECT id FROM categories WHERE LOWER(name) = ?', [name.trim().toLowerCase()])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists.'
      })
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, status) VALUES (?, ?)',
      [name.trim(), status === 'Inactive' ? 'Inactive' : 'Active']
    )

    const [newCat] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId])

    return res.status(201).json({
      success: true,
      message: 'Category created successfully!',
      category: newCat[0]
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create category.'
    })
  }
}

// Update Category
export async function updateCategory(req, res) {
  try {
    const { id } = req.params
    const { name, status } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.'
      })
    }

    const pool = getPool()

    // Check duplicate name for other ids
    const [duplicate] = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = ? AND id != ?',
      [name.trim().toLowerCase(), id]
    )
    if (duplicate.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Another category with this name already exists.'
      })
    }

    const [result] = await pool.query(
      'UPDATE categories SET name = ?, status = ? WHERE id = ?',
      [name.trim(), status === 'Inactive' ? 'Inactive' : 'Active', id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      })
    }

    const [updated] = await pool.query('SELECT * FROM categories WHERE id = ?', [id])

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully!',
      category: updated[0]
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update category.'
    })
  }
}

// Delete Category
export async function deleteCategory(req, res) {
  try {
    const { id } = req.params
    const pool = getPool()

    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully!'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete category.'
    })
  }
}
