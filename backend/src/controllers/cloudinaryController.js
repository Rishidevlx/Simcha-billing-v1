import { v2 as cloudinary } from 'cloudinary'
import { getPool } from '../config/db.js'

// Helper to get active Cloudinary config from DB
async function getActiveCloudinaryInstance() {
  const pool = getPool()
  const [rows] = await pool.query('SELECT * FROM cloudinary_configs WHERE id = 1')
  if (rows.length === 0 || !rows[0].cloud_name || !rows[0].api_key || !rows[0].api_secret) {
    return { isConfigured: false, config: rows[0] || null }
  }

  const cfg = rows[0]
  cloudinary.config({
    cloud_name: cfg.cloud_name.trim(),
    api_key: cfg.api_key.trim(),
    api_secret: cfg.api_secret.trim(),
    secure: true
  })

  return { isConfigured: true, config: cfg, cloudinary }
}

// 1. Get Cloudinary Configuration
export async function getCloudinaryConfig(req, res) {
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT id, cloud_name, api_key, api_secret, folder_name, is_enabled, updated_at FROM cloudinary_configs WHERE id = 1')
    
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        config: {
          cloud_name: '',
          api_key: '',
          api_secret: '',
          folder_name: 'simcha_billing',
          is_enabled: true
        }
      })
    }

    return res.status(200).json({
      success: true,
      config: rows[0]
    })
  } catch (error) {
    console.error('Error fetching Cloudinary config:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve Cloudinary configurations.'
    })
  }
}

// 2. Save / Update Cloudinary Configuration
export async function saveCloudinaryConfig(req, res) {
  try {
    const { cloud_name, api_key, api_secret, folder_name = 'simcha_billing', is_enabled = true } = req.body
    const pool = getPool()

    await pool.query(`
      INSERT INTO cloudinary_configs (id, cloud_name, api_key, api_secret, folder_name, is_enabled)
      VALUES (1, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        cloud_name = VALUES(cloud_name),
        api_key = VALUES(api_key),
        api_secret = VALUES(api_secret),
        folder_name = VALUES(folder_name),
        is_enabled = VALUES(is_enabled)
    `, [
      (cloud_name || '').trim(),
      (api_key || '').trim(),
      (api_secret || '').trim(),
      (folder_name || 'simcha_billing').trim(),
      Boolean(is_enabled)
    ])

    return res.status(200).json({
      success: true,
      message: 'Cloudinary configuration updated successfully!'
    })
  } catch (error) {
    console.error('Error saving Cloudinary config:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to save Cloudinary configurations.'
    })
  }
}

// 3. Test Cloudinary Connection
export async function testCloudinaryConnection(req, res) {
  try {
    const { cloud_name, api_key, api_secret } = req.body
    let cName = cloud_name
    let aKey = api_key
    let aSecret = api_secret

    // If not provided in body, fallback to DB values
    if (!cName || !aKey || !aSecret) {
      const pool = getPool()
      const [rows] = await pool.query('SELECT * FROM cloudinary_configs WHERE id = 1')
      if (rows.length > 0) {
        cName = cName || rows[0].cloud_name
        aKey = aKey || rows[0].api_key
        aSecret = aSecret || rows[0].api_secret
      }
    }

    if (!cName || !aKey || !aSecret) {
      return res.status(400).json({
        success: false,
        message: 'Cloud Name, API Key, and API Secret are required to test connection.'
      })
    }

    cloudinary.config({
      cloud_name: cName.trim(),
      api_key: aKey.trim(),
      api_secret: aSecret.trim(),
      secure: true
    })

    const pingResult = await cloudinary.api.ping()
    if (pingResult && pingResult.status === 'ok') {
      return res.status(200).json({
        success: true,
        message: `Successfully connected to Cloudinary account "${cName}"!`
      })
    } else {
      return res.status(400).json({
        success: false,
        message: 'Could not connect to Cloudinary. Please verify your credentials.'
      })
    }
  } catch (error) {
    console.error('Cloudinary ping test failed:', error)
    return res.status(400).json({
      success: false,
      message: error.message || 'Cloudinary verification failed. Check Cloud Name and API Keys.'
    })
  }
}

// 4. Upload Media (Images, PDFs, Documents) using dynamic Cloudinary config
export async function uploadMedia(req, res) {
  try {
    const { file, folder, resource_type = 'auto' } = req.body

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file data provided for upload.'
      })
    }

    const { isConfigured, config } = await getActiveCloudinaryInstance()
    if (!isConfigured || !config.is_enabled) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary is not configured or disabled. Please update credentials in Configurations Settings.'
      })
    }

    const targetFolder = folder || config.folder_name || 'simcha_billing'

    const uploadOptions = {
      folder: targetFolder,
      resource_type: resource_type || 'auto'
    }

    const result = await cloudinary.uploader.upload(file, uploadOptions)

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
      message: 'File uploaded successfully to Cloudinary!'
    })
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file to Cloudinary: ' + (error.message || 'Unknown error')
    })
  }
}
