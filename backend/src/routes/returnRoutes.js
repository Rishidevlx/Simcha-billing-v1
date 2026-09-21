import express from 'express'
import {
  getNextReturnNumber,
  getAllReturns,
  getReturnById,
  createReturn,
  processQcDecision,
  deleteReturn
} from '../controllers/returnController.js'

const router = express.Router()

router.get('/', getAllReturns)
router.get('/meta/next-number', getNextReturnNumber)
router.get('/:id', getReturnById)
router.post('/', createReturn)
router.put('/:id/qc', processQcDecision)
router.delete('/:id', deleteReturn)

export default router
