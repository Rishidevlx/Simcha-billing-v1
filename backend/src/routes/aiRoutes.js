import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import {
  getAiConfig,
  updateAiConfig,
  testAiConnection,
  chatWithAi
} from '../controllers/aiController.js'

const router = express.Router()

// Protect all AI routes with JWT verification
router.use(verifyToken)

// Configuration endpoints
router.get('/config', getAiConfig)
router.put('/config', updateAiConfig)
router.post('/test', testAiConnection)

// Conversational Chatbot endpoint
router.post('/chat', chatWithAi)

export default router
