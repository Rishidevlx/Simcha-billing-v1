import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from '../backend/src/config/db.js'
import authRoutes from '../backend/src/routes/authRoutes.js'
import categoryRoutes from '../backend/src/routes/categoryRoutes.js'
import materialRoutes from '../backend/src/routes/materialRoutes.js'
import settingsRoutes from '../backend/src/routes/settingsRoutes.js'
import billRoutes from '../backend/src/routes/billRoutes.js'
import inwardRoutes from '../backend/src/routes/inwardRoutes.js'
import cloudinaryRoutes from '../backend/src/routes/cloudinaryRoutes.js'
import inventoryRoutes from '../backend/src/routes/inventoryRoutes.js'

dotenv.config()

const app = express()

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Database Connection Middleware for Serverless
let isDbReady = false
app.use(async (req, res, next) => {
  if (!isDbReady) {
    try {
      await initDatabase()
      isDbReady = true
    } catch (err) {
      console.error('Serverless TiDB connection error:', err)
    }
  }
  next()
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Simcha Billing Serverless API on Vercel is active!' })
})

// Registered Routes
app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/bills', billRoutes)
app.use('/api/inwards', inwardRoutes)
app.use('/api/cloudinary', cloudinaryRoutes)
app.use('/api/inventory', inventoryRoutes)


// Error Handler
app.use((err, req, res, next) => {
  console.error('API Serverless Error:', err)
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
})

export default app
