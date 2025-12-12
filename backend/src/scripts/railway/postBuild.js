const fs = require('fs')
const { execSync } = require('child_process')
const path = require('path')

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server')

if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  throw new Error(
    '.medusa/server directory not found. This indicates the Medusa build process failed. Please check for build errors.'
  )
}

const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  fs.copyFileSync(envPath, path.join(MEDUSA_SERVER_PATH, '.env'))
}

const patchesPath = path.join(process.cwd(), 'patches')
if (fs.existsSync(patchesPath) && !process.env.MEDUSA_PUBLISHABLE_KEY) {
  console.log('No MEDUSA_PUBLISHABLE_KEY detected. Applying auto-resolve patch...')
  const targetPatchesPath = path.join(MEDUSA_SERVER_PATH, 'patches')
  fs.cpSync(patchesPath, targetPatchesPath, { recursive: true })
} else {
  console.log('Skipping patches: MEDUSA_PUBLISHABLE_KEY set')
  
  // Remove patchedDependencies from package.json to prevent install failure
  const packageJsonPath = path.join(MEDUSA_SERVER_PATH, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (packageJson.pnpm && packageJson.pnpm.patchedDependencies) {
        console.log('Removing patchedDependencies from package.json')
        delete packageJson.pnpm;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      }
    } catch (e) {
      console.warn('Failed to clean package.json patchedDependencies:', e.message)
    }
  }
}

console.log('Installing dependencies in .medusa/server...')
execSync('pnpm install --prod --dangerously-allow-all-builds', {
  cwd: MEDUSA_SERVER_PATH,
  stdio: 'inherit'
})