import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  bulkDeleteMaterials,
  verifySerialNumber,
  toggleMaterialStatus
} from '../controllers/materialController.js'

const router = express.Router()

// Protect all material routes with JWT verification
router.use(verifyToken)

router.get('/', getMaterials)
router.get('/verify-serial/:serialNumber', verifySerialNumber)
router.get('/:id', getMaterialById)
router.post('/', createMaterial)
router.post('/bulk-delete', bulkDeleteMaterials)
router.put('/:id', updateMaterial)
router.patch('/:id/status', toggleMaterialStatus)
router.delete('/:id', deleteMaterial)

export default router

