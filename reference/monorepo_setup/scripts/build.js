import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('🚀 Building Simcha Billing Frontend...')
execSync('npm install && npm run build', {
  cwd: path.resolve('frontend'),
  stdio: 'inherit'
})

// Copy frontend/dist to root dist for Vercel root-level deployments
const frontendDist = path.resolve('frontend', 'dist')
const rootDist = path.resolve('dist')

if (fs.existsSync(frontendDist)) {
  fs.cpSync(frontendDist, rootDist, { recursive: true })
  console.log('✅ Successfully synced build output to ./dist')
}
