// macOS only: strip Gatekeeper quarantine from the Electron binary after npm install
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

if (process.platform !== 'darwin') process.exit(0)

const electronApp = path.join(
  __dirname,
  '../node_modules/electron/dist/Electron.app'
)

if (!fs.existsSync(electronApp)) {
  // Electron binary was trashed by Gatekeeper — reinstall it
  try {
    execSync('node ' + path.join(__dirname, '../node_modules/electron/install.js'), { stdio: 'inherit' })
  } catch (e) {
    console.warn('Could not reinstall Electron binary:', e.message)
    process.exit(0)
  }
}

try {
  execSync(`xattr -cr "${electronApp}"`, { stdio: 'inherit' })
  console.log('✓ Electron quarantine flag cleared (macOS)')
} catch (e) {
  console.warn('xattr failed (non-fatal):', e.message)
}
