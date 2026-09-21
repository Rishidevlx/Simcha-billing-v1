import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import materialRoutes from './routes/materialRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import billRoutes from './routes/billRoutes.js'
import emailRoutes from './routes/emailRoutes.js'
import inwardRoutes from './routes/inwardRoutes.js'
import cloudinaryRoutes from './routes/cloudinaryRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Comprehensive CORS configuration to prevent any cross-domain CORS errors
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}))
app.options('*', cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Ensure TiDB Database Connection in Serverless & Local environments
app.use(async (req, res, next) => {
  try {
    await initDatabase()
    next()
  } catch (err) {
    console.error('Serverless TiDB connection middleware error:', err)
    res.status(500).json({ success: false, message: 'Database connection failed: ' + err.message })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Simcha Billing API is running smoothly!' })
})

// Routes
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


// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err)
  res.status(500).json({ success: false, message: 'Internal Server Error' })
})

// Start Server after connecting to TiDB (Local Development)
async function startServer() {
  try {
    await initDatabase()
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
  }
}

if (!process.env.VERCEL) {
  startServer()
}

export default app

