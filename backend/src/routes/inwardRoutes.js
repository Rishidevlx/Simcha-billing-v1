import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  getNextInwardNumber,
  createInwardBill,
  getAllInwardBills,
  getInwardBillById,
  updateInwardBill,
  deleteInwardBill
} from '../controllers/inwardController.js'

const router = express.Router()

// Protect all inward routes with JWT verification
router.use(verifyToken)

router.get('/meta/next-number', getNextInwardNumber)
router.post('/', createInwardBill)
router.get('/', getAllInwardBills)
router.get('/:id', getInwardBillById)
router.put('/:id', updateInwardBill)
router.delete('/:id', deleteInwardBill)

export default router

