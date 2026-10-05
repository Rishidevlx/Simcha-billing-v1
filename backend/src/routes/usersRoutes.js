import express from 'express'
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resendInviteLink,
  toggleUserStatus
} from '../controllers/usersController.js'

const router = express.Router()

router.get('/', getUsers)
router.get('/:id', getUserById)
router.post('/', createUser)
router.post('/:id/resend-invite', resendInviteLink)
router.put('/:id', updateUser)
router.patch('/:id/status', toggleUserStatus)
router.delete('/:id', deleteUser)

export default router

