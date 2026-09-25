import express from 'express'
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

router.post('/login', login)
router.get('/me', getMe)
router.put('/profile', updateProfile)
router.post('/change-password', changePassword)
router.get('/verify-reset-token', verifyResetToken)
router.post('/reset-password', resetPasswordWithToken)
router.post('/forgot-password/send-otp', sendForgotPasswordOtp)
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp)

export default router

