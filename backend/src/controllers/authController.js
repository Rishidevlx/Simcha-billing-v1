import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
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

    // Verify Account Status
    if (user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently inactive. Please contact administrator.'
      })
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      })
    }

    // Fetch Role Permissions and Status
    let admin_access = []
    let permissions = {}
    const [roles] = await pool.query('SELECT status, admin_access, permissions FROM roles WHERE name = ?', [user.role])
    if (roles.length > 0) {
      const roleRecord = roles[0]
      if (roleRecord.status === 'Inactive' && user.role !== 'Administrator') {
        return res.status(403).json({
          success: false,
          message: `Your assigned role ('${user.role}') has been deactivated by the administrator.`
        })
      }

      admin_access = typeof roleRecord.admin_access === 'string' 
        ? JSON.parse(roleRecord.admin_access) 
        : roleRecord.admin_access
      permissions = typeof roleRecord.permissions === 'string'
        ? JSON.parse(roleRecord.permissions)
        : roleRecord.permissions
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
        role: user.role,
        phone: user.phone || '',
        designation: user.designation || user.role || 'Administrator',
        avatar: user.avatar || 'default',
        admin_access,
        permissions
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
    const [rows] = await pool.query('SELECT id, name, email, role, phone, designation, avatar, status, created_at FROM users WHERE id = ?', [decoded.id])

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      })
    }

    const userData = rows[0]

    if (userData.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive.'
      })
    }

    let admin_access = []
    let permissions = {}
    const [roles] = await pool.query('SELECT admin_access, permissions FROM roles WHERE name = ?', [userData.role])
    if (roles.length > 0) {
      admin_access = typeof roles[0].admin_access === 'string' 
        ? JSON.parse(roles[0].admin_access) 
        : roles[0].admin_access
      permissions = typeof roles[0].permissions === 'string'
        ? JSON.parse(roles[0].permissions)
        : roles[0].permissions
    }

    userData.admin_access = admin_access
    userData.permissions = permissions
    userData.designation = userData.designation || userData.role || 'Administrator'
    userData.avatar = userData.avatar || 'default'

    return res.status(200).json({
      success: true,
      user: userData
    })
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    })
  }
}

// Update User Profile
export async function updateProfile(req, res) {
  try {
    const { name, email, designation, phone, avatar } = req.body

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

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided.'
      })
    }

    let userId
    try {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, JWT_SECRET)
      userId = decoded.id
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      })
    }

    const pool = getPool()

    // Check duplicate email for other users
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim().toLowerCase(), userId])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use by another user.'
      })
    }

    await pool.query(
      'UPDATE users SET name = ?, email = ?, designation = ?, phone = ?, avatar = ? WHERE id = ?',
      [
        name.trim(),
        email.trim().toLowerCase(),
        designation?.trim() || null,
        phone?.trim() || null,
        avatar || 'default',
        userId
      ]
    )

    const [updatedUsers] = await pool.query('SELECT id, name, email, role, phone, designation, avatar, status, created_at FROM users WHERE id = ?', [userId])
    const updatedUser = updatedUsers[0]

    let admin_access = []
    let permissions = {}
    const [roles] = await pool.query('SELECT admin_access, permissions FROM roles WHERE name = ?', [updatedUser.role])
    if (roles.length > 0) {
      admin_access = typeof roles[0].admin_access === 'string' 
        ? JSON.parse(roles[0].admin_access) 
        : roles[0].admin_access
      permissions = typeof roles[0].permissions === 'string'
        ? JSON.parse(roles[0].permissions)
        : roles[0].permissions
    }

    updatedUser.admin_access = admin_access
    updatedUser.permissions = permissions
    updatedUser.designation = updatedUser.designation || updatedUser.role || 'Administrator'
    updatedUser.avatar = updatedUser.avatar || 'default'

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
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

    // Extract userId from authenticated request or token
    let userId = req.user?.id

    if (!userId) {
      const authHeader = req.headers.authorization || req.headers['authorization']
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Valid authentication token required.'
        })
      }

      try {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, JWT_SECRET)
        userId = decoded.id
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid or expired token.'
        })
      }
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required.'
      })
    }

    const pool = getPool()
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

// Verify 15-Minute Reset / Setup Token
export async function verifyResetToken(req, res) {
  try {
    const { token, email } = req.query

    if (!token || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Password setup token is required.'
      })
    }

    const pool = getPool()
    const [rows] = await pool.query(`
      SELECT prt.*, u.email, u.name, u.role
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ?
      ORDER BY prt.created_at DESC
      LIMIT 1
    `, [token.trim()])

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        expired: false,
        message: 'Invalid or unknown password setup link.'
      })
    }

    const tokenRecord = rows[0]

    // Verify email match if provided
    if (email && email.trim() && tokenRecord.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Email does not match this setup link.'
      })
    }

    // Check if token was already used
    if (tokenRecord.is_used) {
      return res.status(400).json({
        success: false,
        alreadyUsed: true,
        message: 'This setup link has already been used. Please log in or request a new link.'
      })
    }

    // Check 15-minute expiration
    const now = new Date()
    const expiresAt = new Date(tokenRecord.expires_at)
    const remainingMs = expiresAt.getTime() - now.getTime()

    if (remainingMs <= 0) {
      return res.status(400).json({
        success: false,
        expired: true,
        message: 'This setup link has expired (15-minute validity window exceeded). Please contact your administrator to generate a new link.'
      })
    }

    const remainingSeconds = Math.floor(remainingMs / 1000)

    return res.status(200).json({
      success: true,
      valid: true,
      email: tokenRecord.email,
      name: tokenRecord.name,
      role: tokenRecord.role,
      remainingSeconds,
      expiresAt: tokenRecord.expires_at
    })
  } catch (error) {
    console.error('Verify reset token error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to verify setup link.'
    })
  }
}

// Complete Password Reset / Setup via Token
export async function resetPasswordWithToken(req, res) {
  try {
    const { token, email, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      })
    }

    const pool = getPool()
    const [rows] = await pool.query(`
      SELECT prt.*, u.email, u.name
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ?
      ORDER BY prt.created_at DESC
      LIMIT 1
    `, [token.trim()])

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid setup token.'
      })
    }

    const tokenRecord = rows[0]

    // Verify email match if provided
    if (email && email.trim() && tokenRecord.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Email address does not match this token.'
      })
    }

    if (tokenRecord.is_used) {
      return res.status(400).json({
        success: false,
        message: 'This setup link has already been used.'
      })
    }

    // Check expiration
    const now = new Date()
    const expiresAt = new Date(tokenRecord.expires_at)
    if (now > expiresAt) {
      return res.status(400).json({
        success: false,
        expired: true,
        message: 'This setup link has expired. Please contact your administrator.'
      })
    }

    // Hash new password and update user
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, tokenRecord.user_id])
    await pool.query('UPDATE password_reset_tokens SET is_used = TRUE WHERE id = ?', [tokenRecord.id])

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully set! You can now log in with your new credentials.'
    })
  } catch (error) {
    console.error('Reset password with token error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.'
    })
  }
}

// -------------------------------------------------------------
// FORGOT PASSWORD: STEP 1 - SEND 6-DIGIT OTP
// -------------------------------------------------------------
export async function sendForgotPasswordOtp(req, res) {
  try {
    const { email } = req.body

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your registered email address.'
      })
    }

    const cleanEmail = email.trim().toLowerCase()
    const pool = getPool()

    // 1. Verify user exists and is Active
    const [userRows] = await pool.query(
      'SELECT id, name, email, status FROM users WHERE LOWER(email) = ?',
      [cleanEmail]
    )

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'This email address is not registered in our system.'
      })
    }

    const user = userRows[0]

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'This account is currently inactive. Please contact administrator.'
      })
    }

    // 2. Generate 6-Digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // 3. Invalidate previous unused OTPs for this user
    await pool.query(
      'UPDATE password_otps SET is_used = TRUE WHERE user_id = ? AND is_used = FALSE',
      [user.id]
    )

    // 4. Save new OTP (5-minute expiry calculated via JS Date)
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000)
    await pool.query(`
      INSERT INTO password_otps (user_id, email, otp_code, expires_at, is_used, attempts)
      VALUES (?, ?, ?, ?, FALSE, 0)
    `, [user.id, cleanEmail, otpCode, otpExpiresAt])

    // 5. Send OTP Email via Nodemailer
    const [emailConfigs] = await pool.query('SELECT * FROM email_configs WHERE id = 1')
    if (emailConfigs.length > 0 && emailConfigs[0].smtp_user) {
      const config = emailConfigs[0]
      try {
        const transporter = nodemailer.createTransport({
          host: config.smtp_host || 'smtp.gmail.com',
          port: parseInt(config.smtp_port, 10) || 465,
          secure: Number(config.smtp_port) === 465 || Boolean(config.smtp_secure),
          auth: {
            user: config.smtp_user ? config.smtp_user.trim() : '',
            pass: config.smtp_pass ? config.smtp_pass.trim() : ''
          }
        })

        const companyDisplayName = config.sender_name || 'Simcha Info Solutions'

        const mailOptions = {
          from: `"${companyDisplayName}" <${config.smtp_user}>`,
          to: cleanEmail,
          subject: `Your Password Reset Verification Code - ${companyDisplayName}`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #043486; padding: 20px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">${companyDisplayName.toUpperCase()}</h1>
                <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Password Reset Verification</p>
              </div>
              
              <div style="padding: 24px; color: #334155; line-height: 1.5; text-align: center;">
                <h2 style="color: #0f172a; font-size: 16px; margin-top: 0;">Hello, ${user.name}!</h2>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 18px;">
                  Use the 6-digit verification code below to authorize your password reset request:
                </p>

                <!-- OTP Code Display -->
                <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 14px 32px; margin: 12px 0;">
                  <span style="font-family: monospace, Courier; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #043486;">
                    ${otpCode}
                  </span>
                </div>

                <p style="font-size: 12px; font-weight: 600; color: #dc2626; margin-top: 14px; margin-bottom: 0;">
                  ⏱️ Valid for 5 minutes only. Do not share this code with anyone.
                </p>
              </div>

              <div style="background-color: #f8fafc; padding: 12px 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                If you didn't request a password reset, you can safely ignore this email.
              </div>
            </div>
          `
        }

        await transporter.sendMail(mailOptions)
        console.log(`📧 [SUCCESS] OTP email dispatched to ${cleanEmail}`);
      } catch (mailErr) {
        console.error('❌ SMTP Mail send error:', mailErr)
        console.log(`🔑 [DEV BACKUP OTP]: ${otpCode} for ${cleanEmail}`)
      }
    } else {
      console.log(`🔑 [DEV BACKUP OTP (No SMTP)]: ${otpCode} for ${cleanEmail}`)
    }

    return res.status(200).json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email.'
    })
  } catch (error) {
    console.error('Send forgot password OTP error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process verification code.'
    })
  }
}

// -------------------------------------------------------------
// FORGOT PASSWORD: STEP 2 - VERIFY OTP & SEND 15-MIN RESET LINK
// -------------------------------------------------------------
export async function verifyForgotPasswordOtp(req, res) {
  try {
    const { email, otp } = req.body

    if (!email || !otp || !otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and 6-digit OTP.'
      })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanOtp = otp.trim()
    const pool = getPool()

    // 1. Fetch latest active OTP for this email
    const [otpRows] = await pool.query(`
      SELECT po.*, u.name, u.id as user_id, u.role
      FROM password_otps po
      JOIN users u ON po.user_id = u.id
      WHERE LOWER(po.email) = ? AND po.is_used = FALSE
      ORDER BY po.created_at DESC
      LIMIT 1
    `, [cleanEmail])

    if (otpRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found. Please request a new code.'
      })
    }

    const otpRecord = otpRows[0]

    // 2. Check maximum incorrect attempts (max 4 attempts)
    if (otpRecord.attempts >= 4) {
      await pool.query('UPDATE password_otps SET is_used = TRUE WHERE id = ?', [otpRecord.id])
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new verification code.'
      })
    }

    // 3. Check 5-minute expiration
    const now = new Date()
    const expiresAt = new Date(otpRecord.expires_at)
    if (now > expiresAt) {
      await pool.query('UPDATE password_otps SET is_used = TRUE WHERE id = ?', [otpRecord.id])
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired (5-minute limit exceeded). Please request a new code.'
      })
    }

    // 4. Verify Code
    if (otpRecord.otp_code !== cleanOtp) {
      await pool.query('UPDATE password_otps SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id])
      const remainingAttempts = 4 - (otpRecord.attempts + 1)
      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0 
          ? `Incorrect code. ${remainingAttempts} attempts remaining.`
          : 'Too many incorrect attempts. Please request a new code.'
      })
    }

    // 5. Mark OTP as used
    await pool.query('UPDATE password_otps SET is_used = TRUE WHERE id = ?', [otpRecord.id])

    // 6. Generate 15-Minute Password Reset Token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const resetToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    // Invalidate previous reset tokens for this user
    await pool.query(
      'UPDATE password_reset_tokens SET is_used = TRUE WHERE user_id = ? AND is_used = FALSE',
      [otpRecord.user_id]
    )

    // Insert 15-Minute Token (calculated via JS Date)
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await pool.query(`
      INSERT INTO password_reset_tokens (user_id, token, expires_at, is_used)
      VALUES (?, ?, ?, FALSE)
    `, [otpRecord.user_id, resetToken, resetTokenExpiresAt])

    const origin = process.env.APP_URL || process.env.FRONTEND_URL || req.get('origin') || (req.get('host') ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5173')
    const resetLink = `${origin.replace(/\/+$/, '')}/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`

    // 7. Dispatch 15-Minute Password Reset Email
    const [emailConfigs] = await pool.query('SELECT * FROM email_configs WHERE id = 1')
    if (emailConfigs.length > 0 && emailConfigs[0].smtp_user) {
      const config = emailConfigs[0]
      try {
        const transporter = nodemailer.createTransport({
          host: config.smtp_host || 'smtp.gmail.com',
          port: parseInt(config.smtp_port, 10) || 465,
          secure: Number(config.smtp_port) === 465 || Boolean(config.smtp_secure),
          auth: {
            user: config.smtp_user ? config.smtp_user.trim() : '',
            pass: config.smtp_pass ? config.smtp_pass.trim() : ''
          }
        })

        const companyDisplayName = config.sender_name || 'Simcha Info Solutions'

        const mailOptions = {
          from: `"${companyDisplayName}" <${config.smtp_user}>`,
          to: cleanEmail,
          subject: `Password Reset Link - ${companyDisplayName}`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #043486; padding: 20px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">${companyDisplayName.toUpperCase()}</h1>
                <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Secure Password Reset</p>
              </div>
              
              <div style="padding: 24px; color: #334155; line-height: 1.5; text-align: center;">
                <h2 style="color: #0f172a; font-size: 16px; margin-top: 0;">Hello, ${otpRecord.name}!</h2>
                <p style="font-size: 13px; color: #64748b; margin-bottom: 22px;">
                  Your identity has been verified with OTP. Click the button below to set your new password:
                </p>

                <!-- Action Button -->
                <div style="margin: 24px 0;">
                  <a href="${resetLink}" style="display: inline-block; background-color: #043486; color: #ffffff; font-size: 13px; font-weight: bold; padding: 12px 28px; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(4, 52, 134, 0.2);">
                    Reset Your Password Now →
                  </a>
                </div>

                <p style="font-size: 12px; font-weight: 600; color: #dc2626; margin-top: 14px; margin-bottom: 0;">
                  ⏱️ Security Note: This password reset link is valid for 15 minutes only.
                </p>
              </div>

              <div style="background-color: #f8fafc; padding: 12px 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                If you did not make this request, please contact your administrator immediately.
              </div>
            </div>
          `
        }

        await transporter.sendMail(mailOptions)
        console.log(`📧 [SUCCESS] Password reset link email dispatched to ${cleanEmail}`);
      } catch (mailErr) {
        console.error('❌ SMTP Mail send error:', mailErr)
        console.log(`🔗 [DEV BACKUP RESET LINK]: ${resetLink}`)
      }
    } else {
      console.log(`🔗 [DEV BACKUP RESET LINK (No SMTP)]: ${resetLink}`)
    }

    return res.status(200).json({
      success: true,
      message: 'Verification successful! A 15-minute password reset link has been dispatched to your email.'
    })
  } catch (error) {
    console.error('Verify forgot password OTP error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to verify code. Please try again.'
    })
  }
}

