import express from 'express'
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus
} from '../controllers/departmentController.js'

const router = express.Router()

router.get('/', getDepartments)
router.get('/:id', getDepartmentById)
router.post('/', createDepartment)
router.put('/:id', updateDepartment)
router.patch('/:id/status', toggleDepartmentStatus)
router.delete('/:id', deleteDepartment)

export default router

