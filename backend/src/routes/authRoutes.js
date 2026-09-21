import express from 'express'
import { login, getMe, updateProfile, changePassword } from '../controllers/authController.js'

const router = express.Router()

router.post('/login', login)
router.get('/me', getMe)
router.put('/profile', updateProfile)
router.post('/change-password', changePassword)

export default router

