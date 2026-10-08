import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleStatus
} from '../controllers/rolesController.js'

const router = express.Router()

// Protect all roles routes with JWT verification
router.use(verifyToken)

router.get('/', getRoles)
router.get('/:id', getRoleById)
router.post('/', createRole)
router.put('/:id', updateRole)
router.patch('/:id/status', toggleRoleStatus)
router.delete('/:id', deleteRole)

export default router
