import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus
} from '../controllers/departmentController.js'

const router = express.Router()

// Protect all department routes with JWT verification
router.use(verifyToken)

router.get('/', getDepartments)
router.get('/:id', getDepartmentById)
router.post('/', createDepartment)
router.put('/:id', updateDepartment)
router.patch('/:id/status', toggleDepartmentStatus)
router.delete('/:id', deleteDepartment)

export default router

