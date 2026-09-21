import express from 'express'
import {
  getNextInvoiceNumber,
  getNextReceiptNumber,
  createBill,
  updateBill,
  getAllBills,
  getBillById,
  deleteBill,
  updateBillPayment,
  sendBillReceiptEmail
} from '../controllers/billController.js'

const router = express.Router()

router.get('/', getAllBills)
router.post('/', createBill)
router.get('/meta/next-number', getNextInvoiceNumber)
router.get('/meta/next-receipt-number', getNextReceiptNumber)
router.get('/:id', getBillById)
router.put('/:id', updateBill)
router.patch('/:id/payment', updateBillPayment)
router.put('/:id/payment', updateBillPayment)
router.post('/:id/send-receipt', sendBillReceiptEmail)
router.delete('/:id', deleteBill)

export default router


