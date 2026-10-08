import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'simcha_super_secret_jwt_key_2026'

/**
 * Middleware to verify JWT token on protected API routes
 */
export function verifyToken(req, res, next) {
  // Allow preflight CORS requests
  if (req.method === 'OPTIONS') {
    return next()
  }

  const authHeader = req.headers.authorization || req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      })
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.'
    })
  }
}

/**
 * Middleware to restrict access to specific roles (e.g. Administrator)
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of roles: ${allowedRoles.join(', ')}`
      })
    }

    next()
  }
}
