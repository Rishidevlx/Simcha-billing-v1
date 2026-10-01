import express from 'express'
import {
  getSettings,
  updateSettings,
  getThemeSettings,
  updateThemeSettings
} from '../controllers/settingsController.js'

const router = express.Router()

router.get('/', getSettings)
router.put('/', updateSettings)
router.get('/theme', getThemeSettings)
router.put('/theme', updateThemeSettings)

export default router
