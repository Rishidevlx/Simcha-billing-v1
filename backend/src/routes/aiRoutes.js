import express from 'express'
import {
  getAiConfig,
  updateAiConfig,
  testAiConnection,
  chatWithAi
} from '../controllers/aiController.js'

const router = express.Router()

// Configuration endpoints
router.get('/config', getAiConfig)
router.put('/config', updateAiConfig)
router.post('/test', testAiConnection)

// Conversational Chatbot endpoint
router.post('/chat', chatWithAi)

export default router
