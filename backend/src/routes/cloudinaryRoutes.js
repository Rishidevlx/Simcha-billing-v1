import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  getCloudinaryConfig,
  saveCloudinaryConfig,
  testCloudinaryConnection,
  uploadMedia
} from '../controllers/cloudinaryController.js'

const router = express.Router()

// Protect all cloudinary routes with JWT verification
router.use(verifyToken)

router.get('/config', getCloudinaryConfig)
router.post('/config', saveCloudinaryConfig)
router.post('/test', testCloudinaryConnection)
router.post('/upload', uploadMedia)

export default router
