import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  getNextServiceNumber,
  createServiceBill,
  updateServiceBill,
  getServiceBills,
  getServiceBillById,
  updateServiceStatus,
  deleteServiceBill,
  sendServiceReceiptEmail,
  sendServiceQuotationEmailController,
  sendServiceInvoiceEmailController
} from '../controllers/serviceController.js'

const router = express.Router()

// Protect all service routes with JWT verification
router.use(verifyToken)

router.get('/next-number', getNextServiceNumber)
router.post('/', createServiceBill)
router.put('/:id', updateServiceBill)
router.get('/', getServiceBills)
router.get('/:id', getServiceBillById)
router.patch('/:id/status', updateServiceStatus)
router.delete('/:id', deleteServiceBill)
router.post('/:id/send-receipt', sendServiceReceiptEmail)
router.post('/:id/send-quotation', sendServiceQuotationEmailController)
router.post('/:id/send-invoice', sendServiceInvoiceEmailController)
router.post('/:id/send-email', sendServiceQuotationEmailController)

export default router
