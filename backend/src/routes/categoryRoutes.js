import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from '../controllers/categoryController.js'

const router = express.Router()

// Protect all category routes with JWT verification
router.use(verifyToken)

router.get('/', getAllCategories)
router.post('/', createCategory)
router.put('/:id', updateCategory)
router.patch('/:id/status', toggleCategoryStatus)
router.delete('/:id', deleteCategory)

export default router

