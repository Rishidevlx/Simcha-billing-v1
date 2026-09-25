import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from '../backend/src/config/db.js'
import authRoutes from '../backend/src/routes/authRoutes.js'
import categoryRoutes from '../backend/src/routes/categoryRoutes.js'
import materialRoutes from '../backend/src/routes/materialRoutes.js'
import settingsRoutes from '../backend/src/routes/settingsRoutes.js'
import billRoutes from '../backend/src/routes/billRoutes.js'
import emailRoutes from '../backend/src/routes/emailRoutes.js'
import inwardRoutes from '../backend/src/routes/inwardRoutes.js'
import cloudinaryRoutes from '../backend/src/routes/cloudinaryRoutes.js'
import inventoryRoutes from '../backend/src/routes/inventoryRoutes.js'
import serviceRoutes from '../backend/src/routes/serviceRoutes.js'
import returnRoutes from '../backend/src/routes/returnRoutes.js'
import aiRoutes from '../backend/src/routes/aiRoutes.js'
import rolesRoutes from '../backend/src/routes/rolesRoutes.js'
import usersRoutes from '../backend/src/routes/usersRoutes.js'
import departmentRoutes from '../backend/src/routes/departmentRoutes.js'

dotenv.config()

const app = express()

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}))
app.options('*', cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Database Connection Middleware for Serverless
app.use(async (req, res, next) => {
  try {
    await initDatabase()
    next()
  } catch (err) {
    console.error('Serverless TiDB connection error:', err)
    res.status(500).json({ success: false, message: 'Database connection failed: ' + err.message })
  }
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
app.use('/api/email-config', emailRoutes)
app.use('/api/cloudinary', cloudinaryRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/returns', returnRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/roles', rolesRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/departments', departmentRoutes)

// Error Handler
app.use((err, req, res, next) => {
  console.error('API Serverless Error:', err)
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
})

export default app

