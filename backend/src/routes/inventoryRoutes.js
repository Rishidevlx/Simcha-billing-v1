import express from 'express'
import {
  getInventory,
  getLedger,
  adjustStock,
  updateReorderLevel,
  updateStockAndThreshold,
  getMaterialSerials,
  getScrapInventory
} from '../controllers/inventoryController.js'

const router = express.Router()

router.get('/', getInventory)
router.get('/ledger', getLedger)
router.get('/scrap', getScrapInventory)
router.get('/serials/:materialId', getMaterialSerials)
router.post('/adjust', adjustStock)
router.put('/reorder-level', updateReorderLevel)
router.put('/update-stock-threshold', updateStockAndThreshold)

export default router
