import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { registerSmtpHandlers } from './handlers/smtp'
import { registerBlastHandlers } from './handlers/blast'
import { registerContactHandlers } from './handlers/contacts'
import { registerMsgHandlers } from './handlers/msgParser'
import { registerHistoryHandlers } from './handlers/history'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 700,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  createWindow()

  registerSmtpHandlers()
  registerBlastHandlers(() => mainWindow)
  registerContactHandlers()
  registerMsgHandlers()
  registerHistoryHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
