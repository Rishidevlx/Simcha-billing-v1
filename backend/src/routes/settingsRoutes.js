import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  getSettings,
  updateSettings,
  getThemeSettings,
  updateThemeSettings
} from '../controllers/settingsController.js'

const router = express.Router()

// Protect all settings routes with JWT verification
router.use(verifyToken)

router.get('/', getSettings)
router.put('/', updateSettings)
router.get('/theme', getThemeSettings)
router.put('/theme', updateThemeSettings)

export default router
