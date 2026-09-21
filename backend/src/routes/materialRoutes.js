import express from 'express'
import {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  bulkDeleteMaterials,
  verifySerialNumber
} from '../controllers/materialController.js'

const router = express.Router()

router.get('/', getMaterials)
router.get('/verify-serial/:serialNumber', verifySerialNumber)
router.get('/:id', getMaterialById)
router.post('/', createMaterial)
router.post('/bulk-delete', bulkDeleteMaterials)
router.put('/:id', updateMaterial)
router.delete('/:id', deleteMaterial)

export default router
