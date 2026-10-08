import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  login,
  getMe,
  updateProfile,
  changePassword,
  verifyResetToken,
  resetPasswordWithToken,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp
} from '../controllers/authController.js'

const router = express.Router()

// Public authentication routes
router.post('/login', login)
router.get('/verify-reset-token', verifyResetToken)
router.post('/reset-password', resetPasswordWithToken)
router.post('/forgot-password/send-otp', sendForgotPasswordOtp)
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp)

// Protected user profile routes
router.get('/me', verifyToken, getMe)
router.put('/profile', verifyToken, updateProfile)
router.post('/change-password', verifyToken, changePassword)

export default router

