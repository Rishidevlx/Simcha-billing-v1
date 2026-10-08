import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  getEmailConfig,
  updateEmailConfig,
  testSmtpConnection,
  dispatchBillEmail
} from '../controllers/emailController.js'

const router = express.Router()

// Protect all email config routes with JWT verification
router.use(verifyToken)

router.get('/', getEmailConfig)
router.post('/', updateEmailConfig)
router.post('/test', testSmtpConnection)
router.post('/send-bill/:billId', dispatchBillEmail)

export default router
