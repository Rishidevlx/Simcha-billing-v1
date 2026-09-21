import express from 'express'
import {
  getEmailConfig,
  updateEmailConfig,
  testSmtpConnection,
  dispatchBillEmail
} from '../controllers/emailController.js'

const router = express.Router()

router.get('/', getEmailConfig)
router.post('/', updateEmailConfig)
router.post('/test', testSmtpConnection)
router.post('/send-bill/:billId', dispatchBillEmail)

export default router
