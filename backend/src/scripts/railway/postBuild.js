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

console.log('Installing dependencies in .medusa/server...')
execSync('pnpm install --prod --dangerously-allow-all-builds', {
  cwd: MEDUSA_SERVER_PATH,
  stdio: 'inherit'
})

const patchesPath = path.join(process.cwd(), 'patches')
if (fs.existsSync(patchesPath) && !process.env.MEDUSA_PUBLISHABLE_KEY) {
  console.log('No MEDUSA_PUBLISHABLE_KEY detected. Applying auto-resolve patch...')
  const targetPatchesPath = path.join(MEDUSA_SERVER_PATH, 'patches')
  fs.cpSync(patchesPath, targetPatchesPath, { recursive: true })

  console.log('Applying patches in .medusa/server...')
  execSync('npx patch-package', {
    cwd: MEDUSA_SERVER_PATH,
    stdio: 'inherit'
  })
} else {
  console.log('Skipping patches: MEDUSA_PUBLISHABLE_KEY set')
}