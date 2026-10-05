import express from 'express'
import {
  getNextQuotationNumber,
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  sendQuotationEmailController,
  convertQuotationToInvoice
} from '../controllers/quotationController.js'

const router = express.Router()

router.get('/', getAllQuotations)
router.post('/', createQuotation)
router.get('/next-number', getNextQuotationNumber)
router.get('/meta/next-number', getNextQuotationNumber)
router.get('/:id', getQuotationById)
router.put('/:id', updateQuotation)
router.patch('/:id/status', updateQuotationStatus)
router.post('/:id/send-email', sendQuotationEmailController)
router.post('/:id/convert-to-invoice', convertQuotationToInvoice)
router.delete('/:id', deleteQuotation)

export default router
