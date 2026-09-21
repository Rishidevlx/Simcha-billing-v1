import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getPool } from '../config/db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'simcha_super_secret_jwt_key_2026'

// Login User
export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      })
    }

    const pool = getPool()
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()])

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      })
    }

    const user = rows[0]

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      })
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    })
  }
}

// Get Current Logged In User
export async function getMe(req, res) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided.'
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const pool = getPool()
    const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [decoded.id])

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      })
    }

    return res.status(200).json({
      success: true,
      user: rows[0]
    })
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    })
  }
}

// Update User Profile (User Name, Email, Designation/Role)
export async function updateProfile(req, res) {
  try {
    const { name, email, designation } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'User Name is required.'
      })
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email Address is required.'
      })
    }

    const pool = getPool()
    let userId = 1

    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, JWT_SECRET)
        userId = decoded.id
      } catch (err) {
        // fallback to user 1
      }
    }

    await pool.query(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [
        name.trim(),
        email.trim().toLowerCase(),
        designation?.trim() || 'Administrator',
        userId
      ]
    )

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: designation?.trim() || 'Administrator'
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    })
  }
}

// Change User Password
export async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      })
    }

    const pool = getPool()
    let userId = 1

    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, JWT_SECRET)
        userId = decoded.id
      } catch (err) {
        // fallback
      }
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId])
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      })
    }

    const user = rows[0]
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password. Please try again.'
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId])

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully!'
    })
  } catch (error) {
    console.error('Change password error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.'
    })
  }
}

