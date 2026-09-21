import express from 'express'
import {
  getCloudinaryConfig,
  saveCloudinaryConfig,
  testCloudinaryConnection,
  uploadMedia
} from '../controllers/cloudinaryController.js'

const router = express.Router()

router.get('/config', getCloudinaryConfig)
router.post('/config', saveCloudinaryConfig)
router.post('/test', testCloudinaryConnection)
router.post('/upload', uploadMedia)

export default router
